"use client";

// ============================================================================
// AuditTelemetryGrid — Config-Driven Engine Telemetry Cards
// ============================================================================
// Values come from asis_engine_config (declared targets). While the prover is
// mock/offline/unknown they are labelled as config/target — never as live
// certification or "circuits active" facts.
// ============================================================================

import { Cpu, Lock, Activity, Database } from "lucide-react";
import type { EngineConfigMap, AttestationStats, HonestyState } from "./types";
import { DEFAULT_HONESTY, configClaimKind, isMockOrOffline } from "@/lib/asis-honesty";

interface AuditTelemetryGridProps {
    config: EngineConfigMap;
    stats: AttestationStats | null;
    honesty?: HonestyState;
    /** @deprecated use honesty — kept so older callers type-check during the cutover */
    proverMode?: string;
}

export function AuditTelemetryGrid({
    config,
    stats,
    honesty = DEFAULT_HONESTY,
}: AuditTelemetryGridProps) {
    const mockish = isMockOrOffline(honesty.proverMode) || !honesty.engineReachable;
    const claim = configClaimKind(honesty);
    const zkpProver = config["engine.zkp_prover"]?.value ?? {};
    const proverModeConfig = config["engine.prover_mode"]?.value ?? {};
    const activeCircuits = config["circuit.active_circuits"]?.value ?? {};
    const pqcAlgo = config["crypto.pqc_algorithm"]?.value ?? {};
    const hwSovereignty = config["hardware.sovereignty"]?.value ?? {};

    const targetChip = claim === "target" ? "Configured target" : "Live read";
    const targetColor = claim === "target" ? "var(--warning)" : "var(--info)";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-2">
                <div className="flex items-center justify-between text-[var(--surface-500)] text-xs font-medium">
                    <span>{config["engine.zkp_prover"]?.label ?? "ZKP Prover Engine"}</span>
                    <Cpu className="w-4 h-4 text-[var(--surface-400)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--surface-900)]">
                    {zkpProver.name ?? "—"} {zkpProver.version ?? ""}
                </div>
                <div className="text-xs text-[var(--surface-500)] flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--surface-400)]" />
                    {activeCircuits.count ?? 0} circuits configured ({zkpProver.backend ?? "—"})
                </div>
                <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-1 inline-block"
                    style={{
                        backgroundColor: `color-mix(in srgb, ${targetColor} 12%, transparent)`,
                        borderColor: `color-mix(in srgb, ${targetColor} 25%, transparent)`,
                        color: targetColor,
                    }}
                >
                    {mockish
                        ? `${targetChip} · ${proverModeConfig.current ?? honesty.proverMode}`
                        : targetChip}
                </span>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-2">
                <div className="flex items-center justify-between text-[var(--surface-500)] text-xs font-medium">
                    <span>{config["crypto.pqc_algorithm"]?.label ?? "PQC Signature Scheme"}</span>
                    <Lock className="w-4 h-4 text-[var(--info)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--surface-900)]">
                    {pqcAlgo.name ?? "—"}
                </div>
                <div className="text-xs text-[var(--surface-500)] flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--surface-400)]" />
                    Configured: {pqcAlgo.security_level ?? "—"} ({pqcAlgo.standard ?? "—"})
                </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-2">
                <div className="flex items-center justify-between text-[var(--surface-500)] text-xs font-medium">
                    <span>Governance leaves</span>
                    <Activity className="w-4 h-4 text-[var(--surface-400)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--surface-900)]">
                    {stats ? stats.total.toLocaleString() : "—"}
                </div>
                <div className="text-xs text-[var(--surface-500)] font-mono">
                    {mockish
                        ? "Pass rate withheld — prover not real"
                        : `${stats ? `${stats.pass_rate.toFixed(1)}% valid` : "—"} · ${stats?.verified_invalid ?? 0} invalid`}
                </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-2">
                <div className="flex items-center justify-between text-[var(--surface-500)] text-xs font-medium">
                    <span>{config["hardware.sovereignty"]?.label ?? "Hardware target"}</span>
                    <Database className="w-4 h-4 text-[var(--surface-400)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--surface-900)]">
                    {hwSovereignty.node_name ?? "—"}
                </div>
                <div className="text-xs text-[var(--surface-500)] font-mono">
                    {claim === "target"
                        ? `Target · ${hwSovereignty.isolation_mode ?? "undeclared"} — not proven on this plane`
                        : `${hwSovereignty.isolation_mode ?? "—"}`}
                </div>
            </div>
        </div>
    );
}
