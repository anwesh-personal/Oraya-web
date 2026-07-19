// ============================================================================
// Widget Knowledge Base API — RAG ingestion + listing for a member's widget.
// Authenticated (member dashboard). Ownership of the target deployment is
// verified against the caller before any write.
//
// Ingestion runs through lib/agent-runtime (ingestKbSource): chunk → embed via
// the sovereign gateway (1024d) → write kb_sources + kb_chunks. Writes use a
// SERVICE-ROLE client because kb_* RLS is owner-read + service-ALL (there is no
// owner INSERT policy — runtime/ingestion writes are service-role, mirroring 049).
//
// FAIL-LOUD: if the embedder is unconfigured/unreachable, ingestion errors and
// the source is marked 'degraded' — we never write a fake/hash embedding.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ingestKbSource, resolveWidgetGateway, type KbSourceType } from "@/lib/agent-runtime";

export const dynamic = "force-dynamic";

function serviceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

/** Verifies the caller owns the deployment (or that it's an unscoped tenant KB). */
async function assertDeploymentOwnership(
    authed: Awaited<ReturnType<typeof createServerSupabaseClient>>,
    userId: string,
    deploymentId: string | null,
): Promise<boolean> {
    if (!deploymentId) return true; // tenant-shared KB (deployment_id null)
    const { data } = await (authed as any)
        .from("widget_deployments")
        .select("id")
        .eq("id", deploymentId)
        .eq("user_id", userId)
        .maybeSingle();
    return !!data;
}

const VALID_SOURCE_TYPES: KbSourceType[] = ["document", "url", "sitemap", "manual", "structured"];

// ─── GET: List KB sources for a widget (or tenant-shared) ────────────────────

export async function GET(request: NextRequest) {
    try {
        const authed = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await authed.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const deploymentId = searchParams.get("deployment_id");

        // Owner-read RLS lets the authed client read their own kb_sources directly.
        let q = (authed as any)
            .from("kb_sources")
            .select("id, deployment_id, source_type, title, source_url, indexing_status, indexing_error, total_chunks, last_indexed_at, is_active, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        if (deploymentId) q = q.eq("deployment_id", deploymentId);

        const { data, error } = await q;
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ sources: data ?? [] });
    } catch (err: any) {
        console.error("[widgets/knowledge/GET] Unexpected:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ─── POST: Ingest a KB source ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const authed = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await authed.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            deployment_id = null,
            source_type,
            title,
            content,
            source_url = null,
            file_path = null,
            mime_type = null,
            metadata = {},
        } = body || {};

        if (!source_type || !VALID_SOURCE_TYPES.includes(source_type)) {
            return NextResponse.json(
                { error: `source_type must be one of: ${VALID_SOURCE_TYPES.join(", ")}` },
                { status: 400 },
            );
        }
        if (!title || typeof title !== "string") {
            return NextResponse.json({ error: "title is required" }, { status: 400 });
        }
        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return NextResponse.json({ error: "content is required (extracted text to index)" }, { status: 400 });
        }

        const owns = await assertDeploymentOwnership(authed, user.id, deployment_id);
        if (!owns) {
            return NextResponse.json({ error: "Deployment not found or not owned by you" }, { status: 403 });
        }

        // Writes must be service-role (kb_* RLS has no owner INSERT policy).
        const svc = serviceClient();

        // Resolve the embedder from the TARGET widget's OWN provider config
        // (per-tenant; no global env, no hardcoded host/key/model). Ingestion
        // requires a deployment so we can resolve that widget's embedder — a
        // tenant-shared KB (no deployment) has no widget to resolve and fails
        // loud below rather than silently using a platform embedder.
        let gateway = null;
        if (deployment_id) {
            const { data: widget } = await svc
                .from("widget_deployments")
                .select("id, user_id, user_provider_id, config")
                .eq("id", deployment_id)
                .eq("user_id", user.id)
                .maybeSingle();
            if (widget) {
                gateway = await resolveWidgetGateway({ supabase: svc, widget });
            }
        }

        try {
            const result = await ingestKbSource({
                supabase: svc,
                gateway,
                userId: user.id,
                deploymentId: deployment_id,
                sourceType: source_type,
                title,
                content,
                sourceUrl: source_url,
                filePath: file_path,
                mimeType: mime_type,
                metadata,
            });
            return NextResponse.json({
                source_id: result.sourceId,
                chunk_count: result.chunkCount,
                indexing_status: result.status,
            });
        } catch (err: any) {
            // Honest failure surface (embedder down / misconfigured / dim mismatch).
            return NextResponse.json(
                { error: err?.message || "Ingestion failed", indexing_status: "degraded" },
                { status: 502 },
            );
        }
    } catch (err: any) {
        console.error("[widgets/knowledge/POST] Unexpected:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
