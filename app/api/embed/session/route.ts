// ============================================================================
// Embed Session API — Returns stored conversation history for a widget session
// Public endpoint — keyed by widget API key (wgt_xxxx)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function corsHeaders(origin: string | null): Record<string, string> {
    return {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Widget-Key",
        "Access-Control-Max-Age": "86400",
    };
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(request.headers.get("origin")),
    });
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    const cors = corsHeaders(origin);

    try {
        const { searchParams } = new URL(request.url);
        const apiKey =
            searchParams.get("key") || request.headers.get("x-widget-key");
        const sessionId = searchParams.get("session_id");
        const visitorId = searchParams.get("visitor_id");

        // ─── Validate API key ───────────────────────────────────────────
        if (!apiKey || !apiKey.startsWith("wgt_")) {
            return NextResponse.json(
                { error: "Missing or invalid widget key" },
                { status: 401, headers: cors }
            );
        }

        // ─── Resolve widget ─────────────────────────────────────────────
        const { data: widget, error: wErr } = await supabase
            .from("widget_deployments")
            .select("id, persistence_mode")
            .eq("api_key", apiKey)
            .eq("is_active", true)
            .single();

        if (wErr || !widget) {
            return NextResponse.json(
                { error: "Widget not found or inactive" },
                { status: 404, headers: cors }
            );
        }

        // Ephemeral widgets don't persist sessions
        if (widget.persistence_mode === "ephemeral") {
            return NextResponse.json({ messages: [] }, { headers: cors });
        }

        // Need at least one identifier to look up a session
        if (!sessionId && !visitorId) {
            return NextResponse.json({ messages: [] }, { headers: cors });
        }

        // ─── Look up session ────────────────────────────────────────────
        let session: any = null;

        // Try by session_id first (most specific)
        if (sessionId) {
            const { data } = await supabase
                .from("widget_sessions")
                .select("messages")
                .eq("id", sessionId)
                .eq("widget_id", widget.id)
                .eq("status", "active")
                .single();
            session = data;
        }

        // Fall back to visitor_id lookup
        if (!session && visitorId) {
            const { data } = await supabase
                .from("widget_sessions")
                .select("messages")
                .eq("widget_id", widget.id)
                .eq("visitor_id", visitorId)
                .eq("status", "active")
                .order("updated_at", { ascending: false })
                .limit(1)
                .single();
            session = data;
        }

        // No session found — return empty (not an error)
        if (!session) {
            return NextResponse.json({ messages: [] }, { headers: cors });
        }

        return NextResponse.json(
            { messages: session.messages || [] },
            { headers: cors }
        );
    } catch (err: any) {
        console.error("[embed/session] Unexpected:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: cors }
        );
    }
}
