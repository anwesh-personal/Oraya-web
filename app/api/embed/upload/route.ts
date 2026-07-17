// ============================================================================
// Embed File Upload — Handles image/file uploads from widget chat
// POST /api/embed/upload — multipart form with file + widget key
// Returns public URL for the uploaded file
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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Widget-Key",
    };
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const cors = corsHeaders(origin);

    try {
        const apiKey = request.headers.get("x-widget-key");
        if (!apiKey?.startsWith("wgt_")) {
            return NextResponse.json({ error: "Invalid widget key" }, { status: 401, headers: cors });
        }

        // Verify widget exists
        const { data: widget } = await supabase
            .from("widget_deployments")
            .select("id, user_id")
            .eq("api_key", apiKey)
            .eq("is_active", true)
            .single();

        if (!widget) {
            return NextResponse.json({ error: "Widget not found" }, { status: 404, headers: cors });
        }

        // Parse multipart form
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400, headers: cors });
        }

        // Validate file
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400, headers: cors });
        }

        const allowedTypes = [
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "application/pdf", "text/plain", "text/csv",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "File type not allowed" }, { status: 400, headers: cors });
        }

        // Upload to Supabase storage
        const ext = file.name.split(".").pop() || "bin";
        const fileName = `widget-uploads/${widget.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadErr } = await supabase.storage
            .from("public-assets")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadErr) {
            console.error("[embed/upload] Storage error:", uploadErr);
            return NextResponse.json({ error: "Upload failed" }, { status: 500, headers: cors });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("public-assets")
            .getPublicUrl(fileName);

        return NextResponse.json({
            url: urlData.publicUrl,
            name: file.name,
            type: file.type,
            size: file.size,
        }, { headers: cors });

    } catch (err: any) {
        console.error("[embed/upload] Error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500, headers: cors });
    }
}
