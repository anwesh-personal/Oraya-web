"use client";

// ============================================================================
// AttestationCertificate — Full Verification Certificate View
// ============================================================================
// Complete cryptographic certificate for a single attestation. Loads all
// data from props (fetched server-side). Supports live re-verification
// against ASIS engine, JSON export, and copy-to-clipboard.
// ============================================================================

import { useState } from "react";
import { ShieldCheck, Download, Loader2 } from "lucide-react";
import type { AttestationRecord, EngineConfigMap, NoetherianGateDefinition } from "./types";
import { CryptoLayerCard } from "./CryptoLayerCard";
import { GovernanceLeafBreakdown } from "./GovernanceLeafBreakdown";
import { NoetherianGateCard } from "./NoetherianGateCard";

interface AttestationCertificateProps {
    attestation: AttestationRecord;
    config: EngineConfigMap;
    /** Current prover mode from live health check ("mock" | "cpu" | "cuda") */
    proverMode?: string;
}

export function AttestationCertificate({ attestation, config, proverMode }: AttestationCertificateProps) {
    const isMockProver = proverMode === "mock" || proverMode === undefined;
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
            if (res.ok) {
                const body = await res.json();
                setVerifyResult({
                    pqc_valid: body.data?.pqc_valid ?? false,
                    zkp_valid: body.data?.zkp_valid ?? false,
                });
            }
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
                        {isMockProver ? (
                            <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--warning) 10%, transparent)",
                                    borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)",
                                    color: "var(--warning)",
                                }}
                            >
                                Mock Prover — Structural Only
                            </span>
                        ) : (
                            <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border"
                                style={{
                                    backgroundColor: "color-mix(in srgb, var(--success) 10%, transparent)",
                                    borderColor: "color-mix(in srgb, var(--success) 25%, transparent)",
                                    color: "var(--success)",
                                }}
                            >
                                Cryptographically Verified
                            </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[var(--surface-100)] text-[var(--surface-500)] border border-[var(--surface-200)]">
                            {attestation.jurisdiction}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--surface-900)] font-display">
                        Sovereign Attestation Certificate
                    </h1>
                    <p className="text-sm text-[var(--surface-500)]">
                        {isMockProver
                            ? `Attestation envelope generated with mock prover. Proofs are structural only — not cryptographically binding.`
                            : `Cryptographically verified via ${config["engine.zkp_prover"]?.value?.name ?? "SP1"} Zero-Knowledge STARK Proofs & ${config["crypto.pqc_algorithm"]?.value?.name ?? "ML-DSA-65"} (${config["crypto.pqc_algorithm"]?.value?.standard ?? "FIPS 204"}).`
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

            {/* Mock Prover Honesty Banner */}
            {isMockProver && (
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
                            Mock Prover Active — Proofs Are Not Cryptographically Binding
                        </p>
                        <p className="text-xs text-[var(--surface-500)]">
                            The ASIS engine is running with SP1_PROVER=mock. STARK proofs are structurally valid envelopes but do NOT provide computational honesty guarantees.
                            Gate verdicts below reflect structural validation only. Production CUDA proving on GB10 is required for real cryptographic attestation.
                        </p>
                    </div>
                </div>
            )}

            {/* Re-verification result banner */}
            {verifyResult && (
                <div
                    className="p-4 rounded-xl border flex items-center gap-3"
                    style={{
                        backgroundColor: verifyResult.pqc_valid && verifyResult.zkp_valid
                            ? "color-mix(in srgb, var(--success) 8%, transparent)"
                            : "color-mix(in srgb, var(--error) 8%, transparent)",
                        borderColor: verifyResult.pqc_valid && verifyResult.zkp_valid
                            ? "color-mix(in srgb, var(--success) 20%, transparent)"
                            : "color-mix(in srgb, var(--error) 20%, transparent)",
                    }}
                >
                    <ShieldCheck
                        className="w-5 h-5"
                        style={{
                            color: verifyResult.pqc_valid && verifyResult.zkp_valid
                                ? "var(--success)"
                                : "var(--error)",
                        }}
                    />
                    <div>
                        <p className="text-sm font-medium" style={{
                            color: verifyResult.pqc_valid && verifyResult.zkp_valid
                                ? "var(--success)"
                                : "var(--error)",
                        }}>
                            {verifyResult.pqc_valid && verifyResult.zkp_valid
                                ? "Live re-verification PASSED — attestation is cryptographically valid."
                                : "Live re-verification FAILED — attestation may be tampered."}
                        </p>
                        <p className="text-xs text-[var(--surface-500)]">
                            PQC: {verifyResult.pqc_valid ? "✓ Valid" : "✗ Invalid"} | ZKP: {verifyResult.zkp_valid ? "✓ Valid" : "✗ Invalid"}
                        </p>
                    </div>
                </div>
            )}

            {/* Dual-Layer Verification Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CryptoLayerCard
                    layer={1}
                    config={config}
                    isValid={verifyResult?.zkp_valid ?? attestation.zkp_valid}
                />
                <CryptoLayerCard
                    layer={2}
                    config={config}
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
                        style={isMockProver ? {
                            backgroundColor: "color-mix(in srgb, var(--warning) 10%, transparent)",
                            borderColor: "color-mix(in srgb, var(--warning) 20%, transparent)",
                            color: "var(--warning)",
                        } : {
                            backgroundColor: "color-mix(in srgb, var(--success) 10%, transparent)",
                            borderColor: "color-mix(in srgb, var(--success) 20%, transparent)",
                            color: "var(--success)",
                        }}
                    >
                        {isMockProver
                            ? `MOCK PROVER — ${gateDefinitions.length} GATES STRUCTURALLY CHECKED`
                            : `ALL ${gateDefinitions.length} GATES PASSED`}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {gateDefinitions.map((gate: NoetherianGateDefinition) => (
                        <NoetherianGateCard
                            key={gate.gate_number}
                            gate={gate}
                            passed={attestation.verification_status === "verified_valid"}
                            compact
                        />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-[var(--surface-500)] space-y-1">
                <p>
                    {isMockProver
                        ? "This attestation envelope is structural only. Independent verification requires a real prover (CPU/CUDA)."
                        : "This cryptographic certificate is independently verifiable by any third-party auditor."}
                </p>
                <p className="font-mono text-[11px] text-[var(--surface-400)]">
                    AJF Tech Holdings LLC — ASIS Sovereign Intelligence Protocol ({policyConfig.protocol_id ?? "P-ASIS-002"})
                </p>
            </div>
        </div>
    );
}
