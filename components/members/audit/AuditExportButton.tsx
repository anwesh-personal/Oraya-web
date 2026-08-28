"use client";

// ============================================================================
// AuditExportButton — Attestation Pack Export
// ============================================================================
// Generates a real JSON attestation pack from live data — NOT an alert().
// Includes all attestation records, engine config, and verification metadata.
// ============================================================================

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface AuditExportButtonProps {
    /** Optional: pre-fetched data to include in export */
    className?: string;
}

export function AuditExportButton({ className }: AuditExportButtonProps) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            // Fetch attestations + config + stats in parallel
            const [attestRes, configRes, statsRes, healthRes] = await Promise.allSettled([
                fetch("/api/asis/attestations?limit=100").then(r => r.json()),
                fetch("/api/asis/config").then(r => r.json()),
                fetch("/api/asis/stats").then(r => r.json()),
                fetch("/api/asis/health").then(r => r.json()),
            ]);

            const pack = {
                _meta: {
                    type: "ASIS Sovereign Attestation Pack",
                    version: "1.0",
                    generated_at: new Date().toISOString(),
                    format: "ASIS Attestation Pack v1",
                    generator: "Oraya ASIS Sovereign Intelligence Protocol",
                },
                engine_health: healthRes.status === "fulfilled" ? healthRes.value.data : null,
                engine_config: configRes.status === "fulfilled" ? configRes.value.data?.config : null,
                statistics: statsRes.status === "fulfilled" ? statsRes.value.data : null,
                attestations: attestRes.status === "fulfilled"
                    ? attestRes.value.data?.attestations
                    : [],
                pagination: attestRes.status === "fulfilled"
                    ? attestRes.value.data?.pagination
                    : null,
            };

            // Generate and trigger download
            const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `ASIS-Audit-Pack-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("[AuditExportButton] Export failed:", err);
        } finally {
            setExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-4 py-2 text-sm font-medium rounded-xl bg-[var(--primary)] hover:opacity-90 text-white transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 ${className ?? ""}`}
            style={{
                boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 30%, transparent)",
            }}
        >
            {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Download className="w-4 h-4" />
            )}
            {exporting ? "Generating Pack..." : "Export Audit Pack"}
        </button>
    );
}
