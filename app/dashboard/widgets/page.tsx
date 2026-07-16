import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WidgetDeployments } from "@/components/members/widgets/WidgetDeployments";
import { CodeXml } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
    title: "Widget Deployments",
    description: "Deploy AI agents as embeddable chat widgets on any website.",
};

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface WidgetDeployment {
    id: string;
    name: string;
    template_id: string;
    widget_type: "bubble" | "inline" | "fullpage";
    persistence_mode: "ephemeral" | "ip_persistent" | "user_persistent" | "gated";
    position: string;
    primary_color: string;
    accent_color: string;
    dark_mode: boolean;
    is_active: boolean;
    api_key: string;
    total_conversations: number;
    total_messages: number;
    total_tokens_used: number;
    created_at: string;
    updated_at: string;
    welcome_message: string;
    placeholder: string;
    rate_limit_rpm: number;
    max_tokens: number;
    allowed_domains: string[];
    auto_open: boolean;
    show_branding: boolean;
    agent_templates: {
        id: string;
        name: string;
        emoji: string;
        tagline: string | null;
        category: string | null;
        icon_url: string | null;
    } | null;
}

export interface AgentTemplateOption {
    id: string;
    name: string;
    emoji: string;
    tagline: string | null;
    category: string | null;
}

// ─────────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────────

async function getWidgets(): Promise<WidgetDeployment[]> {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect("/login");

    const { data, error } = await supabase
        .from("widget_deployments")
        .select(`
            *,
            agent_templates:template_id (
                id, name, emoji, tagline, category, icon_url
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[widgets/page] Fetch error:", error.message);
        return [];
    }

    return (data ?? []) as WidgetDeployment[];
}

async function getAvailableAgents(): Promise<AgentTemplateOption[]> {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect("/login");

    const { data, error } = await (supabase.rpc as any)(
        "get_user_accessible_agents",
        { p_user_id: user.id }
    );

    if (error) {
        console.error("[widgets/page] agents fetch error:", error.message);
        return [];
    }

    return (data ?? []).map((row: any): AgentTemplateOption => ({
        id: row.template_id,
        name: row.template_name,
        emoji: row.template_emoji,
        tagline: row.template_tagline ?? null,
        category: row.template_category ?? null,
    }));
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function WidgetsPage() {
    const [widgets, agents] = await Promise.all([
        getWidgets(),
        getAvailableAgents(),
    ]);

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
                            <CodeXml className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--surface-900)] font-display">
                            Widget Deployments
                        </h1>
                    </div>
                    <p className="text-sm text-[var(--surface-500)] ml-[3.25rem]">
                        Deploy AI agents as embeddable chat widgets on any website.
                        Configure, customize, and get your embed code.
                    </p>
                </div>
            </div>

            {/* ── Widget Manager ── */}
            <WidgetDeployments
                widgets={widgets}
                availableAgents={agents}
            />
        </div>
    );
}
