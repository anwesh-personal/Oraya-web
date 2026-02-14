import { Suspense } from "react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { StatsGrid } from "@/components/superadmin/dashboard/StatsGrid";
import { RecentActivity } from "@/components/superadmin/dashboard/RecentActivity";
import { SystemHealth } from "@/components/superadmin/dashboard/SystemHealth";
import { QuickActions } from "@/components/superadmin/dashboard/QuickActions";
import { UsageChart } from "@/components/superadmin/dashboard/UsageChart";

async function getStats() {
    const supabase = createServiceRoleClient();

    // Fetch stats in parallel
    const [
        { count: totalUsers },
        { count: activeUsers },
        { count: totalAgents },
        { count: totalLicenses },
        { data: recentLogs },
        { data: healthChecks },
    ] = await Promise.all([
        (supabase.from("user_licenses") as any).select("*", { count: "exact", head: true }),
        (supabase.from("user_licenses") as any).select("*", { count: "exact", head: true }).eq("status", "active"),
        (supabase.from("managed_ai_keys") as any).select("*", { count: "exact", head: true }),
        (supabase.from("user_licenses") as any).select("*", { count: "exact", head: true }),
        (supabase.from("admin_audit_logs") as any).select("*").order("created_at", { ascending: false }).limit(10),
        (supabase.from("system_health_checks") as any).select("*").order("checked_at", { ascending: false }).limit(5),
    ]);

    return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalAgents: totalAgents || 0,
        totalLicenses: totalLicenses || 0,
        recentLogs: recentLogs || [],
        healthChecks: healthChecks || [],
    };
}

export default async function OverviewPage() {
    const stats = await getStats();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Dashboard Overview</h1>
                    <p className="text-surface-600 mt-1">
                        Welcome back! Here's what's happening with your platform.
                    </p>
                </div>
                <QuickActions />
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} />

            {/* Charts and Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Usage Chart - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <UsageChart />
                </div>

                {/* System Health */}
                <div>
                    <SystemHealth healthChecks={stats.healthChecks} />
                </div>
            </div>

            {/* Recent Activity */}
            <RecentActivity logs={stats.recentLogs} />
        </div>
    );
}
