import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── GET: Fetch all plans (including inactive for admin view) ─────────────────
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: plans, error } = await (supabase
            .from("plans") as any)
            .select("*")
            .order("display_order", { ascending: true });

        if (error) {
            console.error("Plans fetch error:", error);
            return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
        }

        return NextResponse.json({ plans: plans || [] });
    } catch (err: any) {
        console.error("Plans API error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Create a new plan ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
        id,
        name,
        description,
        price_monthly,
        price_yearly,
        currency,
        max_agents,
        max_conversations_per_month,
        max_ai_calls_per_month,
        max_token_usage_per_month,
        max_devices,
        features,
        is_active,
        is_public,
        display_order,
        badge,
        requires_organization,
    } = body;

    if (!id || !name) {
        return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }

    // Validate ID format: lowercase alphanumeric + hyphens only
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(id)) {
        return NextResponse.json(
            { error: "Plan ID must be lowercase alphanumeric with optional hyphens" },
            { status: 400 }
        );
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: plan, error } = await (supabase
            .from("plans") as any)
            .insert({
                id,
                name,
                description: description || null,
                price_monthly: price_monthly ?? 0,
                price_yearly: price_yearly ?? 0,
                currency: currency || "USD",
                max_agents: max_agents ?? 1,
                max_conversations_per_month: max_conversations_per_month ?? 50,
                max_ai_calls_per_month: max_ai_calls_per_month ?? 1000,
                max_token_usage_per_month: max_token_usage_per_month ?? 100000,
                max_devices: max_devices ?? 1,
                features: features || [],
                is_active: is_active ?? true,
                is_public: is_public ?? true,
                display_order: display_order ?? 0,
                badge: badge || null,
                requires_organization: requires_organization ?? false,
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ error: `Plan with id "${id}" already exists` }, { status: 409 });
            }
            console.error("Plan create error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "create_plan",
            resource_type: "plan",
            resource_id: id,
            changes: { name, price_monthly, price_yearly, max_agents, max_devices, features },
        });

        return NextResponse.json({ success: true, plan });
    } catch (err: any) {
        console.error("Plan create error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PATCH: Update an existing plan ──────────────────────────────────────────
export async function PATCH(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan_id, updates } = body;

    if (!plan_id) {
        return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Only allow updating specific fields
        const allowedFields = [
            "name", "description", "price_monthly", "price_yearly", "currency",
            "max_agents", "max_conversations_per_month", "max_ai_calls_per_month",
            "max_token_usage_per_month", "max_devices", "features",
            "is_active", "is_public", "display_order", "badge", "requires_organization",
        ];

        const safeUpdates: Record<string, any> = {};
        for (const key of allowedFields) {
            if (key in updates) {
                safeUpdates[key] = updates[key];
            }
        }

        if (Object.keys(safeUpdates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        safeUpdates.updated_at = new Date().toISOString();

        const { data: plan, error } = await (supabase
            .from("plans") as any)
            .update(safeUpdates)
            .eq("id", plan_id)
            .select()
            .single();

        if (error) {
            console.error("Plan update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "update_plan",
            resource_type: "plan",
            resource_id: plan_id,
            changes: safeUpdates,
        });

        return NextResponse.json({ success: true, plan });
    } catch (err: any) {
        console.error("Plan update error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Delete a plan (only if no users are on it) ──────────────────────
export async function DELETE(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const planId = url.searchParams.get("plan_id");

    if (!planId) {
        return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Check if any users are on this plan
        const { count } = await (supabase
            .from("user_licenses") as any)
            .select("id", { count: "exact", head: true })
            .eq("plan_id", planId)
            .eq("status", "active");

        if (count && count > 0) {
            return NextResponse.json(
                { error: `Cannot delete plan: ${count} active license(s) are using it. Deactivate the plan instead.` },
                { status: 409 }
            );
        }

        const { error } = await (supabase
            .from("plans") as any)
            .delete()
            .eq("id", planId);

        if (error) {
            console.error("Plan delete error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        await (supabase.from("admin_audit_logs") as any).insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "delete_plan",
            resource_type: "plan",
            resource_id: planId,
            changes: { deleted: true },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Plan delete error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
