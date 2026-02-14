import { createServiceRoleClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
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
                    <h1 className="text-3xl font-bold text-white">Analytics</h1>
                    <p className="text-gray-400 mt-1">Platform performance and user insights</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all">
                        <Calendar className="w-4 h-4" />
                        Last 30 days
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-violet-500/20">
                            <Users className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Users</p>
                            <p className="text-2xl font-bold text-white">{data.stats.totalUsers.toLocaleString()}</p>
                            <p className="text-xs text-emerald-400 mt-1">+{data.stats.growth}% this month</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                            <DollarSign className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">MRR</p>
                            <p className="text-2xl font-bold text-white">${data.stats.mrr.toLocaleString()}</p>
                            <p className="text-xs text-emerald-400 mt-1">+12.3% growth</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-cyan-500/20">
                            <TrendingUp className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Active Subscriptions</p>
                            <p className="text-2xl font-bold text-white">{data.stats.activeSubscriptions}</p>
                            <p className="text-xs text-red-400 mt-1">{data.stats.churn}% churn</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <Zap className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">API Tokens Used</p>
                            <p className="text-2xl font-bold text-white">{(data.stats.totalTokens / 1000000).toFixed(1)}M</p>
                            <p className="text-xs text-gray-400 mt-1">This month</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <AnalyticsDashboard data={data} />
        </div>
    );
}
