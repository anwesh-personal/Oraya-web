"use client";

// ============================================================================
// AuditEngineStatus — Live ASIS Sovereign Engine Health Monitor
// ============================================================================
// Polls /api/asis/health. Fail-open: offline is an honest state, not an error page.
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { EngineHealth, HonestyState } from "./types";
import {
    DEFAULT_HONESTY,
    honestyFromApiBody,
    isMockOrOffline,
    proverModeLabel,
} from "@/lib/asis-honesty";

export function AuditEngineStatus() {
    const [health, setHealth] = useState<EngineHealth | null>(null);
    const [honesty, setHonesty] = useState<HonestyState>(DEFAULT_HONESTY);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHealth = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/asis/health");
            const body = await res.json().catch(() => null);
            const next = honestyFromApiBody(body);
            setHonesty(next);
            const data = body?.data;
            setHealth(data && typeof data === "object" ? data : null);
        } catch {
            setHonesty({ ...DEFAULT_HONESTY });
            setHealth(null);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30_000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    const reachable = honesty.engineReachable;
    const mockish = isMockOrOffline(honesty.proverMode) || !reachable;

    const formatUptime = (seconds: number): string => {
        if (!seconds) return "—";
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
            <div className="flex items-center gap-2">
                {loading ? (
                    <RefreshCw className="w-4 h-4 text-[var(--surface-500)] animate-spin" />
                ) : reachable ? (
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--info)]" />
                    </span>
                ) : (
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--surface-400)]" />
                    </span>
                )}

                <span className="text-xs font-medium text-[var(--surface-800)]">
                    {loading
                        ? "Checking engine…"
                        : reachable
                            ? `ASIS engine reachable (${proverModeLabel(honesty.proverMode)})`
                            : "ASIS engine offline"}
                </span>
            </div>

            {mockish && (
                <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--warning) 12%, transparent)",
                        borderColor: "color-mix(in srgb, var(--warning) 25%, transparent)",
                        color: "var(--warning)",
                    }}
                >
                    Not proven — {honesty.proverMode}
                </span>
            )}

            {reachable && health && (
                <div className="hidden md:flex items-center gap-2">
                    {health.algorithm && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-100)] text-[var(--surface-600)] border border-[var(--surface-200)]">
                            {health.algorithm}
                        </span>
                    )}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-100)] text-[var(--surface-600)] border border-[var(--surface-200)]">
                        Prover: {honesty.proverMode}
                    </span>
                    {typeof health.uptime_seconds === "number" && health.uptime_seconds > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-100)] text-[var(--surface-600)] border border-[var(--surface-200)]">
                            Uptime: {formatUptime(health.uptime_seconds)}
                        </span>
                    )}
                </div>
            )}

            {error && (
                <span className="text-[10px] text-[var(--error)] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </span>
            )}

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
