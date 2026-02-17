import { NextResponse } from "next/server";
import { authenticateBridge, hasScope, scopeError } from "@/lib/bridge/auth";
import { PlanEnforcer } from "@/lib/plan-enforcer";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// Bridge Research API
// Desktop ↔ Cloud sync for 24/7 Research jobs.
//
// GET  /api/v1/research          → List research jobs + results
// POST /api/v1/research          → Create/update research job from desktop
// GET  /api/v1/research?since=   → Get results since timestamp (sync)
// ─────────────────────────────────────────────────────────────

// ── GET: List jobs or sync results ──
export async function GET(request: Request) {
    try {
        const { auth, error } = await authenticateBridge(request);
        if (error) return error;

        if (!hasScope(auth, "read")) return scopeError("read");

        const { searchParams } = new URL(request.url);
        const since = searchParams.get("since");
        const jobId = searchParams.get("job_id");
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        // If job_id specified, return that job's details + findings
        if (jobId) {
            const { data: job, error: jobError } = await (auth.supabase
                .from("research_jobs") as any)
                .select("*")
                .eq("id", jobId)
                .eq("user_id", auth.user_id)
                .single();

            if (jobError || !job) {
                return NextResponse.json(
                    { error: "Research job not found" },
                    { status: 404 }
                );
            }

            // Get findings
            let findingsQuery = (auth.supabase
                .from("research_findings") as any)
                .select("*")
                .eq("job_id", jobId)
                .order("discovered_at", { ascending: false })
                .limit(limit);

            if (since) {
                findingsQuery = findingsQuery.gt("discovered_at", since);
            }

            const { data: findings } = await findingsQuery;

            // Get actual total count (not capped by limit)
            let totalCount = findings?.length || 0;
            const { count } = await (auth.supabase
                .from("research_findings") as any)
                .select("id", { count: "exact", head: true })
                .eq("job_id", jobId);
            if (count !== null) totalCount = count;

            return NextResponse.json({
                job,
                findings: findings || [],
                total_findings: totalCount,
                server_time: new Date().toISOString(),
            });
        }

        // List all jobs
        let jobsQuery = (auth.supabase
            .from("research_jobs") as any)
            .select("*")
            .eq("user_id", auth.user_id)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (status) {
            jobsQuery = jobsQuery.eq("status", status);
        }

        const { data: jobs } = await jobsQuery;

        // If syncing (since parameter), also get new findings across all jobs
        let newFindings: unknown[] = [];
        if (since && jobs && jobs.length > 0) {
            const jobIds = jobs.map((j: Record<string, unknown>) => j.id);
            const { data: findings } = await (auth.supabase
                .from("research_findings") as any)
                .select("*")
                .in("job_id", jobIds)
                .gt("discovered_at", since)
                .order("discovered_at", { ascending: false })
                .limit(200);

            newFindings = findings || [];
        }

        return NextResponse.json({
            jobs: jobs || [],
            total_jobs: jobs?.length || 0,
            ...(since ? { new_findings: newFindings, findings_since: since } : {}),
            server_time: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Research list error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ── POST: Create or sync a research job from desktop ──
export async function POST(request: Request) {
    try {
        const { auth, error } = await authenticateBridge(request);
        if (error) return error;

        if (!hasScope(auth, "write")) return scopeError("write");

        const body = await request.json();
        const { action } = body;

        switch (action) {
            case "create": {
                const { name, query, schedule, sources, config } = body;

                if (!name || !query) {
                    return NextResponse.json(
                        { error: "name and query are required" },
                        { status: 400 }
                    );
                }

                // Feature gate: research requires managed_ai
                const access = await PlanEnforcer.enforceAccess(
                    auth.supabase,
                    auth.user_id,
                    "managed_ai"
                );
                if (!access.allowed) {
                    return NextResponse.json(
                        { error: access.reason, code: "PLAN_FEATURE_REQUIRED" },
                        { status: 403 }
                    );
                }

                const { data: job, error: createError } = await (auth.supabase
                    .from("research_jobs") as any)
                    .insert({
                        user_id: auth.user_id,
                        name,
                        query,
                        schedule: schedule || "daily",
                        sources: sources || ["web"],
                        config: config || {},
                        status: "running",
                        device_id: auth.device_id,
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error("Research job creation error:", createError);
                    return NextResponse.json(
                        { error: "Failed to create research job" },
                        { status: 500 }
                    );
                }

                return NextResponse.json({ job, created: true }, { status: 201 });
            }

            case "pause": {
                const { job_id } = body;
                if (!job_id) {
                    return NextResponse.json({ error: "job_id required" }, { status: 400 });
                }

                await (auth.supabase
                    .from("research_jobs") as any)
                    .update({ status: "paused" })
                    .eq("id", job_id)
                    .eq("user_id", auth.user_id);

                return NextResponse.json({ success: true, status: "paused" });
            }

            case "resume": {
                const { job_id } = body;
                if (!job_id) {
                    return NextResponse.json({ error: "job_id required" }, { status: 400 });
                }

                await (auth.supabase
                    .from("research_jobs") as any)
                    .update({ status: "running" })
                    .eq("id", job_id)
                    .eq("user_id", auth.user_id);

                return NextResponse.json({ success: true, status: "running" });
            }

            case "delete": {
                const { job_id } = body;
                if (!job_id) {
                    return NextResponse.json({ error: "job_id required" }, { status: 400 });
                }

                await (auth.supabase
                    .from("research_jobs") as any)
                    .delete()
                    .eq("id", job_id)
                    .eq("user_id", auth.user_id);

                return NextResponse.json({ success: true, deleted: true });
            }

            case "submit_finding": {
                // Desktop app can push findings discovered locally to the cloud
                const { job_id, title, summary, source_url, relevance_score, raw_data } = body;

                if (!job_id || !title) {
                    return NextResponse.json(
                        { error: "job_id and title are required" },
                        { status: 400 }
                    );
                }

                const { data: finding, error: findingError } = await (auth.supabase
                    .from("research_findings") as any)
                    .insert({
                        job_id,
                        title,
                        summary: summary || "",
                        source_url: source_url || null,
                        relevance_score: relevance_score || 0.5,
                        raw_data: raw_data || {},
                        discovered_at: new Date().toISOString(),
                        device_id: auth.device_id,
                    })
                    .select()
                    .single();

                if (findingError) {
                    console.error("Finding submission error:", findingError);
                    return NextResponse.json(
                        { error: "Failed to submit finding" },
                        { status: 500 }
                    );
                }

                return NextResponse.json({ finding, submitted: true }, { status: 201 });
            }

            default:
                return NextResponse.json(
                    {
                        error: "Unknown action",
                        valid_actions: ["create", "pause", "resume", "delete", "submit_finding"],
                    },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("Research action error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
