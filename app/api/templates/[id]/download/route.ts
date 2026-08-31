import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
    authenticateDesktopRequest,
    isAuthError,
} from "@/lib/desktop-auth";
import {
    assembleTemplateDownloadPayload,
    runTemplateDownload,
    type TemplateRecord,
} from "@/lib/template-download";

export const dynamic = "force-dynamic";

// ─── GET: Full template download (includes all composition layers) ───────────
// Gallery / .oraya package path. The live desktop installer does NOT call
// this — it uses GET /api/desktop/sync-agents (already Bearer-gated).
//
// Auth: desktop Bearer (`authenticateDesktopRequest`) or cookie session.
// Entitlement: `get_user_accessible_agents` (plan_tier_rank + explicit
// assignment — same predicate as 047_structured_agent_data.sql:145).
// Service-role is used only AFTER auth + entitlement, to assemble layers.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: templateId } = await params;

    const auth = await resolveTemplateDownloadAuth(request);
    if ("denied" in auth) {
        return auth.denied;
    }

    const supabase = createServiceRoleClient();

    try {
        const result = await runTemplateDownload({
            userId: auth.userId,
            templateId,
            loadTemplate: async (id) => {
                const { data: template, error } = await (supabase
                    .from("agent_templates") as any)
                    .select("*")
                    .eq("id", id)
                    .eq("is_active", true)
                    .single();
                if (error || !template) return null;
                return template as TemplateRecord;
            },
            loadAccessibleTemplateIds: async (userId) => {
                const { data, error } = await supabase.rpc(
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
            loadPayload: async (template) => {
                const [
                    promptsResult,
                    examplesResult,
                    knowledgeBasesResult,
                    rulesResult,
                    memoriesResult,
                ] = await Promise.all([
                    (supabase.from("agent_template_prompts") as any)
                        .select("prompt_type, label, content, priority, is_active")
                        .eq("template_id", template.id)
                        .eq("is_active", true)
                        .order("priority", { ascending: true }),

                    (supabase.from("agent_template_examples") as any)
                        .select("user_input, expected_output, explanation, tags, sort_order")
                        .eq("template_id", template.id)
                        .eq("is_active", true)
                        .order("sort_order", { ascending: true }),

                    (supabase.from("agent_template_knowledge_bases") as any)
                        .select(`
                    name, description, kb_type,
                    source_url, content, file_path, file_size_bytes, mime_type,
                    retrieval_strategy, chunk_size, chunk_overlap,
                    max_chunks_per_query, embedding_model,
                    indexing_status, total_chunks
                `)
                        .eq("template_id", template.id)
                        .eq("is_active", true),

                    (supabase.from("agent_template_rules") as any)
                        .select("rule_type, content, category, severity, sort_order")
                        .eq("template_id", template.id)
                        .eq("is_active", true)
                        .order("rule_type", { ascending: true })
                        .order("severity", { ascending: true })
                        .order("sort_order", { ascending: true }),

                    (supabase.from("agent_template_memories") as any)
                        .select("factory_id, category, content, importance, tags, version_added")
                        .eq("template_id", template.id)
                        .eq("is_active", true)
                        .is("version_removed", null)
                        .order("category", { ascending: true })
                        .order("sort_order", { ascending: true }),
                ]);

                return assembleTemplateDownloadPayload(template, {
                    prompt_layers: promptsResult.data || [],
                    examples: examplesResult.data || [],
                    knowledge_bases: knowledgeBasesResult.data || [],
                    rules: rulesResult.data || [],
                    factory_memories: memoriesResult.data || [],
                });
            },
        });

        return NextResponse.json(result.body, { status: result.status });
    } catch (err: any) {
        console.error("Template download error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function resolveTemplateDownloadAuth(
    request: NextRequest
): Promise<{ userId: string } | { denied: NextResponse }> {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const authResult = await authenticateDesktopRequest(request);
        if (isAuthError(authResult)) {
            return { denied: authResult };
        }
        return { userId: authResult.userId };
    }

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) {
        return {
            denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }
    return { userId: user.id };
}
