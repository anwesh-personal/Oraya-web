import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── POST: Publish factory update (bump factory_version) ─────────────────────
// This is the "ship it" button. It:
//   1. Increments factory_version on the template
//   2. Sets factory_published_at to NOW()
//   3. Returns the new version + summary of what's in it
//
// After publishing, all connected Oraya desktops will pick up the update
// on their next factory patch check.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: templateId } = await params;
    const supabase = createServiceRoleClient();

    try {
        // 1. Get current factory_version
        const { data: template, error: fetchError } = await (supabase
            .from("agent_templates") as any)
            .select("id, name, factory_version")
            .eq("id", templateId)
            .single();

        if (fetchError || !template) {
            console.error("Template not found:", fetchError);
            return NextResponse.json(
                { error: "Template not found" },
                { status: 404 }
            );
        }

        const currentVersion = template.factory_version ?? 0;
        const newVersion = currentVersion + 1;

        // 2. Count active memories (what this version ships with)
        const { count: activeCount } = await (supabase
            .from("agent_template_memories") as any)
            .select("id", { count: "exact", head: true })
            .eq("template_id", templateId)
            .eq("is_active", true)
            .is("version_removed", null);

        // 3. Count changes since last publish
        // New memories: version_added would be set to newVersion during creation
        // But since version_added is set at creation time, we count memories
        // added since last publish timestamp
        const { data: lastPublished } = await (supabase
            .from("agent_templates") as any)
            .select("factory_published_at")
            .eq("id", templateId)
            .single();

        const lastPublishedAt = lastPublished?.factory_published_at;

        let addedSinceLastPublish = 0;
        let removedSinceLastPublish = 0;
        let modifiedSinceLastPublish = 0;

        if (lastPublishedAt) {
            // Count memories added since last publish
            const { count: added } = await (supabase
                .from("agent_template_memories") as any)
                .select("id", { count: "exact", head: true })
                .eq("template_id", templateId)
                .eq("is_active", true)
                .is("version_removed", null)
                .gt("created_at", lastPublishedAt);
            addedSinceLastPublish = added ?? 0;

            // Count memories removed since last publish
            const { count: removed } = await (supabase
                .from("agent_template_memories") as any)
                .select("id", { count: "exact", head: true })
                .eq("template_id", templateId)
                .eq("is_active", false)
                .not("version_removed", "is", null)
                .gt("updated_at", lastPublishedAt);
            removedSinceLastPublish = removed ?? 0;

            // Count memories modified since last publish (active, existed before, updated after)
            const { count: modified } = await (supabase
                .from("agent_template_memories") as any)
                .select("id", { count: "exact", head: true })
                .eq("template_id", templateId)
                .eq("is_active", true)
                .is("version_removed", null)
                .lt("created_at", lastPublishedAt)
                .gt("updated_at", lastPublishedAt);
            modifiedSinceLastPublish = modified ?? 0;
        } else {
            // First publish: everything is "new"
            addedSinceLastPublish = activeCount ?? 0;
        }

        // 4. Bump factory_version and set published timestamp
        const { data: updatedTemplate, error: updateError } = await (supabase
            .from("agent_templates") as any)
            .update({
                factory_version: newVersion,
                factory_published_at: new Date().toISOString(),
            })
            .eq("id", templateId)
            .select("id, name, factory_version, factory_published_at")
            .single();

        if (updateError) {
            console.error("Publish factory update error:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // 5. Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "publish_factory_update",
            resource_type: "agent_template",
            resource_id: templateId,
            changes: {
                from_version: currentVersion,
                to_version: newVersion,
                total_active_memories: activeCount ?? 0,
                added: addedSinceLastPublish,
                modified: modifiedSinceLastPublish,
                removed: removedSinceLastPublish,
            },
        });

        return NextResponse.json({
            success: true,
            template: updatedTemplate,
            summary: {
                from_version: currentVersion,
                to_version: newVersion,
                total_active_memories: activeCount ?? 0,
                changes_since_last_publish: {
                    added: addedSinceLastPublish,
                    modified: modifiedSinceLastPublish,
                    removed: removedSinceLastPublish,
                },
            },
        });
    } catch (err: any) {
        console.error("Publish factory update error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
