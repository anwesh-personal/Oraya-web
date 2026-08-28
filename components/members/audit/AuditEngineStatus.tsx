"use client";

// ============================================================================
// AuditEngineStatus — Live ASIS Sovereign Engine Health Monitor
// ============================================================================
// Polls /api/asis/health on mount and displays real-time engine status.
// All values from live API — zero hardcoded metadata.
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import type { EngineHealth } from "./types";

export function AuditEngineStatus() {
    const [health, setHealth] = useState<EngineHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const fetchHealth = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/asis/health");
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            const body = await res.json();
            setHealth(body.data);
            setLastChecked(new Date());
        } catch (err: any) {
            setError(err?.message || "Connection failed");
            setHealth(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchHealth, 30_000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    const isOnline = health?.status === "operational";
    const isMockProver = health?.prover_mode === "mock";

    const formatUptime = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
                {loading ? (
                    <RefreshCw className="w-4 h-4 text-[var(--surface-500)] animate-spin" />
                ) : isOnline ? (
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--success)]" />
                    </span>
                ) : (
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--error)]" />
                    </span>
                )}

                <span className="text-xs font-medium text-[var(--surface-800)]">
                    {loading
                        ? "Connecting..."
                        : isOnline && isMockProver
                            ? "ASIS Engine Online (Mock Prover)"
                            : isOnline
                                ? "ASIS Engine Online"
                                : "Engine Offline"}
                </span>
            </div>

            {/* Mock prover warning */}
            {health && isMockProver && (
                <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--warning) 12%, transparent)",
                        borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)",
                        color: "var(--warning)",
                    }}
                >
                    ⚠ MOCK — Proofs not cryptographically binding
                </span>
            )}

            {/* Metadata chips */}
            {health && (
                <div className="hidden md:flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-100)] text-[var(--surface-600)] border border-[var(--surface-200)]">
                        {health.algorithm}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-100)] text-[var(--surface-600)] border border-[var(--surface-200)]">
                        Prover: {health.prover_mode}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-100)] text-[var(--surface-600)] border border-[var(--surface-200)]">
                        Uptime: {formatUptime(health.uptime_seconds)}
                    </span>
                </div>
            )}

            {error && (
                <span className="text-[10px] text-[var(--error)] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </span>
            )}

            {/* Manual refresh */}
            <button
                onClick={fetchHealth}
                disabled={loading}
                className="ml-auto p-1.5 rounded-lg hover:bg-[var(--surface-100)] text-[var(--surface-500)] hover:text-[var(--surface-700)] transition-colors"
                title="Refresh engine status"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
        </div>
    );
}
