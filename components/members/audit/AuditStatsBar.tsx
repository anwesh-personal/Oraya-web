"use client";

// ============================================================================
// AuditStatsBar — Aggregate Statistics Strip
// ============================================================================
// Compact stats bar showing total proofs, pass rate, last attestation time,
// and per-model breakdown. All from /api/asis/stats — zero hardcoded.
// ============================================================================

import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import type { AttestationStats, HonestyState } from "./types";
import { DEFAULT_HONESTY, isMockOrOffline } from "@/lib/asis-honesty";

interface AuditStatsBarProps {
    /** Pre-fetched stats (if available from server component) */
    initialStats?: AttestationStats | null;
    honesty?: HonestyState;
}

export function AuditStatsBar({ initialStats, honesty = DEFAULT_HONESTY }: AuditStatsBarProps) {
    const [stats, setStats] = useState<AttestationStats | null>(initialStats ?? null);

    useEffect(() => {
        if (initialStats) return; // Already have data
        async function load() {
            try {
                const res = await fetch("/api/asis/stats");
                if (res.ok) {
                    const body = await res.json();
                    setStats(body.data);
                }
            } catch {
                // Silently fail — stats are supplementary
            }
        }
        load();
    }, [initialStats]);

    if (!stats) return null;

    const formatTimeAgo = (dateStr: string | null): string => {
        if (!dateStr) return "Never";
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const modelEntries = Object.entries(stats.models);
    const mockish = isMockOrOffline(honesty.proverMode) || !honesty.engineReachable;

    return (
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-300)] text-xs">
            <div className="flex items-center gap-1.5 text-[var(--surface-700)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span className="font-medium">{stats.total.toLocaleString()}</span>
                <span className="text-[var(--surface-500)]">Governance leaves</span>
            </div>

            <span className="text-[var(--surface-300)]">|</span>

            <div className="flex items-center gap-1.5">
                <TrendingUp className={`w-3.5 h-3.5 ${mockish ? "text-[var(--surface-400)]" : "text-[var(--success)]"}`} />
                {mockish ? (
                    <>
                        <span className="font-medium text-[var(--surface-500)]">n/a</span>
                        <span className="text-[var(--surface-500)]">Pass rate (prover not real)</span>
                    </>
                ) : (
                    <>
                        <span className="font-medium text-[var(--success)]">{stats.pass_rate}%</span>
                        <span className="text-[var(--surface-500)]">Pass Rate</span>
                    </>
                )}
            </div>

            <span className="text-[var(--surface-300)]">|</span>

            {/* DB-marked counts — never green while unproven */}
            <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1 ${mockish ? "text-[var(--warning)]" : "text-[var(--success)]"}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {stats.verified_valid}
                    {mockish && <span className="text-[10px]">DB-marked (unproven)</span>}
                </span>
                {stats.verified_invalid > 0 && (
                    <span className="flex items-center gap-1 text-[var(--error)]">
                        <AlertTriangle className="w-3 h-3" />
                        {stats.verified_invalid}
                    </span>
                )}
                {stats.pending > 0 && (
                    <span className="flex items-center gap-1 text-[var(--warning)]">
                        <Clock className="w-3 h-3" />
                        {stats.pending}
                    </span>
                )}
            </div>

            <span className="text-[var(--surface-300)]">|</span>

            {/* Last Attestation */}
            <div className="flex items-center gap-1.5 text-[var(--surface-600)]">
                <Clock className="w-3.5 h-3.5" />
                <span>Last: {formatTimeAgo(stats.last_attestation_at)}</span>
            </div>

            {/* Per-model breakdown (compact) */}
            {modelEntries.length > 0 && (
                <>
                    <span className="text-[var(--surface-300)]">|</span>
                    <div className="flex items-center gap-2">
                        {modelEntries.slice(0, 3).map(([model, count]) => (
                            <span
                                key={model}
                                className="px-2 py-0.5 rounded-md bg-[var(--surface-100)] text-[var(--surface-600)] border border-[var(--surface-200)] font-mono text-[10px]"
                            >
                                {model}: {count}
                            </span>
                        ))}
                        {modelEntries.length > 3 && (
                            <span className="text-[var(--surface-400)] text-[10px]">
                                +{modelEntries.length - 3} more
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
