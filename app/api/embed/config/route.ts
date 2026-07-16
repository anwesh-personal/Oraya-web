// ============================================================================
// Embed Config API — Returns widget configuration for the JS bundle
// Public endpoint — keyed by widget API key
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
        const apiKey = searchParams.get("key") || request.headers.get("x-widget-key");

        if (!apiKey || !apiKey.startsWith("wgt_")) {
            return NextResponse.json(
                { error: "Missing or invalid widget key" },
                { status: 401, headers: cors }
            );
        }

        const { data: widget, error } = await supabase
            .from("widget_deployments")
            .select(`
                name, welcome_message, placeholder, avatar_url,
                widget_type, position, primary_color, accent_color,
                bg_color, text_color, font_family, border_radius,
                bubble_size, chat_width, chat_height, dark_mode,
                show_branding, custom_css, persistence_mode,
                auto_open, auto_open_delay, sound_enabled,
                gate_config, is_active, config,
                agent_templates:template_id (
                    name, emoji, icon_url, tagline
                )
            `)
            .eq("api_key", apiKey)
            .eq("is_active", true)
            .single();

        if (error || !widget) {
            return NextResponse.json(
                { error: "Widget not found or inactive" },
                { status: 404, headers: cors }
            );
        }

        const agent = (widget as any).agent_templates;

        // Parse config JSONB for extra fields
        const widgetConfig = (widget as any).config || {};

        return NextResponse.json(
            {
                config: {
                    name: widget.name,
                    agentName: agent?.name || widget.name,
                    agentEmoji: agent?.emoji || "🤖",
                    agentIcon: agent?.icon_url || null,
                    agentTagline: agent?.tagline || null,
                    welcomeMessage: widget.welcome_message,
                    placeholder: widget.placeholder,
                    avatarUrl: widget.avatar_url,
                    widgetType: widget.widget_type,
                    position: widget.position,
                    primaryColor: widget.primary_color,
                    accentColor: widget.accent_color,
                    bgColor: widget.bg_color,
                    textColor: widget.text_color,
                    fontFamily: widget.font_family,
                    borderRadius: widget.border_radius,
                    bubbleSize: widget.bubble_size,
                    chatWidth: widget.chat_width,
                    chatHeight: widget.chat_height,
                    darkMode: widget.dark_mode,
                    showBranding: widget.show_branding,
                    customCss: widget.custom_css,
                    persistenceMode: widget.persistence_mode,
                    autoOpen: widget.auto_open,
                    autoOpenDelay: widget.auto_open_delay,
                    soundEnabled: widget.sound_enabled,
                    gateConfig: widget.persistence_mode === "gated"
                        ? widget.gate_config
                        : null,
                    // Extended config from JSONB
                    companyLogo: widgetConfig.company_logo_url || null,
                    windowStyle: widgetConfig.window_style || "solid",
                },
            },
            { headers: cors }
        );
    } catch (err: any) {
        console.error("[embed/config] Unexpected:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: cors }
        );
    }
}
