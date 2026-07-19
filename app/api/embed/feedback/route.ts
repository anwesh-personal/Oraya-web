// ============================================================================
// Embed Feedback API — Records 👍/👎 ratings for widget assistant messages.
// NO user auth required. Authenticates via widget API key (wgt_xxxx).
// Validates origin domain, enforces rate limits.
//
// IMPORTANT: This route intentionally performs NO model call and NO token
// deduction. It only annotates the matching assistant message inside the
// session's `messages` JSONB with a lightweight feedback record. This replaces
// the old behaviour where the widget POSTed `message: "__feedback__"` to the
// chat endpoint, which processed it as a real user turn and burned tokens.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── CORS Headers (mirrors embed/chat/route.ts) ─────────────────────────────

function corsHeaders(origin: string | null, allowedDomains: string[]): Record<string, string> {
    const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Widget-Key",
        "Access-Control-Max-Age": "86400",
    };

    if (!allowedDomains || allowedDomains.length === 0) {
        headers["Access-Control-Allow-Origin"] = origin || "*";
    } else if (origin) {
        try {
            const originHost = new URL(origin).hostname;
            const isAllowed = allowedDomains.some(d => {
                const clean = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
                return originHost === clean || originHost.endsWith("." + clean);
            });
            if (isAllowed) {
                headers["Access-Control-Allow-Origin"] = origin;
            }
        } catch {
            // Invalid origin — don't set CORS
        }
    }

    return headers;
}

// ─── Rate Limiter (in-memory, per-process) ──────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, rpm: number): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
        return true;
    }

    if (entry.count >= rpm) return false;
    entry.count++;
    return true;
}

// ─── OPTIONS (CORS preflight) ───────────────────────────────────────────────

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(request.headers.get("origin"), []),
    });
}

// ─── POST: Record feedback ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    try {
        const apiKey = request.headers.get("x-widget-key");
        if (!apiKey || !apiKey.startsWith("wgt_")) {
            return NextResponse.json(
                { error: "Missing or invalid widget key" },
                { status: 401, headers: corsHeaders(origin, []) }
            );
        }

        // ─── Resolve widget ─────────────────────────────────────────────
        const { data: widget, error: wErr } = await supabase
            .from("widget_deployments")
            .select("id, allowed_domains, rate_limit_rpm, persistence_mode, is_active")
            .eq("api_key", apiKey)
            .eq("is_active", true)
            .single();

        if (wErr || !widget) {
            return NextResponse.json(
                { error: "Widget not found or inactive" },
                { status: 404, headers: corsHeaders(origin, []) }
            );
        }

        // ─── Domain validation (same allowlist as chat routes) ──────────
        const cors = corsHeaders(origin, widget.allowed_domains ?? []);
        if (
            widget.allowed_domains?.length > 0 &&
            !cors["Access-Control-Allow-Origin"]
        ) {
            return NextResponse.json(
                { error: "Domain not authorized" },
                { status: 403, headers: cors }
            );
        }

        // ─── Parse body ─────────────────────────────────────────────────
        const body = await request.json();
        const { session_id, rating, message_content } = body;

        if (rating !== "up" && rating !== "down") {
            return NextResponse.json(
                { error: "rating must be 'up' or 'down'" },
                { status: 400, headers: cors }
            );
        }

        if (!session_id || typeof session_id !== "string") {
            return NextResponse.json(
                { error: "session_id is required" },
                { status: 400, headers: cors }
            );
        }

        // ─── Rate limit (feedback writes to DB, keep it bounded) ─────────
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || request.headers.get("x-real-ip")
            || "unknown";
        if (!checkRateLimit(`fb:${widget.id}:${ip}`, widget.rate_limit_rpm)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please wait." },
                { status: 429, headers: cors }
            );
        }

        // ─── Ephemeral widgets have no persisted messages to annotate ───
        if (widget.persistence_mode === "ephemeral") {
            return NextResponse.json(
                { error: "Feedback not available for ephemeral widgets" },
                { status: 409, headers: cors }
            );
        }

        // ─── Load session ───────────────────────────────────────────────
        const { data: session, error: sErr } = await supabase
            .from("widget_sessions")
            .select("id, messages")
            .eq("id", session_id)
            .eq("widget_id", widget.id)
            .single();

        if (sErr || !session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404, headers: cors }
            );
        }

        const messages: any[] = Array.isArray(session.messages) ? session.messages : [];

        // ─── Locate the assistant message being rated ───────────────────
        // Prefer matching the exact assistant turn by content prefix (the widget
        // sends the first ~200 chars); fall back to the most recent assistant
        // message so a rating is never silently dropped.
        const prefix = typeof message_content === "string" ? message_content.trim() : "";
        let targetIdx = -1;

        if (prefix) {
            for (let i = messages.length - 1; i >= 0; i--) {
                const m = messages[i];
                if (m?.role === "assistant" && typeof m.content === "string"
                    && m.content.trim().startsWith(prefix)) {
                    targetIdx = i;
                    break;
                }
            }
        }

        if (targetIdx === -1) {
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i]?.role === "assistant") {
                    targetIdx = i;
                    break;
                }
            }
        }

        if (targetIdx === -1) {
            return NextResponse.json(
                { error: "No assistant message to rate" },
                { status: 404, headers: cors }
            );
        }

        // ─── Annotate the message (no model call, no token deduction) ────
        messages[targetIdx] = {
            ...messages[targetIdx],
            feedback: { rating, ts: Date.now() },
        };

        const { error: updErr } = await supabase
            .from("widget_sessions")
            .update({ messages })
            .eq("id", session.id);

        if (updErr) {
            console.error("[embed/feedback] Update failed:", updErr.message);
            return NextResponse.json(
                { error: "Failed to record feedback" },
                { status: 500, headers: cors }
            );
        }

        return NextResponse.json({ ok: true }, { headers: cors });
    } catch (err: any) {
        console.error("[embed/feedback] Unexpected:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: corsHeaders(origin, []) }
        );
    }
}
