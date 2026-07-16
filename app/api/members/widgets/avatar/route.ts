import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BUCKET = "widget-avatars";
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

// POST /api/members/widgets/avatar
// Body: FormData with field "file" (image) + "widgetId" (string)
export async function POST(request: NextRequest) {
    try {
        // Authenticate the member
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const widgetId = formData.get("widgetId") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        if (!widgetId) {
            return NextResponse.json({ error: "Widget ID is required" }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "File must be an image (PNG, JPG, WEBP, GIF, SVG)" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File too large. Max 2 MB." }, { status: 400 });
        }

        // Verify the widget belongs to this user
        const { data: widget, error: widgetError } = await (supabase as any)
            .from("widget_deployments")
            .select("id")
            .eq("id", widgetId)
            .eq("user_id", user.id)
            .single();

        if (widgetError || !widget) {
            return NextResponse.json({ error: "Widget not found" }, { status: 404 });
        }

        // Use service role for storage operations (members may not have storage policies)
        const serviceClient = createServiceRoleClient();

        // Ensure bucket exists (idempotent)
        try {
            await (serviceClient.storage as any).createBucket(BUCKET, {
                public: true,
                fileSizeLimit: MAX_SIZE,
                allowedMimeTypes: ALLOWED_TYPES,
            });
        } catch { /* bucket already exists — ignore */ }

        // Upload: path = userId/widgetId/avatar.ext
        const ext = file.name.split(".").pop() || "png";
        const path = `${user.id}/${widgetId}/avatar.${ext}`;
        const arrayBuffer = await file.arrayBuffer();

        const { error: uploadError } = await (serviceClient.storage as any)
            .from(BUCKET)
            .upload(path, arrayBuffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) throw new Error(uploadError.message);

        // Get public URL
        const { data: { publicUrl } } = (serviceClient.storage as any)
            .from(BUCKET)
            .getPublicUrl(path);

        // Cache-bust
        const avatarUrl = `${publicUrl}?t=${Date.now()}`;

        // Update widget's avatar_url + config.avatar_url
        const { error: updateError } = await (supabase as any)
            .from("widget_deployments")
            .update({
                avatar_url: avatarUrl,
                config: {
                    ...(widget.config || {}),
                    avatar_url: avatarUrl,
                },
            })
            .eq("id", widgetId)
            .eq("user_id", user.id);

        if (updateError) throw new Error(updateError.message);

        return NextResponse.json({ success: true, avatar_url: avatarUrl });
    } catch (err: any) {
        console.error("[widget-avatar] upload error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
