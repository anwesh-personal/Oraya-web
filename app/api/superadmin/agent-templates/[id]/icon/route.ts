import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/superadmin/agent-templates/[id]/icon
// Body: FormData with field "file" (image)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: templateId } = await params;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "File must be an image (PNG, JPG, WEBP, GIF, SVG)" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large. Max 2MB." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Ensure bucket exists (creates it if missing — idempotent)
        try {
            await (supabase.storage as any).createBucket("agent-icons", {
                public: true,
                fileSizeLimit: 2097152,
                allowedMimeTypes: allowedTypes,
            });
        } catch { /* already exists — ignore */ }

        const ext = file.name.split(".").pop() || "png";
        const path = `${templateId}/icon.${ext}`;

        const arrayBuffer = await file.arrayBuffer();

        const { error: uploadError } = await (supabase.storage as any)
            .from("agent-icons")
            .upload(path, arrayBuffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) throw new Error(uploadError.message);

        const { data: { publicUrl } } = (supabase.storage as any)
            .from("agent-icons")
            .getPublicUrl(path);

        // Bust cache — append a timestamp so the browser re-fetches
        const iconUrl = `${publicUrl}?t=${Date.now()}`;

        // Save icon_url to agent_templates
        const { error: updateError } = await (supabase.from("agent_templates") as any)
            .update({ icon_url: iconUrl })
            .eq("id", templateId);

        if (updateError) throw new Error(updateError.message);

        // Audit log (non-fatal — don't let a log failure break the upload response)
        try {
            await (supabase.from("admin_audit_logs") as any).insert({
                admin_id: session.adminId,
                admin_email: session.email,
                action: "upload_agent_icon",
                resource_type: "agent_template",
                resource_id: templateId,
                changes: { icon_url: iconUrl },
            });
        } catch { /* non-fatal */ }

        return NextResponse.json({ success: true, icon_url: iconUrl });
    } catch (err: any) {
        console.error("[agent-icon] upload error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
