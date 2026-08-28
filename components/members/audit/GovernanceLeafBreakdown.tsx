"use client";

// ============================================================================
// GovernanceLeafBreakdown — AGL-001 Governance Leaf Display
// ============================================================================
// Shows canonical governance hash, input/output hashes, model binding, and
// timestamp from an attestation record. Copy-to-clipboard on every hash.
// ============================================================================

import { useState } from "react";
import { FileText, Copy, Check } from "lucide-react";
import type { AttestationRecord } from "./types";

interface GovernanceLeafBreakdownProps {
    attestation: AttestationRecord;
}

export function GovernanceLeafBreakdown({ attestation }: GovernanceLeafBreakdownProps) {
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const CopyButton = ({ text, label }: { text: string; label: string }) => (
        <button
            onClick={() => handleCopy(text, label)}
            className="hover:text-[var(--primary)] transition-colors flex items-center gap-1 text-[var(--surface-500)]"
        >
            {copied === label ? (
                <Check className="w-3.5 h-3.5 text-[var(--success)]" />
            ) : (
                <Copy className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px]">{copied === label ? "Copied" : "Copy"}</span>
        </button>
    );

    return (
        <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--surface-200)] pb-4">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[var(--primary)]" />
                    <h2 className="text-lg font-semibold text-[var(--surface-900)]">
                        AGL-001 Governance Leaf Breakdown
                    </h2>
                </div>
                <span className="text-xs font-mono text-[var(--surface-500)]">
                    ID: {attestation.id}
                </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
                {/* Governance Hash — Primary */}
                <div
                    className="p-3.5 rounded-xl border space-y-1"
                    style={{
                        backgroundColor: "color-mix(in srgb, var(--primary) 5%, var(--surface-50))",
                        borderColor: "color-mix(in srgb, var(--primary) 20%, var(--surface-300))",
                    }}
                >
                    <div className="flex items-center justify-between font-semibold text-[var(--primary)]">
                        <span>Canonical Governance Hash (SHA-256)</span>
                        <CopyButton text={attestation.governance_hash} label="gov" />
                    </div>
                    <div className="text-[var(--surface-800)] break-all select-all">
                        {attestation.governance_hash}
                    </div>
                </div>

                {/* Input & Response Hashes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] space-y-1">
                        <div className="flex items-center justify-between text-[var(--surface-500)]">
                            <span>Input Hash (SHA-256)</span>
                            <CopyButton text={attestation.input_hash} label="in" />
                        </div>
                        <div className="text-[var(--surface-700)] break-all text-[11px]">
                            {attestation.input_hash}
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] space-y-1">
                        <div className="flex items-center justify-between text-[var(--surface-500)]">
                            <span>Response Hash (SHA-256)</span>
                            <CopyButton text={attestation.response_hash} label="out" />
                        </div>
                        <div className="text-[var(--surface-700)] break-all text-[11px]">
                            {attestation.response_hash}
                        </div>
                    </div>
                </div>

                {/* Bound Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] flex justify-between items-center">
                        <span className="text-[var(--surface-500)]">Bound Model:</span>
                        <span className="text-[var(--surface-800)] font-semibold">{attestation.model_id}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] flex justify-between items-center">
                        <span className="text-[var(--surface-500)]">Bound Timestamp:</span>
                        <span className="text-[var(--surface-800)]">{attestation.leaf_timestamp}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
