// ============================================================================
// agent-runtime / agl-hash — Protocol AGL-001 per-record governance hashing.
// ============================================================================
// VENDORED, BYTE-IDENTICAL copy of the canonical AGL-001 leaf. This scheme is
// intentionally duplicated (NOT shared via npm) across every polyglot producer
// so the same inference yields the same on-chain leaf everywhere it is recorded.
// Copied verbatim from the audited sources — do NOT reinvent or alter it here:
//
//   - orakhos-partner  src/lib/governance/agl-hash.ts  (Next.js reference)
//   - ainbox_pro       src/lib/governance/lineage.ts   computeGovernanceHash()
//   - myorayaspace     src/lib/xrpl.ts                  createGovernanceHash()
//   - orakhos (desktop, Rust) governance engine         GovernancePayload
//
// Formula (AGL-001):
//   input_hash      = SHA-256(input,  utf8)
//   output_hash     = SHA-256(output, utf8)
//   governance_hash = SHA-256( input_hash || output_hash || model_id || timestamp )
//
// Concatenation is by successive digest updates with NO separators. Any deviation
// (separators, ordering, encoding) would silently fork the leaf and break
// cross-producer verification. Callers MUST persist the SAME timestamp string
// they hash with so a verifier can recompute the leaf and detect tampering.
// Pure + deterministic; node:crypto only.
// ============================================================================

import { createHash } from "crypto";

/** SHA-256 hex of a UTF-8 string. Matches the Rust engine's `hash_content`. */
export function hashContent(content: string): string {
    return createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Combined AGL-001 governance hash. Order is significant and must match every
 * other producer exactly: input_hash → output_hash → model_id → timestamp.
 */
export function computeGovernanceHash(
    inputHash: string,
    outputHash: string,
    modelId: string,
    timestamp: string,
): string {
    return createHash("sha256")
        .update(inputHash)
        .update(outputHash)
        .update(modelId)
        .update(timestamp)
        .digest("hex");
}

export interface GovernanceLeaf {
    /** SHA-256(input). */
    inputHash: string;
    /** SHA-256(output) — also stored as `response_hash`. */
    outputHash: string;
    /** The bound model identifier the output is cryptographically tied to. */
    modelId: string;
    /** ISO timestamp bound into the leaf; persist this exact string. */
    timestamp: string;
    /** The canonical leaf: SHA-256(input_hash||output_hash||model_id||timestamp). */
    governanceHash: string;
}

/**
 * Compute the full AGL-001 leaf for one inference. Callers hash the raw input +
 * output here (never store raw content on the leaf) and MUST persist `timestamp`
 * verbatim alongside the components for later re-verification.
 */
export function governanceLeafForInference(p: {
    input: string;
    output: string;
    modelId: string;
    timestamp: string;
}): GovernanceLeaf {
    const inputHash = hashContent(p.input);
    const outputHash = hashContent(p.output);
    return {
        inputHash,
        outputHash,
        modelId: p.modelId,
        timestamp: p.timestamp,
        governanceHash: computeGovernanceHash(inputHash, outputHash, p.modelId, p.timestamp),
    };
}

/**
 * Re-verify a stored leaf by recomputing the governance hash from its component
 * fields. Returns false if any field was tampered with.
 */
export function verifyGovernanceLeaf(leaf: GovernanceLeaf): boolean {
    if (!leaf.governanceHash) return false;
    return (
        computeGovernanceHash(leaf.inputHash, leaf.outputHash, leaf.modelId, leaf.timestamp) ===
        leaf.governanceHash
    );
}
