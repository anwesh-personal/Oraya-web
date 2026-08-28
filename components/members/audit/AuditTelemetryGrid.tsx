"use client";

// ============================================================================
// AuditTelemetryGrid — Config-Driven Engine Telemetry Cards
// ============================================================================
// 4-card grid showing ZKP Engine, PQC Scheme, Noetherian Invariants, and
// Hardware Sovereignty. ALL values pulled from asis_engine_config — admin
// changes any value in config, it reflects here instantly.
// ============================================================================

import { Cpu, Lock, Activity, Database } from "lucide-react";
import type { EngineConfigMap, AttestationStats } from "./types";

interface AuditTelemetryGridProps {
    config: EngineConfigMap;
    stats: AttestationStats | null;
    /** Current prover mode from live health check */
    proverMode?: string;
}

export function AuditTelemetryGrid({ config, stats, proverMode }: AuditTelemetryGridProps) {
    const isMockProver = proverMode === "mock" || proverMode === undefined;
    // Extract values from config map — every value is dynamic
    const zkpProver = config["engine.zkp_prover"]?.value ?? {};
    const proverModeConfig = config["engine.prover_mode"]?.value ?? {};
    const activeCircuits = config["circuit.active_circuits"]?.value ?? {};
    const pqcAlgo = config["crypto.pqc_algorithm"]?.value ?? {};
    const hwSovereignty = config["hardware.sovereignty"]?.value ?? {};

    const passRateDisplay = stats
        ? `${stats.pass_rate.toFixed(1)}% Valid`
        : "—";
    const driftViolations = stats
        ? stats.verified_invalid
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: ZKP Prover Engine */}
            <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-2 hover:border-[var(--success)]/30 transition-all">
                <div className="flex items-center justify-between text-[var(--surface-500)] text-xs font-medium">
                    <span>{config["engine.zkp_prover"]?.label ?? "ZKP Prover Engine"}</span>
                    <Cpu className="w-4 h-4 text-[var(--success)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--surface-900)]">
                    {zkpProver.name ?? "—"} {zkpProver.version ?? ""}
                </div>
                <div className="text-xs text-[var(--success)] flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                    {activeCircuits.count ?? 0} Circuits Active ({zkpProver.backend ?? "RISC-V"})
                </div>
                {isMockProver && (
                    <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-1 inline-block"
                        style={{
                            backgroundColor: "color-mix(in srgb, var(--warning) 12%, transparent)",
                            borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)",
                            color: "var(--warning)",
                        }}
                    >
                        MOCK PROVER
                    </span>
                )}
            </div>

            {/* Card 2: PQC Signature Scheme */}
            <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-2 hover:border-[var(--info)]/30 transition-all">
                <div className="flex items-center justify-between text-[var(--surface-500)] text-xs font-medium">
                    <span>{config["crypto.pqc_algorithm"]?.label ?? "PQC Signature Scheme"}</span>
                    <Lock className="w-4 h-4 text-[var(--info)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--surface-900)]">
                    {pqcAlgo.name ?? "—"}
                </div>
                <div className="text-xs text-[var(--info)] flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)]" />
                    {pqcAlgo.security_level ?? "—"} ({pqcAlgo.standard ?? "—"})
                </div>
            </div>

            {/* Card 3: Noetherian Invariants */}
            <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-2 hover:border-[var(--success)]/30 transition-all">
                <div className="flex items-center justify-between text-[var(--surface-500)] text-xs font-medium">
                    <span>Noetherian Invariants</span>
                    <Activity className="w-4 h-4 text-[var(--success)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--surface-900)]">
                    {passRateDisplay}
                </div>
                <div className="text-xs text-[var(--surface-500)] font-mono">
                    {driftViolations} Drift Violation{driftViolations !== 1 ? "s" : ""} (Gate 1-4)
                </div>
            </div>

            {/* Card 4: Hardware Sovereignty */}
            <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-2 hover:border-[var(--success)]/30 transition-all">
                <div className="flex items-center justify-between text-[var(--surface-500)] text-xs font-medium">
                    <span>{config["hardware.sovereignty"]?.label ?? "Hardware Sovereignty"}</span>
                    <Database className="w-4 h-4 text-[var(--success)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--surface-900)]">
                    {hwSovereignty.node_name ?? "—"} {hwSovereignty.isolation_mode ?? ""}
                </div>
                <div className="text-xs text-[var(--surface-500)] font-mono">
                    {hwSovereignty.cloud_provers ?? 0} 3rd-Party Cloud Provers
                </div>
            </div>
        </div>
    );
}
