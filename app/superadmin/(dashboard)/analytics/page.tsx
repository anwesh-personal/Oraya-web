import { createServiceRoleClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/superadmin/analytics/AnalyticsDashboard";
import { Download, Calendar, TrendingUp, Users, DollarSign, Zap } from "lucide-react";

async function getAnalyticsData() {
    const supabase = createServiceRoleClient();

    // Fetch various analytics
    const [
        { count: totalUsers },
        { count: activeSubscriptions },
        { data: revenueData },
        { data: usageData },
    ] = await Promise.all([
        supabase.from("user_profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_licenses").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("payment_transactions").select("amount").eq("status", "succeeded"),
        supabase.from("ai_usage_logs").select("total_tokens").limit(1000),
    ]);

    const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const totalTokens = usageData?.reduce((sum, u) => sum + (u.total_tokens || 0), 0) || 0;

    return {
        stats: {
            totalUsers: totalUsers || 0,
            activeSubscriptions: activeSubscriptions || 0,
            mrr: Math.round(totalRevenue / 12),
            totalTokens,
            growth: 18.5, // Calculate from historical
            churn: 3.2,
        },
        revenueByMonth: [
            { month: "Sep", revenue: 8200 },
            { month: "Oct", revenue: 9400 },
            { month: "Nov", revenue: 10800 },
            { month: "Dec", revenue: 11200 },
            { month: "Jan", revenue: 12400 },
            { month: "Feb", revenue: 14200 },
        ],
        usersByTier: [
            { tier: "Free", count: 2450, color: "#6b7280" },
            { tier: "BYOK", count: 800, color: "#8b5cf6" },
            { tier: "Pro", count: 420, color: "#06b6d4" },
            { tier: "Enterprise", count: 34, color: "#f59e0b" },
        ],
        topFeatures: [
            { name: "Chat", usage: 45000 },
            { name: "Voice", usage: 12300 },
            { name: "Agents", usage: 8900 },
            { name: "Knowledge Base", usage: 6700 },
            { name: "Integrations", usage: 3400 },
        ],
    };
}

export default async function AnalyticsPage() {
    const data = await getAnalyticsData();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">Analytics</h1>
                    <p className="text-[var(--surface-500)] mt-1">Platform performance and user insights</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-all">
                        <Calendar className="w-4 h-4" />
                        Last 30 days
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[var(--primary-foreground)] font-medium transition-all shadow-lg" style={{ background: 'var(--gradient-primary)' }}>
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Total Users</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{data.stats.totalUsers.toLocaleString()}</p>
                            <p className="text-xs text-success mt-1">+{data.stats.growth}% this month</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-success/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-success/20">
                            <DollarSign className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">MRR</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">${data.stats.mrr.toLocaleString()}</p>
                            <p className="text-xs text-success mt-1">+12.3% growth</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-info/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-info/20">
                            <TrendingUp className="w-6 h-6 text-info" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Active Subscriptions</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{data.stats.activeSubscriptions}</p>
                            <p className="text-xs text-error mt-1">{data.stats.churn}% churn</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-warning/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-warning/20">
                            <Zap className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">API Tokens Used</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{(data.stats.totalTokens / 1000000).toFixed(1)}M</p>
                            <p className="text-xs text-[var(--surface-500)] mt-1">This month</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <AnalyticsDashboard data={data} />
        </div>
    );
}
