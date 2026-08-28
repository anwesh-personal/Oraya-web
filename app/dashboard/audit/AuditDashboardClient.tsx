"use client";

// ============================================================================
// AuditDashboardClient — Client-side shell for the Sovereign Audit Dashboard
// ============================================================================
// Composes all modular audit components. Receives server-fetched data as props.
// Fetches live prover mode from ASIS health to render honest mock/real states.
// ============================================================================

import { ShieldCheck } from "lucide-react";
import type { EngineConfigMap, AttestationStats } from "@/components/members/audit/types";
import {
    AuditEngineStatus,
    AuditTelemetryGrid,
    AuditStatsBar,
    AuditLedgerTable,
    AuditExportButton,
    useAsisHonesty,
} from "@/components/members/audit";
import { isMockOrOffline, proverModeLabel } from "@/lib/asis-honesty";

interface AuditDashboardClientProps {
    config: EngineConfigMap;
    stats: AttestationStats;
    availableModels: string[];
}

export function AuditDashboardClient({
    config,
    stats,
    availableModels,
}: AuditDashboardClientProps) {
    const { honesty } = useAsisHonesty();
    const mockish = isMockOrOffline(honesty.proverMode) || !honesty.engineReachable;

    // Pull display config — titles are declared config, not proof of a live engine
    const displayTitle = config["display.dashboard_title"]?.value ?? {};
    const policyConfig = config["policy.attestation_protocol"]?.value ?? {};

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--surface-200)] pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border"
                            style={mockish ? {
                                backgroundColor: "color-mix(in srgb, var(--warning) 10%, transparent)",
                                borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)",
                                color: "var(--warning)",
                            } : {
                                backgroundColor: "color-mix(in srgb, var(--info) 10%, transparent)",
                                borderColor: "color-mix(in srgb, var(--info) 25%, transparent)",
                                color: "var(--info)",
                            }}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {mockish ? proverModeLabel(honesty.proverMode) : "ASIS engine reachable"}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--surface-900)] font-display">
                        {displayTitle.title ?? "Governance leaf audit"}
                    </h1>
                    <p className="text-sm text-[var(--surface-500)] mt-1">
                        {mockish
                            ? "Declared engine config and governance leaves. Not cryptographic proofs."
                            : (displayTitle.subtitle ?? "ASIS attestation ledger")}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <AuditExportButton honesty={honesty} />
                </div>
            </div>

            {/* Live Engine Status */}
            <AuditEngineStatus />

            {/* Telemetry Grid — all values from config, mock-aware */}
            <AuditTelemetryGrid config={config} stats={stats} honesty={honesty} />

            {/* Aggregate Stats Bar */}
            <AuditStatsBar initialStats={stats} honesty={honesty} />

            {/* Attestation Ledger — paginated, filterable */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[var(--surface-800)] font-display">
                        Attestation Ledger
                    </h2>
                    <span className="text-xs text-[var(--surface-500)] font-mono">
                        Protocol: {policyConfig.protocol_id ?? "P-ASIS-002"} v{policyConfig.version ?? "1.0"}
                    </span>
                </div>
                <AuditLedgerTable availableModels={availableModels} honesty={honesty} />
            </div>
        </div>
    );
}
