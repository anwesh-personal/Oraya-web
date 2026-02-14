import { createServiceRoleClient } from "@/lib/supabase/server";
import { OrganizationsTable } from "@/components/organizations/OrganizationsTable";
import { Plus, Download, Building2, Users, DollarSign, TrendingUp } from "lucide-react";

async function getOrganizations() {
    const supabase = createServiceRoleClient();

    const { data: organizations, error } = await supabase
        .from("organizations")
        .select(`
      *,
      owner:user_profiles!owner_id(id, full_name, email, avatar_url),
      _count:user_licenses(count)
    `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching organizations:", error);
        return [];
    }

    return organizations || [];
}

async function getOrgStats() {
    const supabase = createServiceRoleClient();

    const [
        { count: totalOrgs },
        { count: activeOrgs },
        { data: revenueData },
    ] = await Promise.all([
        supabase.from("organizations").select("*", { count: "exact", head: true }),
        supabase.from("organizations").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("user_licenses").select("amount_paid").eq("status", "active"),
    ]);

    const totalRevenue = revenueData?.reduce((sum, l) => sum + (l.amount_paid || 0), 0) || 0;

    return {
        total: totalOrgs || 0,
        active: activeOrgs || 0,
        revenue: totalRevenue,
        growth: 12.5, // Calculate from historical data
    };
}

export default async function OrganizationsPage() {
    const [organizations, stats] = await Promise.all([
        getOrganizations(),
        getOrgStats(),
    ]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Organizations</h1>
                    <p className="text-gray-400 mt-1">Manage customer organizations and their members</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
                        <Plus className="w-4 h-4" />
                        Add Organization
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-violet-500/20">
                            <Building2 className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Organizations</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                            <Users className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Active</p>
                            <p className="text-2xl font-bold text-white">{stats.active}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <DollarSign className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold text-white">${stats.revenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-cyan-500/20">
                            <TrendingUp className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Growth</p>
                            <p className="text-2xl font-bold text-white">+{stats.growth}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <OrganizationsTable organizations={organizations} />
        </div>
    );
}
