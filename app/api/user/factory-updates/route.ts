import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
    authenticateDesktopRequest,
    isAuthError,
} from "@/lib/desktop-auth";

export const dynamic = "force-dynamic";

// ─── POST: Check for factory memory updates ─────────────────────────────────
// Called by Oraya Desktop on launch (and periodically) to check if any
// installed agents have factory memory updates available.
//
// Request body (JSON):
//   { agents: [{ template_id, current_version }] }
//
// Response:
//   { updates: [{ template_id, latest_version, memories: [...] }] }
//
// The desktop receives the FULL current factory memory set and performs
// the merge locally (add new, update changed, remove missing).
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
        const updates = [];

        for (const { template_id, current_version } of agentVersions) {
            if (!template_id) continue;

            // Check if template has a newer factory version
            const { data: template } = await (serviceClient
                .from("agent_templates") as any)
                .select("id, name, factory_version, factory_published_at")
                .eq("id", template_id)
                .eq("is_active", true)
                .single();

            if (!template) continue;

            const latestVersion = template.factory_version ?? 0;
            const clientVersion = current_version ?? 0;

            // No update needed
            if (latestVersion <= clientVersion) continue;

            // Fetch all currently active factory memories for this template
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
                .eq("template_id", template_id)
                .eq("is_active", true)
                .is("version_removed", null)
                .order("category", { ascending: true })
                .order("sort_order", { ascending: true });

            if (memError) {
                console.error(`Factory memories fetch error for ${template_id}:`, memError);
                continue;
            }

            updates.push({
                template_id,
                template_name: template.name,
                from_version: clientVersion,
                latest_version: latestVersion,
                published_at: template.factory_published_at,
                memories: memories || [],
            });
        }

        return NextResponse.json({ updates });
    } catch (err: any) {
        console.error("Factory updates API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
