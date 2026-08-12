/**
 * KG IDENTITY CONTRACT TEST (Plan 045, migration 058)
 *
 * The receiver re-derives every mutation's `content_hash` from its own idea of the
 * canonical identity and REJECTS the mutation when the two disagree. So this file is not
 * checking a helper — it is checking the one string that has to be byte-identical between
 * `lib/brain-sync/contract.ts` here and `sync/brain.rs` on the desktop. If they drift, KG
 * sync stops entirely, with a 400 per mutation and no data loss but no progress either.
 *
 * The expectations below are written as LITERALS rather than by calling the functions
 * back, so that changing the identity requires changing this file too, deliberately.
 *
 * Run: npx tsx --test __tests__/kg-identity.test.ts
 *
 * @module __tests__/kg-identity.test
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    kgEntityIdentity, kgEdgeIdentity, contentForFaculty, sha256Utf8,
    computeGovernanceHash, contractModelId, validateBrainMutation,
    SYNCED_BRAIN_EMBEDDING_MODEL,
} from "../lib/brain-sync/contract";
import type { BrainMutationEnvelope } from "../lib/brain-sync/contract";

const SEP = "\u001f";

/** A complete, correctly signed envelope whose `content_hash` is whatever the caller
 *  says it is — so a test can present the hash an OLD desktop would have sent. */
function envelopeHashing(
    faculty: "kg_entity" | "kg_edge",
    content: Record<string, unknown>,
    identityTheSenderHashed: string,
): BrainMutationEnvelope {
    const timestamp = "2026-08-12T00:00:00Z";
    const contentHash = sha256Utf8(identityTheSenderHashed);
    const envelope = {
        protocol_version: 1, mutation_id: "m1", agent_id: "ora", faculty,
        operation: "upsert", content, content_hash: contentHash,
        governance_hash: "", timestamp, origin: "desktop", revision: 1,
        tombstone: false, embedding_model: SYNCED_BRAIN_EMBEDDING_MODEL,
    } as unknown as BrainMutationEnvelope;
    envelope.governance_hash = computeGovernanceHash(
        sha256Utf8(""), contentHash, contractModelId(envelope), timestamp,
    );
    return envelope;
}

describe("KG entity identity", () => {
    it("is the canonical name alone", () => {
        assert.equal(
            kgEntityIdentity({ canonical_name: "oraya", entity_type: "project" }),
            "oraya",
        );
    });

    it("does not change when the entity type does", () => {
        // The defect this migration exists to fix: one turn says `project`, the next says
        // `tool`, and before 058 that produced two rows and split the entity's edges.
        const asProject = kgEntityIdentity({ canonical_name: "oraya", entity_type: "project" });
        const asTool = kgEntityIdentity({ canonical_name: "oraya", entity_type: "tool" });
        assert.equal(asProject, asTool);
    });

    it("still accepts a payload with no type at all", () => {
        // The type is now an attribute. A tombstone that names only the identity is valid.
        assert.equal(kgEntityIdentity({ canonical_name: "oraya" }), "oraya");
    });

    it("rejects a missing or empty canonical name", () => {
        assert.equal(kgEntityIdentity({ entity_type: "project" }), null);
        assert.equal(kgEntityIdentity({ canonical_name: "" }), null);
        assert.equal(kgEntityIdentity({ canonical_name: 7 }), null);
    });
});

describe("KG edge identity", () => {
    it("is source, relationship and target, unit-separated", () => {
        assert.equal(
            kgEdgeIdentity({
                source_canonical: "zara", source_entity_type: "person",
                target_canonical: "orakhos", target_entity_type: "project",
                relationship_type: "works_on",
            }),
            `zara${SEP}works_on${SEP}orakhos`,
        );
    });

    it("does not change when either endpoint type does", () => {
        const first = kgEdgeIdentity({
            source_canonical: "zara", source_entity_type: "person",
            target_canonical: "orakhos", target_entity_type: "project",
            relationship_type: "works_on",
        });
        const second = kgEdgeIdentity({
            source_canonical: "zara", source_entity_type: "agent",
            target_canonical: "orakhos", target_entity_type: "tool",
            relationship_type: "works_on",
        });
        assert.equal(first, second);
    });

    it("is directional", () => {
        const forward = kgEdgeIdentity({
            source_canonical: "a", target_canonical: "b", relationship_type: "uses",
        });
        const backward = kgEdgeIdentity({
            source_canonical: "b", target_canonical: "a", relationship_type: "uses",
        });
        assert.notEqual(forward, backward);
    });

    it("rejects an edge missing any of the three identifying fields", () => {
        assert.equal(kgEdgeIdentity({ source_canonical: "a", relationship_type: "uses" }), null);
        assert.equal(kgEdgeIdentity({ source_canonical: "a", target_canonical: "b" }), null);
        assert.equal(kgEdgeIdentity({ target_canonical: "b", relationship_type: "uses" }), null);
    });
});

