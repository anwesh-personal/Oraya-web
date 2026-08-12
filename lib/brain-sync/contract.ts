import { createHash } from "crypto";

export const SYNCED_BRAIN_EMBEDDING_MODEL = "Qwen3-Embedding-0.6B" as const;

/** Pinned vector width for every embedding-bound faculty (KB, memory, KG). */
export const SYNCED_BRAIN_EMBEDDING_DIM = 1024 as const;

export const SYNCED_FACULTIES = [
    "core_prompt", "memory", "prompt_stack", "behavioral_rule", "training",
    "kb_doc", "kb_chunk", "goal", "reflection", "kg_entity", "kg_edge",
] as const;

/** Unit-separator delimiter for canonical identity strings. Must stay
 *  byte-identical to the Rust `\u{1f}` used in Orakhos `sync/brain.rs`. */
const KG_SEP = "\u001f";

/**
 * Canonical identity of a KG entity: `canonical_name`. This is the cross-surface
 * reconciliation key — the same entity extracted on any surface hashes to the same
 * content_hash, so entities upsert-by-canonical-name and an edge can always resolve its
 * endpoints by identity, never by a surface-local id.
 *
 * `entity_type` LEFT this identity in migration 058 (Plan 045). It is chosen fresh every
 * turn by a language model that is never shown what it chose last time, so including it
 * meant the same real entity arriving as `project` on one turn and `tool` on the next
 * hashed differently, missed the upsert, and became a second row — taking half of its
 * edges with it. The type still travels in the payload and is still stored; it is an
 * attribute, settled by last-write-wins like every other attribute.
 *
 * The payload shape is unchanged: `canonical_name` and `entity_type` have always been
 * separate fields here and both are still read. What changed is which of them the hash
 * is computed from — and because the hash IS the identity, this function and the
 * desktop's `enqueue_kg_entity` must agree. They are one protocol, versioned together.
 */
export function kgEntityIdentity(content: Record<string, unknown>): string | null {
    const canonical = content.canonical_name;
    if (typeof canonical !== "string" || !canonical) return null;
    return canonical;
}

/**
 * Canonical identity of a KG edge: the ordered tuple of both endpoint identities plus the
 * relationship type. Edges dedup by (source, type, target) across surfaces and carry NO
 * surface-local entity ids — they reference their endpoints by identity.
 *
 * The endpoint TYPES left this identity with the entity's, for the same reason and in the
 * same change: an edge whose endpoint the extractor happened to type differently on the
 * edge's turn than on the entity's turn would otherwise be a different edge, and its
 * retraction would miss it.
 */
export function kgEdgeIdentity(content: Record<string, unknown>): string | null {
    const sc = content.source_canonical;
    const tc = content.target_canonical;
    const rt = content.relationship_type;
    if ([sc, rt, tc].some((v) => typeof v !== "string" || !v)) return null;
    return [sc, rt, tc].join(KG_SEP);
}
export type SyncedFaculty = (typeof SYNCED_FACULTIES)[number];
export type BrainOrigin = "desktop" | "web" | "whatsapp" | "telegram" | "onprem" | "cloud";

export interface BrainMutationEnvelope {
    protocol_version: 1;
    mutation_id: string;
    agent_id: string;
    faculty: SyncedFaculty;
    operation: "upsert" | "tombstone";
    content: Record<string, unknown>;
    content_hash: string;
    /** AGL-001 leaf: SHA-256(input_hash||output_hash||model_id||timestamp). */
    governance_hash: string;
    timestamp: string;
    origin: BrainOrigin;
    revision: number;
    previous_content_hash?: string;
    tombstone: boolean;
    embedding_model: string;
}

