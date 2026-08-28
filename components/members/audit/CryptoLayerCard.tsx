"use client";

// ============================================================================
// CryptoLayerCard — Reusable Layer 1 (STARK) / Layer 2 (PQC) Display
// ============================================================================
// Shows cryptographic layer metadata from config + attestation status.
// Used in both audit dashboard and verification certificate.
// ============================================================================

import { Cpu, Lock, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { EngineConfigMap } from "./types";

interface CryptoLayerCardProps {
    layer: 1 | 2;
    config: EngineConfigMap;
    /** Whether this layer is validated for the current attestation */
    isValid?: boolean | null;
    /** Additional metadata rows to display */
    metadata?: Array<{ label: string; value: string }>;
}

export function CryptoLayerCard({ layer, config, isValid, metadata }: CryptoLayerCardProps) {
    const isLayer1 = layer === 1;

    // Pull metadata from config
    const zkpProver = config["engine.zkp_prover"]?.value ?? {};
    const proverMode = config["engine.prover_mode"]?.value ?? {};
    const pqcAlgo = config["crypto.pqc_algorithm"]?.value ?? {};
    const hwSovereignty = config["hardware.sovereignty"]?.value ?? {};

    const Icon = isLayer1 ? Cpu : Lock;
    const accentVar = isLayer1 ? "var(--success)" : "var(--info)";
    const title = isLayer1 ? "Layer 1: SP1 STARK Proof" : "Layer 2: Post-Quantum Signature";
    const subtitle = isLayer1 ? "Computational Honesty Guarantee" : "Quantum-Resistant Attestation";

    const statusLabel = isValid === null || isValid === undefined
        ? "PENDING"
        : isValid
            ? "VALIDATED"
            : "INVALID";

    const StatusIcon = isValid === null || isValid === undefined
        ? Clock
        : isValid
            ? CheckCircle2
            : XCircle;

    const statusColor = isValid === null || isValid === undefined
        ? "var(--warning)"
        : isValid
            ? accentVar
            : "var(--error)";

    // Build detail rows from config
    const detailRows: Array<{ label: string; value: string }> = isLayer1
        ? [
            { label: "Engine", value: `${zkpProver.name ?? "—"} ${zkpProver.version ?? ""}` },
            { label: "Backend", value: zkpProver.backend ?? "—" },
            { label: "Prover Mode", value: proverMode.current ?? "—" },
            { label: "Hardware", value: `${hwSovereignty.node_name ?? "—"} (${hwSovereignty.isolation_mode ?? "—"})` },
        ]
        : [
            { label: "Algorithm", value: pqcAlgo.name ?? "—" },
            { label: "Standard", value: pqcAlgo.standard ?? "—" },
            { label: "Security Level", value: pqcAlgo.security_level ?? "—" },
            { label: "Signature Size", value: pqcAlgo.signature_bytes ? `${pqcAlgo.signature_bytes.toLocaleString()} Bytes` : "—" },
        ];

    // Append custom metadata rows if provided
    if (metadata) {
        detailRows.push(...metadata);
    }

    const description = isLayer1
        ? "Proves mathematically that the governance hash was derived from authentic input/output states without exposing private prompt data."
        : `Signed directly on the sovereign hardware enclave with ${pqcAlgo.standard ?? "FIPS 204"} lattice cryptography, ensuring immunity against quantum attacks.`;

    return (
        <div
            className="p-6 rounded-2xl bg-[var(--surface-50)] border backdrop-blur-xl space-y-4 transition-all hover:shadow-md"
            style={{
                borderColor: `color-mix(in srgb, ${accentVar} 20%, var(--surface-300))`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2.5 rounded-xl border"
                        style={{
                            backgroundColor: `color-mix(in srgb, ${accentVar} 10%, transparent)`,
                            borderColor: `color-mix(in srgb, ${accentVar} 20%, transparent)`,
                            color: accentVar,
                        }}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--surface-900)]">{title}</h3>
                        <p className="text-xs text-[var(--surface-500)]">{subtitle}</p>
                    </div>
                </div>
                <span
                    className="px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1"
                    style={{
                        backgroundColor: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
                        borderColor: `color-mix(in srgb, ${statusColor} 25%, transparent)`,
                        color: statusColor,
                    }}
                >
                    <StatusIcon className="w-3 h-3" />
                    {statusLabel}
                </span>
            </div>

            {/* Detail Rows */}
            <div className="space-y-1.5 text-xs font-mono bg-[var(--surface-100)] p-4 rounded-xl border border-[var(--surface-200)]">
                {detailRows.map((row, i) => (
                    <div key={i} className="flex justify-between text-[var(--surface-500)]">
                        <span>{row.label}:</span>
                        <span className="text-[var(--surface-800)]">{row.value}</span>
                    </div>
                ))}
            </div>

            {/* Description */}
            <p className="text-xs text-[var(--surface-500)] leading-relaxed">
                {description}
            </p>
        </div>
    );
}
