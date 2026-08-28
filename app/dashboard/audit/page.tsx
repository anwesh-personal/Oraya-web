import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuditDashboardClient } from "./AuditDashboardClient";
import type { EngineConfigMap, AttestationStats } from "@/components/members/audit/types";

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
    title: "Governance leaf audit",
    description: "ASIS governance-leaf ledger. Proof labels follow live prover honesty — mock/offline never reads as verified.",
};

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// Server-Side Data Fetching
// ─────────────────────────────────────────────────────────────

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

async function getStats(supabase: any, userId: string): Promise<AttestationStats> {
    const db = supabase as any;
    const [totalRes, validRes, invalidRes, pendingRes, unattestedRes, latestRes, modelsRes] = await Promise.all([
        db.from("asis_attestations").select("id", { count: "exact", head: true }).eq("user_id", userId),
        db.from("asis_attestations").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("verification_status", "verified_valid"),
        db.from("asis_attestations").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("verification_status", "verified_invalid"),
        db.from("asis_attestations").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("verification_status", "pending"),
        db.from("asis_attestations").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("verification_status", "unattested"),
        db.from("asis_attestations").select("created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single(),
        db.from("asis_attestations").select("model_id").eq("user_id", userId),
    ]);

    const modelCounts: Record<string, number> = {};
    if (modelsRes.data) {
        for (const row of modelsRes.data) {
            const mid = (row as any).model_id as string;
            modelCounts[mid] = (modelCounts[mid] || 0) + 1;
        }
    }

    const total = totalRes.count ?? 0;
    const valid = validRes.count ?? 0;
    const passRate = total > 0 ? (valid / total) * 100 : 0;

    return {
        total,
        verified_valid: valid,
        verified_invalid: invalidRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        unattested: unattestedRes.count ?? 0,
        pass_rate: Math.round(passRate * 100) / 100,
        last_attestation_at: latestRes.data?.created_at ?? null,
        models: modelCounts,
    };
}

async function getAvailableModels(supabase: any): Promise<string[]> {
    const db = supabase as any;
    // Pull from managed_ai_keys where provider = 'oraya' — never hardcoded
    const { data } = await db
        .from("managed_ai_keys")
        .select("key_name")
        .eq("provider", "oraya")
        .eq("is_active", true);

    if (!data || data.length === 0) return [];

    // Also get distinct model_ids from existing attestations
    const { data: attestedModels } = await db
        .from("asis_attestations")
        .select("model_id");

    const modelSet = new Set<string>();
    for (const row of data) {
        modelSet.add(row.key_name);
    }
    if (attestedModels) {
        for (const row of attestedModels) {
            modelSet.add((row as any).model_id);
        }
    }

    return Array.from(modelSet).sort();
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function AuditPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect("/login");

    // Fetch all data server-side in parallel
    const [config, stats, availableModels] = await Promise.all([
        getEngineConfig(supabase),
        getStats(supabase, user.id),
        getAvailableModels(supabase),
    ]);

    return (
        <div className="space-y-8 page-enter">
            <AuditDashboardClient
                config={config}
                stats={stats}
                availableModels={availableModels}
            />
        </div>
    );
}
