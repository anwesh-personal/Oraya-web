/**
 * ASIS honesty invariant (061 §B.2) — SaaS fork.
 *
 * Run: npx tsx --test __tests__/asis-honesty.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    coerceVerifyForHonesty,
    configClaimKind,
    DEFAULT_HONESTY,
    deriveProofStatus,
    honestyFromApiBody,
    honestyFromHealth,
    isMockOrOffline,
    offlineVerifyResult,
    parseProverMode,
    proofStatusLabel,
    sanitizeEngineConfigForExport,
} from "../lib/asis-honesty";
import type { HonestyState, ProofStatusFields } from "../lib/asis-honesty";

function fakeRecord(over: Partial<ProofStatusFields> = {}): ProofStatusFields {
    return {
        verification_status: "verified_valid",
        pqc_valid: true,
        zkp_valid: true,
        ...over,
    };
}

describe("parseProverMode", () => {
    it("passes known values; junk is unknown; missing is offline", () => {
        assert.equal(parseProverMode("mock"), "mock");
        assert.equal(parseProverMode("cpu"), "cpu");
        assert.equal(parseProverMode("cuda"), "cuda");
        assert.equal(parseProverMode("renamed-later"), "unknown");
        assert.equal(parseProverMode(undefined), "offline");
    });
});

describe("honestyFromHealth", () => {
    it("does not invent cpu/cuda when the field is missing", () => {
        assert.deepEqual(honestyFromHealth(null), DEFAULT_HONESTY);
        assert.equal(honestyFromHealth({ status: "operational" }).proverMode, "offline");
        assert.deepEqual(honestyFromHealth({ prover_mode: "mock" }), {
            engineReachable: true,
            proverMode: "mock",
        });
    });
});

describe("honestyFromApiBody", () => {
    it("reads fail-open health (offline) without treating it as verified", () => {
        const h = honestyFromApiBody({
            success: true,
            offline: true,
            honesty: { engineReachable: false, proverMode: "offline" },
            data: { status: "offline", prover_mode: "offline" },
        });
        assert.equal(h.engineReachable, false);
        assert.equal(h.proverMode, "offline");
    });

    it("reads a live mock health payload", () => {
        const h = honestyFromApiBody({
            success: true,
            honesty: { engineReachable: true, proverMode: "mock" },
            data: { status: "operational", prover_mode: "mock" },
        });
        assert.equal(h.engineReachable, true);
        assert.equal(h.proverMode, "mock");
    });
});

describe("coerceVerifyForHonesty", () => {
    it("nulls zkp_valid on mock / offline / unknown even if the engine claimed true", () => {
        const claimed = { ...offlineVerifyResult(), pqc_valid: true, zkp_valid: true as boolean | null };
        for (const mode of ["mock", "offline", "unknown"] as const) {
            const honesty: HonestyState = { engineReachable: mode !== "offline", proverMode: mode };
            assert.equal(coerceVerifyForHonesty(claimed, honesty).zkp_valid, null, mode);
        }
    });

    it("keeps a real-prover true only when the engine is reachable", () => {
        const claimed = { pqc_valid: true, zkp_valid: true as boolean | null };
        const honesty: HonestyState = { engineReachable: true, proverMode: "cuda" };
        assert.equal(coerceVerifyForHonesty(claimed, honesty).zkp_valid, true);
    });
});

describe("deriveProofStatus", () => {
    it("never derives verified / ZKP / STARK / CISO-ready on mockish provers", () => {
        const record = fakeRecord();
        for (const mode of ["mock", "offline", "unknown"] as const) {
            const honesty: HonestyState = { engineReachable: mode !== "offline", proverMode: mode };
            const status = deriveProofStatus(record, honesty);
            assert.notEqual(status, "verified");
            assert.ok(isMockOrOffline(mode));
            const label = proofStatusLabel(status);
            assert.match(label, /Mock|Offline/i);
            assert.doesNotMatch(label, /CISO|STARK|ZKP/i);
            assert.doesNotMatch(label, /^Verified$/);
        }
    });

    it("requires a real prover AND pqc+zkp true for verified", () => {
        const honesty: HonestyState = { engineReachable: true, proverMode: "cpu" };
        assert.equal(deriveProofStatus(fakeRecord(), honesty), "verified");
        assert.equal(deriveProofStatus(fakeRecord({ zkp_valid: null }), honesty), "pending");
        assert.equal(deriveProofStatus(fakeRecord({ zkp_valid: false }), honesty), "invalid");
    });
});

describe("configClaimKind + export sanitize", () => {
    it("treats seeded config as target until a real prover is live", () => {
        assert.equal(configClaimKind(DEFAULT_HONESTY), "target");
        assert.equal(configClaimKind({ engineReachable: true, proverMode: "mock" }), "target");
        assert.equal(configClaimKind({ engineReachable: true, proverMode: "cuda" }), "live");
    });

    it("strips SOC2 / ISO from export so a CISO cannot read them as certified", () => {
        const sanitized = sanitizeEngineConfigForExport({
            "policy.attestation_protocol": {
                value: {
                    compliance_frameworks: ["SOC2 Type II", "ISO 27001"],
                },
            },
        });
        const value = (sanitized?.["policy.attestation_protocol"] as { value: Record<string, unknown> }).value;
        assert.equal(value.compliance_frameworks, undefined);
        assert.deepEqual(value.compliance_frameworks_target, ["SOC2 Type II", "ISO 27001"]);
        assert.equal(value.compliance_certified, false);
    });
});
