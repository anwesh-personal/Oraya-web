"use client";

// ============================================================================
// NoetherianGateCard — Single Invariant Gate Display
// ============================================================================
// Reusable card for displaying a single Noetherian invariant gate with its
// label, mathematical formula, threshold, and pass/fail status.
// Used in both audit dashboard summary and verification certificate detail.
// ============================================================================

import { CheckCircle2, XCircle } from "lucide-react";
import type { NoetherianGateDefinition } from "./types";

interface NoetherianGateCardProps {
    gate: NoetherianGateDefinition;
    /** Actual computed value from attestation (if available) */
    actualValue?: string | null;
    /** Whether this gate passed */
    passed?: boolean;
    /** Compact mode for grid layouts */
    compact?: boolean;
}

export function NoetherianGateCard({
    gate,
    actualValue,
    passed = true,
    compact = false,
}: NoetherianGateCardProps) {
    const statusColor = passed ? "var(--success)" : "var(--error)";
    const StatusIcon = passed ? CheckCircle2 : XCircle;

    if (compact) {
        return (
            <div className="p-3.5 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-1 hover:border-[var(--surface-400)] transition-colors">
                <div className="text-[var(--surface-500)] text-xs">
                    Gate {gate.gate_number}: {gate.label}
                </div>
                <div
                    className="font-semibold flex items-center gap-1 text-xs"
                    style={{ color: statusColor }}
                >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="font-mono">
                        {gate.formula} ({passed ? "Passed" : "Failed"})
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-[var(--surface-900)]">
                        Gate {gate.gate_number}: {gate.label}
                    </h4>
                    <p className="text-xs text-[var(--surface-500)] mt-0.5">
                        Circuit: <span className="font-mono">{gate.circuit_id}</span>
                    </p>
                </div>
                <span
                    className="px-2 py-1 rounded-md text-xs font-medium border"
                    style={{
                        backgroundColor: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
                        borderColor: `color-mix(in srgb, ${statusColor} 25%, transparent)`,
                        color: statusColor,
                    }}
                >
                    {passed ? "PASSED" : "FAILED"}
                </span>
            </div>

            {/* Formula & Value */}
            <div className="p-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] font-mono text-xs space-y-1">
                <div className="flex justify-between text-[var(--surface-500)]">
                    <span>Formula:</span>
                    <span className="text-[var(--surface-800)]">{gate.formula}</span>
                </div>
                <div className="flex justify-between text-[var(--surface-500)]">
                    <span>Threshold:</span>
                    <span className="text-[var(--surface-800)]">{gate.threshold}</span>
                </div>
                {actualValue && (
                    <div className="flex justify-between text-[var(--surface-500)]">
                        <span>Measured:</span>
                        <span style={{ color: statusColor }} className="font-semibold">
                            {actualValue}
                        </span>
                    </div>
                )}
            </div>

            {/* Description */}
            <p className="text-xs text-[var(--surface-500)] leading-relaxed">
                {gate.description}
            </p>
        </div>
    );
}
