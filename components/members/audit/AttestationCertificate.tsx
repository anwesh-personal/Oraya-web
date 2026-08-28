"use client";

// ============================================================================
// AttestationCertificate — Full Verification Certificate View
// ============================================================================
// Complete cryptographic certificate for a single attestation. Loads all
// data from props (fetched server-side). Supports live re-verification
// against ASIS engine, JSON export, and copy-to-clipboard.
// ============================================================================

import { useState } from "react";
import { ShieldCheck, Download } from "lucide-react";
import type { AttestationRecord, EngineConfigMap, HonestyState, NoetherianGateDefinition } from "./types";
import { CryptoLayerCard } from "./CryptoLayerCard";
import { GovernanceLeafBreakdown } from "./GovernanceLeafBreakdown";
import { NoetherianGateCard } from "./NoetherianGateCard";
import {
    DEFAULT_HONESTY,
    coerceVerifyForHonesty,
    deriveProofStatus,
    isMockOrOffline,
    isRealProver,
    proofStatusLabel,
} from "@/lib/asis-honesty";

interface AttestationCertificateProps {
    attestation: AttestationRecord;
    config: EngineConfigMap;
    honesty?: HonestyState;
}

export function AttestationCertificate({
    attestation,
    config,
    honesty = DEFAULT_HONESTY,
}: AttestationCertificateProps) {
    const mockish = isMockOrOffline(honesty.proverMode) || !honesty.engineReachable;
    const derived = deriveProofStatus(attestation, honesty);
    const derivedLabel = proofStatusLabel(derived);
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<{
        pqc_valid: boolean;
        zkp_valid: boolean | null;
    } | null>(null);

    const policyConfig = config["policy.attestation_protocol"]?.value ?? {};
    const gateDefinitions: NoetherianGateDefinition[] =
        config["circuit.noetherian_gates"]?.value ?? [];

    const handleReverify = async () => {
        setVerifying(true);
        setVerifyResult(null);
        try {
            const res = await fetch("/api/asis/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attestation: {
                        payload: {
                            model_id: attestation.model_id,
                            timestamp: attestation.leaf_timestamp,
                            input_hash: attestation.input_hash,
                            output_hash: attestation.response_hash,
                            governance_hash: attestation.governance_hash,
                        },
                        signature: attestation.pqc_signature,
                        metadata: {
                            algorithm: attestation.pqc_algorithm,
                            signer_public_key: attestation.pqc_public_key,
                            jurisdiction: attestation.jurisdiction,
                        },
                    },
                    circuit_id: attestation.circuit_id,
                }),
            });
            const body = await res.json().catch(() => null);
            const raw = {
                pqc_valid: body?.data?.pqc_valid === true,
                zkp_valid: body?.data?.zkp_valid === true
                    ? true
                    : body?.data?.zkp_valid === false
                        ? false
                        : null,
            };
            const apiHonesty = body?.honesty && typeof body.honesty === "object"
                ? {
                    engineReachable: body.honesty.engineReachable === true,
                    proverMode: body.honesty.proverMode ?? honesty.proverMode,
                }
                : honesty;
            setVerifyResult(coerceVerifyForHonesty(raw, apiHonesty));
        } catch {
            // Verification failure is shown as null result
        } finally {
            setVerifying(false);
        }
    };

    const handleExportJSON = () => {
        const blob = new Blob([JSON.stringify(attestation, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `ASIS-Certificate-${attestation.id}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--surface-200)] pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border"
                            style={derived === "verified" ? {
                                backgroundColor: "color-mix(in srgb, var(--success) 10%, transparent)",
                                borderColor: "color-mix(in srgb, var(--success) 25%, transparent)",
                                color: "var(--success)",
                            } : {
                                backgroundColor: "color-mix(in srgb, var(--warning) 10%, transparent)",
                                borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)",
                                color: "var(--warning)",
                            }}
                        >
                            {derivedLabel}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[var(--surface-100)] text-[var(--surface-500)] border border-[var(--surface-200)]">
                            {attestation.jurisdiction}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--surface-900)] font-display">
                        Sovereign Attestation Certificate
                    </h1>
                    <p className="text-sm text-[var(--surface-500)]">
                        {mockish
                            ? `Attestation envelope. Prover is ${honesty.proverMode} — not a cryptographic proof.`
                            : derived === "verified"
                                ? `Verified against a live ${honesty.proverMode} prover.`
                                : derivedLabel
                        }
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleReverify}
                        disabled={verifying}
                        className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--surface-50)] hover:bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-700)] transition-all flex items-center gap-2 active:scale-95"
                    >
                        <ShieldCheck className={`w-4 h-4 text-[var(--success)] ${verifying ? "animate-spin" : ""}`} />
                        {verifying ? "Verifying..." : "Re-Verify Proof"}
                    </button>
                    <button
                        onClick={handleExportJSON}
                        className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--primary)] hover:opacity-90 text-white transition-all flex items-center gap-2 active:scale-95"
                        style={{
                            boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 30%, transparent)",
                        }}
                    >
                        <Download className="w-4 h-4" />
                        Export JSON
                    </button>
                </div>
            </div>

            {/* Mock / offline honesty banner */}
            {mockish && (
                <div
                    className="p-4 rounded-xl border flex items-center gap-3"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--warning) 8%, transparent)",
                        borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)",
                    }}
                >
                    <ShieldCheck className="w-5 h-5" style={{ color: "var(--warning)" }} />
                    <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
                            {honesty.engineReachable
                                ? "Mock / unknown prover — not cryptographically proven"
                                : "Engine offline — not cryptographically proven"}
                        </p>
                        <p className="text-xs text-[var(--surface-500)]">
                            zkp_valid is treated as unproven. This page will not show Verified, Cryptographically Verified, STARK, or CISO-ready while prover_mode is mock, offline, or unknown.
                        </p>
                    </div>
                </div>
            )}

            {/* Re-verification result banner — three-state; null ≠ failed */}
            {verifyResult && (() => {
                const proven = isRealProver(honesty.proverMode)
                    && honesty.engineReachable
                    && verifyResult.pqc_valid
                    && verifyResult.zkp_valid === true;
                const unproven = verifyResult.zkp_valid === null || mockish;
                const tone = proven ? "var(--success)" : unproven ? "var(--warning)" : "var(--error)";
                return (
                    <div
                        className="p-4 rounded-xl border flex items-center gap-3"
                        style={{
                            backgroundColor: `color-mix(in srgb, ${tone} 8%, transparent)`,
                            borderColor: `color-mix(in srgb, ${tone} 20%, transparent)`,
                        }}
                    >
                        <ShieldCheck className="w-5 h-5" style={{ color: tone }} />
                        <div>
                            <p className="text-sm font-medium" style={{ color: tone }}>
                                {proven
                                    ? "Live re-verification passed against a real prover."
                                    : unproven
                                        ? "Re-verify returned no cryptographic proof (mock, offline, or unknown prover)."
                                        : "Live re-verification failed."}
                            </p>
                            <p className="text-xs text-[var(--surface-500)]">
                                PQC: {verifyResult.pqc_valid ? "valid" : "invalid"} · ZKP:{" "}
                                {verifyResult.zkp_valid === null
                                    ? "not proven"
                                    : verifyResult.zkp_valid
                                        ? "valid"
                                        : "invalid"}
                            </p>
                        </div>
                    </div>
                );
            })()}

            {/* Dual-Layer Verification Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CryptoLayerCard
                    layer={1}
                    config={config}
                    honesty={honesty}
                    isValid={verifyResult?.zkp_valid ?? attestation.zkp_valid}
                />
                <CryptoLayerCard
                    layer={2}
                    config={config}
                    honesty={honesty}
                    isValid={verifyResult?.pqc_valid ?? attestation.pqc_valid}
                />
            </div>

            {/* Governance Leaf Breakdown */}
            <GovernanceLeafBreakdown attestation={attestation} />

            {/* Noetherian Invariant Gates */}
            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[var(--surface-900)] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
                        Noetherian Invariant Compliance Gates ({policyConfig.protocol_id ?? "P-ASIS-002"})
                    </h3>
                    <span
                        className="text-xs font-mono px-2 py-0.5 rounded border"
                        style={mockish || derived !== "verified" ? {
                            backgroundColor: "color-mix(in srgb, var(--warning) 10%, transparent)",
                            borderColor: "color-mix(in srgb, var(--warning) 20%, transparent)",
                            color: "var(--warning)",
                        } : {
                            backgroundColor: "color-mix(in srgb, var(--success) 10%, transparent)",
                            borderColor: "color-mix(in srgb, var(--success) 20%, transparent)",
                            color: "var(--success)",
                        }}
                    >
                        {mockish
                            ? `${gateDefinitions.length} GATES — UNPROVEN (${honesty.proverMode})`
                            : derived === "verified"
                                ? `${gateDefinitions.length} GATES PASSED`
                                : `${gateDefinitions.length} GATES — ${derivedLabel.toUpperCase()}`}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {gateDefinitions.map((gate: NoetherianGateDefinition) => (
                        <NoetherianGateCard
                            key={gate.gate_number}
                            gate={gate}
                            passed={derived === "verified" ? true : derived === "invalid" ? false : null}
                            compact
                        />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-[var(--surface-500)] space-y-1">
                <p>
                    {mockish
                        ? "This attestation envelope is structural only. Independent verification requires a real prover (CPU/CUDA)."
                        : derived === "verified"
                            ? "Verified against a live non-mock prover."
                            : "Not independently proven on this plane."}
                </p>
                <p className="font-mono text-[11px] text-[var(--surface-400)]">
                    AJF Tech Holdings LLC — ASIS Sovereign Intelligence Protocol ({policyConfig.protocol_id ?? "P-ASIS-002"})
                </p>
            </div>
        </div>
    );
}
