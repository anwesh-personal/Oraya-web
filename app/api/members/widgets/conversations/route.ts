// ============================================================================
// Widget Conversations API — View + export conversation history
// GET /api/members/widgets/conversations?widget_id=xxx
// GET /api/members/widgets/conversations?widget_id=xxx&session_id=yyy
// GET /api/members/widgets/conversations?widget_id=xxx&export=csv
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = request.nextUrl.searchParams;
        const widgetId = params.get("widget_id");
        const sessionId = params.get("session_id");
        const exportFormat = params.get("export");

        if (!widgetId) {
            return NextResponse.json({ error: "widget_id required" }, { status: 400 });
        }

        // Verify ownership
        const { data: widget } = await (supabase as any)
            .from("widget_deployments")
            .select("id, name, user_id")
            .eq("id", widgetId)
            .eq("user_id", user.id)
            .single();

        if (!widget) {
            return NextResponse.json({ error: "Widget not found" }, { status: 404 });
        }

        // Single conversation detail
        if (sessionId) {
            const { data: session } = await (supabase as any)
                .from("widget_sessions")
                .select("*")
                .eq("id", sessionId)
                .eq("widget_id", widgetId)
                .single();

            if (!session) {
                return NextResponse.json({ error: "Session not found" }, { status: 404 });
            }

            return NextResponse.json({
                session: {
                    id: session.id,
                    visitor_id: session.visitor_id,
                    visitor_meta: session.visitor_meta,
                    message_count: session.message_count,
                    token_count: session.token_count,
                    status: session.status,
                    created_at: session.created_at,
                    last_message_at: session.last_message_at,
                    messages: session.messages || [],
                },
            });
        }

        // List conversations
        const page = parseInt(params.get("page") || "1");
        const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
        const offset = (page - 1) * limit;

        const { data: sessions, count } = await (supabase as any)
            .from("widget_sessions")
            .select("id, visitor_id, visitor_meta, message_count, token_count, status, created_at, last_message_at, messages", { count: "exact" })
            .eq("widget_id", widgetId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        const sessionList = sessions || [];

        // CSV export
        if (exportFormat === "csv") {
            const rows = ["Session ID,Visitor ID,Messages,Tokens,Status,Created,Last Message,First Message,Last Response"];
            for (const s of sessionList) {
                const msgs = s.messages || [];
                const firstMsg = msgs.find((m: any) => m.role === "user")?.content || "";
                const lastResp = [...msgs].reverse().find((m: any) => m.role === "assistant")?.content || "";
                rows.push([
                    s.id,
                    s.visitor_id,
                    s.message_count,
                    s.token_count,
                    s.status,
                    s.created_at,
                    s.last_message_at || "",
                    `"${firstMsg.replace(/"/g, '""').slice(0, 200)}"`,
                    `"${lastResp.replace(/"/g, '""').slice(0, 200)}"`,
                ].join(","));
            }

            return new Response(rows.join("\n"), {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="${widget.name}-conversations.csv"`,
                },
            });
        }

        // JSON export
        if (exportFormat === "json") {
            const exportData = sessionList.map((s: any) => ({
                session_id: s.id,
                visitor_id: s.visitor_id,
                messages: s.messages,
                created_at: s.created_at,
            }));

            return new Response(JSON.stringify(exportData, null, 2), {
                headers: {
                    "Content-Type": "application/json",
                    "Content-Disposition": `attachment; filename="${widget.name}-conversations.json"`,
                },
            });
        }

        // Normal list (without full messages for perf)
        const list = sessionList.map((s: any) => {
            const msgs = s.messages || [];
            const firstMsg = msgs.find((m: any) => m.role === "user")?.content || "";
            return {
                id: s.id,
                visitor_id: s.visitor_id,
                message_count: s.message_count,
                token_count: s.token_count,
                status: s.status,
                created_at: s.created_at,
                last_message_at: s.last_message_at,
                preview: firstMsg.slice(0, 120),
                referrer: s.visitor_meta?.url || "",
            };
        });

        return NextResponse.json({
            conversations: list,
            pagination: { page, limit, total: count || 0 },
        });

    } catch (err: any) {
        console.error("[widget-conversations] Error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
