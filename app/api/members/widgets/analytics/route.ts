// ============================================================================
// Widget Analytics API — Stats, conversation metrics, usage data
// GET /api/members/widgets/analytics?widget_id=xxx
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

        const widgetId = request.nextUrl.searchParams.get("widget_id");
        if (!widgetId) {
            return NextResponse.json({ error: "widget_id required" }, { status: 400 });
        }

        // Verify ownership
        const { data: widget, error: wErr } = await (supabase as any)
            .from("widget_deployments")
            .select("id, name, total_conversations, total_messages, total_tokens_used, created_at, is_active")
            .eq("id", widgetId)
            .eq("user_id", user.id)
            .single();

        if (wErr || !widget) {
            return NextResponse.json({ error: "Widget not found" }, { status: 404 });
        }

        // Fetch session stats
        const { data: sessions, error: sErr } = await (supabase as any)
            .from("widget_sessions")
            .select("id, visitor_id, visitor_ip, visitor_meta, message_count, token_count, status, created_at, last_message_at")
            .eq("widget_id", widgetId)
            .order("created_at", { ascending: false })
            .limit(200);

        const sessionList = sessions || [];

        // Compute analytics
        const totalSessions = sessionList.length;
        const activeSessions = sessionList.filter((s: any) => s.status === "active").length;
        const totalMessages = sessionList.reduce((sum: number, s: any) => sum + (s.message_count || 0), 0);
        const totalTokens = sessionList.reduce((sum: number, s: any) => sum + (s.token_count || 0), 0);
        const avgMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions * 10) / 10 : 0;

        // Unique visitors
        const uniqueVisitors = new Set(sessionList.map((s: any) => s.visitor_id)).size;

        // Messages per day (last 30 days)
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 86400000;
        const dailyMap: Record<string, { messages: number; sessions: number; tokens: number }> = {};

        for (let d = 0; d < 30; d++) {
            const date = new Date(now - d * 86400000).toISOString().split("T")[0];
            dailyMap[date] = { messages: 0, sessions: 0, tokens: 0 };
        }

        for (const s of sessionList) {
            const date = new Date(s.created_at).toISOString().split("T")[0];
            if (dailyMap[date]) {
                dailyMap[date].sessions++;
                dailyMap[date].messages += s.message_count || 0;
                dailyMap[date].tokens += s.token_count || 0;
            }
        }

        const dailyStats = Object.entries(dailyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, stats]) => ({ date, ...stats }));

        // Top referrers
        const refMap: Record<string, number> = {};
        for (const s of sessionList) {
            const ref = s.visitor_meta?.referrer || s.visitor_meta?.url || "direct";
            try {
                const host = new URL(ref).hostname;
                refMap[host] = (refMap[host] || 0) + 1;
            } catch {
                refMap["direct"] = (refMap["direct"] || 0) + 1;
            }
        }
        const topReferrers = Object.entries(refMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([domain, count]) => ({ domain, count }));

        // Recent conversations (last 20)
        const recentConversations = sessionList.slice(0, 20).map((s: any) => ({
            id: s.id,
            visitor_id: s.visitor_id,
            message_count: s.message_count,
            token_count: s.token_count,
            status: s.status,
            created_at: s.created_at,
            last_message_at: s.last_message_at,
            referrer: s.visitor_meta?.url || "unknown",
        }));

        return NextResponse.json({
            widget: {
                id: widget.id,
                name: widget.name,
                is_active: widget.is_active,
                created_at: widget.created_at,
            },
            summary: {
                total_sessions: widget.total_conversations || totalSessions,
                total_messages: widget.total_messages || totalMessages,
                total_tokens_used: widget.total_tokens_used || totalTokens,
                active_sessions: activeSessions,
                unique_visitors: uniqueVisitors,
                avg_messages_per_session: avgMessagesPerSession,
            },
            daily_stats: dailyStats,
            top_referrers: topReferrers,
            recent_conversations: recentConversations,
        });

    } catch (err: any) {
        console.error("[widget-analytics] Error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
