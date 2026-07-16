import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProviderHub } from "@/components/members/providers/ProviderHub";
import { Cpu } from "lucide-react";

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
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: "color-mix(in srgb, var(--primary) 12%, var(--surface-100))",
                                border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
                            }}
                        >
                            <Cpu className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--surface-900)] font-display">
                            AI Providers
                        </h1>
                    </div>
                    <p className="text-sm text-[var(--surface-500)] ml-[3.25rem]">
                        Configure your own AI provider API keys. Add keys, validate instantly,
                        and select models for your agent widgets.
                    </p>
                </div>
            </div>

            {/* ── Provider Hub ── */}
            <ProviderHub providers={providers} />
        </div>
    );
}
