import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProviderHub from "@/components/members/providers/ProviderHub";

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
    title: "AI Providers",
    description: "Configure your AI provider API keys for powering agent widgets.",
};

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface UserAIProvider {
    id: string;
    provider: "openai" | "anthropic" | "google" | "mistral" | "xai" | "custom";
    label: string;
    api_key_display: string;
    api_key_hint: string;
    base_url: string | null;
    is_valid: boolean;
    validated_at: string | null;
    validation_error: string | null;
    available_models: { id: string; name: string; context_window?: number }[];
    models_fetched_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────────

async function getProviders(): Promise<UserAIProvider[]> {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect("/login");

    const { data, error } = await (supabase as any)
        .from("user_ai_providers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[providers/page] Fetch error:", error.message);
        return [];
    }

    return (data ?? []).map((row: any): UserAIProvider => ({
        ...row,
        api_key_encrypted: undefined,
        api_key_display: row.api_key_hint,
    }));
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function ProvidersPage() {
    const providers = await getProviders();

    return (
        <div className="space-y-8 page-enter">
            <ProviderHub providers={providers} />
        </div>
    );
}
