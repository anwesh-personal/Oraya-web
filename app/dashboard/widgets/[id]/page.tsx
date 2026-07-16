import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { WidgetEditor } from "@/components/members/widgets/WidgetEditor";

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
    title: "Edit Widget",
    description: "Fully configure your AI agent widget.",
};

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────────

async function getWidget(id: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect("/login");

    const { data, error } = await (supabase as any)
        .from("widget_deployments")
        .select(`
            *,
            agent_templates:template_id (
                id, name, emoji, tagline, category, icon_url,
                personality_config, description
            )
        `)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (error || !data) return null;
    return data;
}

async function getUserProviders() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await (supabase as any)
        .from("user_ai_providers")
        .select("id, provider, label, api_key_hint, is_valid, is_active, available_models")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    return data ?? [];
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function WidgetEditorPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [widget, providers] = await Promise.all([
        getWidget(id),
        getUserProviders(),
    ]);

    if (!widget) notFound();

    return (
        <div className="page-enter">
            <WidgetEditor widget={widget} providers={providers} />
        </div>
    );
}
