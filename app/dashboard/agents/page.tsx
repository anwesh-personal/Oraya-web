import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgentExplorer, type AssignedAgentExtended } from "@/components/members/agents/AgentExplorer";
import { Bot } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
    title: "My Agents",
    description: "Explore the AI agents available to your account.",
};

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────────

async function getAccessibleAgents(): Promise<AssignedAgentExtended[]> {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) redirect("/login");

    const { data, error } = await (supabase.rpc as any)(
        "get_user_accessible_agents",
        { p_user_id: user.id }
    );

    if (error) {
        console.error("[agents/page] get_user_accessible_agents error:", error.message);
        return [];
    }

    return (data ?? []).map((row: any): AssignedAgentExtended => ({
        id: row.assignment_id ?? row.template_id,
        template_id: row.template_id,
        assignment_type: row.assignment_type as "push" | "entitled",
        assigned_at: row.assigned_at,
        config_overrides: row.config_overrides ?? {},
        template: {
            id: row.template_id,
            name: row.template_name,
            emoji: row.template_emoji,
            icon_url: null,
            tagline: row.template_tagline ?? null,
            description: row.template_description ?? null,
            category: row.template_category ?? null,
            plan_tier: row.template_plan_tier ?? "standard",
            version: row.template_version ?? null,
            tags: row.template_tags ?? [],
            personality_config: row.template_personality ?? null,
            factory_version: row.factory_version ?? null,
            factory_published_at: row.factory_published_at ?? null,
        },
    }));
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function AgentsPage() {
    const agents = await getAccessibleAgents();

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
                            <Bot className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--surface-900)] font-display">
                            My Agents
                        </h1>
                    </div>
                    <p className="text-sm text-[var(--surface-500)] ml-[3.25rem]">
                        AI agents available to your account based on your plan and assignments.
                    </p>
                </div>

                <a
                    href="https://oraya.dev/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                >
                    Get Oraya Desktop
                </a>
            </div>

            {/* ── Explorer ── */}
            <AgentExplorer agents={agents} />
        </div>
    );
}
