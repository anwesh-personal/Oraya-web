import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
    authenticateDesktopRequest,
    isAuthError,
} from "@/lib/desktop-auth";

export const dynamic = "force-dynamic";

// ─── POST: Report an agent event from the desktop ───────────────────────────
// Fire-and-forget from Oraya Desktop — reports install, uninstall, patch events.
// Never blocks or fails the caller's operation.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const authResult = await authenticateDesktopRequest(request);
    if (isAuthError(authResult)) {
        return authResult;
    }

    const userId = authResult.userId;

    const body = await request.json();
    const {
        event_type, template_id, agent_name,
        device_id, device_name, os_type, app_version,
        source,
        from_factory_version, to_factory_version,
        memories_added, memories_updated, memories_removed,
        metadata,
    } = body;

    if (!event_type || !agent_name) {
        return NextResponse.json(
            { error: "event_type and agent_name are required" },
            { status: 400 }
        );
    }

    const validEvents = ["install", "uninstall", "update", "patch_check", "patch_applied"];
    if (!validEvents.includes(event_type)) {
        return NextResponse.json(
            { error: `event_type must be one of: ${validEvents.join(", ")}` },
            { status: 400 }
        );
    }

    // Use service role for the insert (user RLS only allows INSERT with matching user_id)
    const serviceClient = createServiceRoleClient();

    try {
        const { error } = await (serviceClient
            .from("user_agent_events") as any)
            .insert({
                user_id: userId,
                template_id: template_id || null,
                agent_name,
                event_type,
                device_id: device_id || null,
                device_name: device_name || null,
                os_type: os_type || null,
                app_version: app_version || null,
                source: source || "gallery",
                from_factory_version: from_factory_version ?? null,
                to_factory_version: to_factory_version ?? null,
                memories_added: memories_added ?? null,
                memories_updated: memories_updated ?? null,
                memories_removed: memories_removed ?? null,
                metadata: metadata || {},
            });

        if (error) {
            console.error("Agent event insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Agent events API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
