import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";

export const dynamic = "force-dynamic";

// ─── GET: Fetch deployments for a specific engine or all ─────────────────────
export async function GET(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const session = authResult.session!;

    const { searchParams } = new URL(request.url);
    const engineId = searchParams.get("engine_id");

    const supabase = createServiceRoleClient();

    try {
        let query = (supabase as any)
            .from("engine_deployments")
            .select("*")
            .order("deployed_at", { ascending: false });

        if (engineId) {
            query = query.eq("master_engine_id", engineId);
        }

        const { data: deployments, error } = await query;
        if (error) throw error;

        // Enrich with engine names
        const engineIds = [...new Set((deployments || []).map((d: any) => d.master_engine_id))];
        let enginesMap: Record<string, string> = {};
        if (engineIds.length > 0) {
            const { data: engines } = await (supabase as any)
                .from("master_engines")
                .select("id, name")
                .in("id", engineIds);
            enginesMap = Object.fromEntries((engines || []).map((e: any) => [e.id, e.name]));
        }

        // Enrich target names (plan names for plan targets, user emails for user targets)
        const planTargets = (deployments || []).filter((d: any) => d.target_type === "plan").map((d: any) => d.target_id);
        const userTargets = (deployments || []).filter((d: any) => d.target_type === "user").map((d: any) => d.target_id);

        let planNames: Record<string, string> = {};
        if (planTargets.length > 0) {
            const { data: plans } = await (supabase as any)
                .from("plans")
                .select("id, name")
                .in("id", planTargets);
            planNames = Object.fromEntries((plans || []).map((p: any) => [p.id, p.name]));
        }

        let userEmails: Record<string, string> = {};
        if (userTargets.length > 0) {
            for (const userId of userTargets) {
                try {
                    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
                    if (user) userEmails[userId] = user.email || userId;
                } catch {
                    userEmails[userId] = userId;
                }
            }
        }

        const enriched = (deployments || []).map((d: any) => ({
            ...d,
            engine_name: enginesMap[d.master_engine_id] || "Unknown",
            target_name: d.target_type === "plan"
                ? planNames[d.target_id] || d.target_id
                : userEmails[d.target_id] || d.target_id,
        }));

        return NextResponse.json({ deployments: enriched });
    } catch (err: any) {
        console.error("Deployments fetch error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── POST: Deploy an engine to a user or plan ───────────────────────────────
export async function POST(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const session = authResult.session!;

    const body = await request.json();
    const { engine_id, target_type, target_id } = body;

    if (!engine_id || !target_type || !target_id) {
        return NextResponse.json({ error: "engine_id, target_type, and target_id are required" }, { status: 400 });
    }

    if (!["plan", "user"].includes(target_type)) {
        return NextResponse.json({ error: "target_type must be 'plan' or 'user'" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Verify engine exists and is active
        const { data: engine, error: engineErr } = await (supabase as any)
            .from("master_engines")
            .select("id, name, status")
            .eq("id", engine_id)
            .single();

        if (engineErr || !engine) {
            return NextResponse.json({ error: "Engine not found" }, { status: 404 });
        }
        if (engine.status !== "active") {
            return NextResponse.json({ error: "Cannot deploy an inactive/archived engine" }, { status: 400 });
        }

        // Verify target exists
        if (target_type === "plan") {
            const { data: plan, error: planErr } = await (supabase as any)
                .from("plans")
                .select("id, name")
                .eq("id", target_id)
                .single();
            if (planErr || !plan) {
                return NextResponse.json({ error: `Plan '${target_id}' not found` }, { status: 404 });
            }
        } else {
            // Verify user exists
            try {
                const { data: { user } } = await supabase.auth.admin.getUserById(target_id);
                if (!user) throw new Error("User not found");
            } catch {
                return NextResponse.json({ error: `User '${target_id}' not found` }, { status: 404 });
            }
        }

        // Upsert deployment (one deployment per target_type+target_id)
        // If there's an existing deployment for this target, update it to the new engine
        const { data: existing } = await (supabase as any)
            .from("engine_deployments")
            .select("id")
            .eq("target_type", target_type)
            .eq("target_id", target_id)
            .maybeSingle();

        let deployment;
        if (existing) {
            // Update existing deployment to point to new engine
            const { data, error } = await (supabase as any)
                .from("engine_deployments")
                .update({
                    master_engine_id: engine_id,
                    status: "active",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existing.id)
                .select()
                .single();
            if (error) throw error;
            deployment = data;
        } else {
            // Create new deployment
            const { data, error } = await (supabase as any)
                .from("engine_deployments")
                .insert({
                    master_engine_id: engine_id,
                    target_type,
                    target_id,
                    status: "active",
                })
                .select()
                .single();
            if (error) throw error;
            deployment = data;
        }

        // Audit log
        await (supabase as any).from("admin_audit_logs").insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "deploy_engine",
            resource_type: "engine_deployment",
            resource_id: deployment.id,
            changes: { engine_id, engine_name: engine.name, target_type, target_id },
        });

        return NextResponse.json({ success: true, deployment });
    } catch (err: any) {
        console.error("Engine deploy error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── DELETE: Remove a deployment ─────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const session = authResult.session!;

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("id");

    if (!deploymentId) {
        return NextResponse.json({ error: "Deployment id is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { error } = await (supabase as any)
            .from("engine_deployments")
            .delete()
            .eq("id", deploymentId);

        if (error) throw error;

        // Audit log
        await (supabase as any).from("admin_audit_logs").insert({
            admin_id: session.adminId,
            admin_email: session.email,
            action: "undeploy_engine",
            resource_type: "engine_deployment",
            resource_id: deploymentId,
            changes: { removed: true },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Engine undeploy error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