const HEX_64 = /^[a-f0-9]{64}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export function sha256Utf8(value: string): string {
    return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Contract-C. Keep the four update calls and no separators byte-identical to Orakhos. */
export function computeGovernanceHash(
    inputHash: string,
    outputHash: string,
    modelId: string,
    timestamp: string,
): string {
    return createHash("sha256")
        .update(inputHash, "utf8")
        .update(outputHash, "utf8")
        .update(modelId, "utf8")
        .update(timestamp, "utf8")
        .digest("hex");
}

export function contentForFaculty(envelope: BrainMutationEnvelope): string | null {
    if (envelope.faculty === "core_prompt") {
        return typeof envelope.content.core_prompt === "string" ? envelope.content.core_prompt : null;
    }
    if (envelope.faculty === "memory") {
        return typeof envelope.content.content === "string" ? envelope.content.content : null;
    }
    // A KB chunk is content-addressed by its chunk TEXT only, exactly like memory:
    // the same text under the pinned model deterministically produces the same
    // vector, so text is the dedup identity. The vector rides in the payload but
    // is NOT hashed (proven bit-meaningful by round-trip test, model-bound via the
    // Contract-C model_id `brain.kb_chunk:<embedding_model>`).
    if (envelope.faculty === "kb_chunk") {
        return typeof envelope.content.content === "string" ? envelope.content.content : null;
    }
    // A KB doc is an edit-in-place source record; hash its full canonical payload.
    // Config records are edit-in-place and therefore hash their complete,
    // canonical JSON payload. Desktop uses serde_json's compact insertion order;
    // callers must construct these objects in the documented field order.
    if (envelope.faculty === "prompt_stack" || envelope.faculty === "behavioral_rule"
        || envelope.faculty === "training" || envelope.faculty === "kb_doc") {
        return JSON.stringify(envelope.content);
    }
    // KG faculties are content-addressed by their CANONICAL IDENTITY, not their
    // full payload: attributes (type, description, confidence, mention_count) are
    // LWW-merged and ride in the payload, but the dedup/reconciliation key is the
    // canonical name alone, so both surfaces converge on the same content_hash.
    if (envelope.faculty === "kg_entity") return kgEntityIdentity(envelope.content);
    if (envelope.faculty === "kg_edge") return kgEdgeIdentity(envelope.content);
    return null;
}

/**
 * Embedding-integrity gate for embedding-bound faculties. A KB chunk MUST carry a
 * float[1024] vector stamped with the pinned model; anything else is rejected
 * fail-loud (never re-embedded, never coerced). Returns null when acceptable.
 */
export function validateEmbeddingIntegrity(envelope: BrainMutationEnvelope): string | null {
    if (envelope.faculty !== "kb_chunk") return null;
    if (envelope.operation === "tombstone") return null;
    const model = envelope.content.embedding_model;
    if (model !== SYNCED_BRAIN_EMBEDDING_MODEL) {
        return `KB chunk vector is stamped with '${String(model)}', not the pinned '${SYNCED_BRAIN_EMBEDDING_MODEL}'`;
    }
    const vector = envelope.content.embedding;
    if (!Array.isArray(vector) || vector.length !== SYNCED_BRAIN_EMBEDDING_DIM) {
        return `KB chunk vector must be a ${SYNCED_BRAIN_EMBEDDING_DIM}-d array (got ${Array.isArray(vector) ? vector.length : typeof vector})`;
    }
    for (let i = 0; i < vector.length; i++) {
        if (typeof vector[i] !== "number" || !Number.isFinite(vector[i] as number)) {
            return `KB chunk vector element ${i} is not a finite number`;
        }
    }
    return null;
}

export function contractModelId(envelope: BrainMutationEnvelope): string {
    return `brain.${envelope.faculty}:${envelope.embedding_model}`;
}

export function validateBrainMutation(value: unknown): { ok: true; envelope: BrainMutationEnvelope } | { ok: false; error: string } {
    if (!value || typeof value !== "object") return { ok: false, error: "Envelope must be an object" };
    const e = value as Partial<BrainMutationEnvelope>;
    if (e.protocol_version !== 1 || typeof e.mutation_id !== "string" || !e.mutation_id) return { ok: false, error: "Unsupported or missing protocol_version/mutation_id" };
    if (typeof e.agent_id !== "string" || !e.agent_id) return { ok: false, error: "agent_id is required" };
    if (!SYNCED_FACULTIES.includes(e.faculty as SyncedFaculty)) return { ok: false, error: "Unsupported faculty" };
    if (e.operation !== "upsert" && e.operation !== "tombstone") return { ok: false, error: "Unsupported operation" };
    if (!e.content || typeof e.content !== "object" || Array.isArray(e.content)) return { ok: false, error: "content must be an object" };
    if (!HEX_64.test(e.content_hash || "") || !HEX_64.test(e.governance_hash || "")) return { ok: false, error: "content_hash and governance_hash must be lowercase SHA-256 hex" };
    if (typeof e.timestamp !== "string" || !ISO_UTC.test(e.timestamp) || Number.isNaN(Date.parse(e.timestamp))) return { ok: false, error: "timestamp must be canonical UTC RFC3339" };
    if (!["desktop", "web", "whatsapp", "telegram", "onprem", "cloud"].includes(e.origin || "")) return { ok: false, error: "Unknown origin" };
    if (!Number.isSafeInteger(e.revision) || (e.revision as number) < 1) return { ok: false, error: "revision must be a positive safe integer" };
    if (typeof e.tombstone !== "boolean" || e.tombstone !== (e.operation === "tombstone")) return { ok: false, error: "tombstone must match operation" };
    if (e.embedding_model !== SYNCED_BRAIN_EMBEDDING_MODEL) return { ok: false, error: "Embedding model mismatch" };

    const envelope = e as BrainMutationEnvelope;
    const canonicalContent = contentForFaculty(envelope);
    if (canonicalContent === null) return { ok: false, error: `Faculty payload unsupported in Foundation: ${envelope.faculty}` };
    if (sha256Utf8(canonicalContent) !== envelope.content_hash) return { ok: false, error: "content_hash does not match faculty content" };
    const embeddingError = validateEmbeddingIntegrity(envelope);
    if (embeddingError) return { ok: false, error: embeddingError };
    const inputHash = sha256Utf8(envelope.previous_content_hash || "");
    if (computeGovernanceHash(inputHash, envelope.content_hash, contractModelId(envelope), envelope.timestamp) !== envelope.governance_hash) {
        return { ok: false, error: "governance_hash is not the Contract-C leaf for this mutation" };
    }
    return { ok: true, envelope };
}

export const CONTRACT_C_VECTOR = {
    input_hash: sha256Utf8(""),
    output_hash: sha256Utf8("portable brain vector"),
    model_id: "brain.memory:Qwen3-Embedding-0.6B",
    timestamp: "2026-07-20T00:00:00Z",
    governance_hash: "36ef6a5ea31ac7b3d043cf87d8dbb1873927daf0965ea5bfe78c807a2b4d62a7",
} as const;