describe("what the desktop must hash", () => {
    // These are the exact bytes `BrainOutbox::enqueue_kg_entity` / `enqueue_kg_edge`
    // feed to SHA-256 on the desktop. A change on either side breaks KG sync, so both
    // sides pin the value rather than computing it from the other.
    it("an entity hashes its canonical name", () => {
        const envelope = {
            faculty: "kg_entity",
            content: { canonical_name: "oraya", entity_type: "project", name: "Oraya" },
        } as unknown as BrainMutationEnvelope;
        assert.equal(contentForFaculty(envelope), "oraya");
        assert.equal(
            sha256Utf8(contentForFaculty(envelope) as string),
            "4a55e6b7aac8b2d3f5a28999a66ec1da083ecc4282f141a8a4567228eafaf403",
        );
    });

    it("an edge hashes source, relationship and target", () => {
        const envelope = {
            faculty: "kg_edge",
            content: {
                source_canonical: "zara", source_entity_type: "person",
                target_canonical: "orakhos", target_entity_type: "project",
                relationship_type: "works_on",
            },
        } as unknown as BrainMutationEnvelope;
        assert.equal(contentForFaculty(envelope), `zara${SEP}works_on${SEP}orakhos`);
        assert.equal(
            sha256Utf8(contentForFaculty(envelope) as string),
            "9add2ffb551a1d7bb4f8886c59a82ca99dc627690dee8b60ace723b03d611843",
        );
    });
});

describe("what happens if only one surface is upgraded", () => {
    // Plan 045 §3.2 argued the two surfaces could deploy INDEPENDENTLY, in either order,
    // because the payload shape does not change and the RPC stores the transmitted
    // content_hash rather than recomputing it (057:325). The payload part is true and the
    // RPC part is true. But the mutation never reaches the RPC: the HTTP route validates
    // the envelope first, and validation RE-DERIVES the hash and rejects a mismatch
    // (contract.ts:179). So the identity is a coupled deployment, and these tests exist to
    // state that in a form that cannot rot into an assumption.
    //
    // The failure mode is safe: a rejected mutation stays in the desktop outbox
    // unacknowledged and replays after the lagging surface catches up. Nothing is lost and
    // nothing is written twice. But KG sync makes no progress in the meantime, so the two
    // deployments have to be sequenced rather than left to drift.
    const content = { canonical_name: "oraya", entity_type: "project", name: "Oraya" };

    it("an upgraded desktop is accepted by this receiver", () => {
        const result = validateBrainMutation(envelopeHashing("kg_entity", content, "oraya"));
        assert.equal(result.ok, true);
    });

    it("a desktop still on the old identity is refused, and says why", () => {
        const oldIdentity = `oraya${SEP}project`;
        const result = validateBrainMutation(envelopeHashing("kg_entity", content, oldIdentity));
        assert.equal(result.ok, false);
        assert.equal(
            (result as { ok: false; error: string }).error,
            "content_hash does not match faculty content",
        );
    });

    it("the same is true of an edge", () => {
        const edge = {
            source_canonical: "zara", source_entity_type: "person",
            target_canonical: "orakhos", target_entity_type: "project",
            relationship_type: "works_on",
        };
        const oldIdentity = `zara${SEP}person${SEP}works_on${SEP}orakhos${SEP}project`;
        assert.equal(validateBrainMutation(envelopeHashing("kg_edge", edge, oldIdentity)).ok, false);
        assert.equal(
            validateBrainMutation(
                envelopeHashing("kg_edge", edge, `zara${SEP}works_on${SEP}orakhos`),
            ).ok,
            true,
        );
    });
});
