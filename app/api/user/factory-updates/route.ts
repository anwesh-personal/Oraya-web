import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
    authenticateDesktopRequest,
    isAuthError,
} from "@/lib/desktop-auth";
import {
    runFactoryUpdates,
    type FactoryMemoryRow,
    type FactoryTemplateMeta,
} from "@/lib/factory-updates";

export const dynamic = "force-dynamic";

// ─── POST: Check for factory memory updates ─────────────────────────────────
// Called by Oraya / Orakhos Desktop on launch (and periodically).
//
// Request body (JSON):
//   { agents: [{ template_id, current_version }] }
//
// Auth: desktop Bearer (`authenticateDesktopRequest`).
// Entitlement: `get_user_accessible_agents` (plan_tier_rank + explicit
// assignment — same predicate as 047_structured_agent_data.sql:145).
// Over-tier template_id → 403 (no memories). Entitled → 200 { updates }.
// Service-role is used only AFTER auth, to assemble entitled rows.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    // Desktop sends JWT as Authorization: Bearer — use desktop auth (not cookies)
    const authResult = await authenticateDesktopRequest(request);
    if (isAuthError(authResult)) {
        return authResult;
    }

    let agentVersions: Array<{ template_id: string; current_version: number }>;
    try {
        const body = await request.json();
        agentVersions = body.agents;
        if (!Array.isArray(agentVersions)) {
            throw new Error("Agents is not an array");
        }
    } catch {
        return NextResponse.json(
            { error: "Request body must contain 'agents' as a JSON array" },
            { status: 400 }
        );
    }

    if (agentVersions.length === 0) {
        return NextResponse.json({ updates: [] });
    }

    // Cap at 50 agents per request to prevent abuse
    if (agentVersions.length > 50) {
        return NextResponse.json(
            { error: "Maximum 50 agents per request" },
            { status: 400 }
        );
    }

    const serviceClient = createServiceRoleClient();

    try {
        const result = await runFactoryUpdates({
            userId: authResult.userId,
            agents: agentVersions,
            loadAccessibleTemplateIds: async (userId) => {
                const { data, error } = await serviceClient.rpc(
                    "get_user_accessible_agents",
                    { p_user_id: userId }
                );
                if (error) {
                    throw error;
                }
                return (data ?? [])
                    .map((row: { template_id?: string }) =>
                        row.template_id ? String(row.template_id) : ""
                    )
                    .filter(Boolean);
            },
            loadTemplate: async (id) => {
                const { data: template } = await (serviceClient
                    .from("agent_templates") as any)
                    .select("id, name, factory_version, factory_published_at")
                    .eq("id", id)
                    .eq("is_active", true)
                    .single();
                if (!template) return null;
                return template as FactoryTemplateMeta;
            },
            loadMemories: async (templateId) => {
                const { data: memories, error: memError } = await (serviceClient
                    .from("agent_template_memories") as any)
                    .select(`
                    factory_id,
                    category,
                    content,
                    importance,
                    tags,
                    version_added
                `)
                    .eq("template_id", templateId)
                    .eq("is_active", true)
                    .is("version_removed", null)
                    .order("category", { ascending: true })
                    .order("sort_order", { ascending: true });

                if (memError) {
                    console.error(`Factory memories fetch error for ${templateId}:`, memError);
                    return null;
                }
                return (memories || []) as FactoryMemoryRow[];
            },
        });

        return NextResponse.json(result.body, { status: result.status });
    } catch (err: any) {
        console.error("Factory updates API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
