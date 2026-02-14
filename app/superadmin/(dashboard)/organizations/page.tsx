import { createServiceRoleClient } from "@/lib/supabase/server";
import { OrganizationsTable } from "@/components/superadmin/organizations/OrganizationsTable";
import { Plus, Download, Building2, Users, DollarSign, TrendingUp } from "lucide-react";

async function getOrganizations() {
    const supabase = createServiceRoleClient();

    const { data: organizations, error } = await (supabase
        .from("organizations") as any)
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
        (supabase.from("organizations") as any).select("*", { count: "exact", head: true }),
        (supabase.from("organizations") as any).select("*", { count: "exact", head: true }).eq("status", "active"),
        (supabase.from("user_licenses") as any).select("amount_paid").eq("status", "active"),
    ]);

    const totalRevenue = revenueData?.reduce((sum: number, l: any) => sum + (l.amount_paid || 0), 0) || 0;

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
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">Organizations</h1>
                    <p className="text-[var(--surface-500)] mt-1">Manage customer organizations and their members</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-all">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[var(--primary-foreground)] font-medium transition-all shadow-lg" style={{ background: 'var(--gradient-primary)' }}>
                        <Plus className="w-4 h-4" />
                        Add Organization
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/20">
                            <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Total Organizations</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-success/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-success/20">
                            <Users className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Active</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">{stats.active}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-warning/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-warning/20">
                            <DollarSign className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Total Revenue</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">${stats.revenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-info/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-info/20">
                            <TrendingUp className="w-6 h-6 text-info" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Growth</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">+{stats.growth}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <OrganizationsTable organizations={organizations} />
        </div>
    );
}
