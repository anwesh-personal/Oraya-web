import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VerifyCertificateClient } from "./VerifyCertificateClient";
import type { AttestationRecord, EngineConfigMap } from "@/components/members/audit/types";

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
    title: "Attestation Verification",
    description: "ASIS attestation certificate — proof status is derived from live prover honesty, never from a seed row.",
};

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// Server-Side Data Fetching
// ─────────────────────────────────────────────────────────────

async function getAttestation(supabase: any, id: string): Promise<AttestationRecord | null> {
    const { data, error } = await (supabase as any)
        .from("asis_attestations")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) return null;
    return data as AttestationRecord;
}

async function getEngineConfig(supabase: any): Promise<EngineConfigMap> {
    const { data, error } = await (supabase as any)
        .from("asis_engine_config")
        .select("*")
        .order("category")
        .order("config_key");

    if (error || !data) return {};

    const configMap: EngineConfigMap = {};
    for (const row of data) {
        configMap[row.config_key] = {
            value: row.config_value,
            label: row.label,
            description: row.description,
            category: row.category,
            is_editable: row.is_editable,
            updated_at: row.updated_at,
        };
    }
    return configMap;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function VerifyPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const supabase = await createServerSupabaseClient();

    // Fetch attestation and config in parallel
    const [attestation, config] = await Promise.all([
        getAttestation(supabase, id),
        getEngineConfig(supabase),
    ]);

    if (!attestation) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[var(--surface-0)] text-[var(--surface-800)] p-6 md:p-12 relative overflow-hidden">
            {/* Ambient background accents */}
            <div
                className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-30"
                style={{ backgroundColor: "var(--success)" }}
            />
            <div
                className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none opacity-20"
                style={{ backgroundColor: "var(--info)" }}
            />

            <div className="max-w-5xl mx-auto relative z-10">
                <VerifyCertificateClient
                    attestation={attestation}
                    config={config}
                />
            </div>
        </div>
    );
}
