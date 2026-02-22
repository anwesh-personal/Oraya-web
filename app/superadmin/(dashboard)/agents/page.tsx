import { createServiceRoleClient } from "@/lib/supabase/server";
import { AgentsGrid } from "@/components/superadmin/agents/AgentsGrid";
import { Download, Bot, Zap, Shield, Crown } from "lucide-react";

// ─── Server-side: fetch real stats from Supabase ─────────────────────────────
async function getAgentStats() {
    const supabase = createServiceRoleClient();

    const { data: templates, error } = await (supabase
        .from("agent_templates") as any)
        .select("id, plan_tier, is_active, install_count, category");

    if (error || !templates) {
        return { total: 0, active: 0, free: 0, pro: 0, installs: 0, categories: [] as { category: string; count: number }[] };
    }

    const total = templates.length;
    const active = templates.filter((t: any) => t.is_active).length;
    const free = templates.filter((t: any) => t.plan_tier === "free").length;
    const pro = templates.filter((t: any) => t.plan_tier !== "free").length;
    const installs = templates.reduce((sum: number, t: any) => sum + (t.install_count || 0), 0);

    // Category distribution
    const catMap = new Map<string, number>();
    for (const t of templates) {
        const cat = t.category || "uncategorized";
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
    }
    const categories = [...catMap.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

    return { total, active, free, pro, installs, categories };
}

const catStyles: Record<string, { bg: string; border: string; text: string }> = {
    engineering: { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", text: "rgb(139,92,246)" },
    security: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", text: "rgb(239,68,68)" },
    creative: { bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.2)", text: "rgb(236,72,153)" },
    reasoning: { bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.2)", text: "rgb(6,182,212)" },
    strategy: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", text: "rgb(59,130,246)" },
    research: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", text: "rgb(16,185,129)" },
    "data-science": { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", text: "rgb(245,158,11)" },
    devops: { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)", text: "rgb(249,115,22)" },
    communications: { bg: "rgba(20,184,166,0.1)", border: "rgba(20,184,166,0.2)", text: "rgb(20,184,166)" },
    uncategorized: { bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)", text: "rgb(107,114,128)" },
};

export default async function AgentsPage() {
    const stats = await getAgentStats();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">Agents</h1>
                    <p className="text-[var(--surface-500)] mt-1">
                        Manage agent templates available in the desktop gallery
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-all text-sm font-medium">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    label="Total Templates"
                    value={stats.total}
                    icon={<Bot className="w-5 h-5" />}
                    gradient="from-[var(--primary)]/10 to-[var(--primary)]/5"
                    borderColor="border-[var(--primary)]/20"
                    iconBg="bg-[var(--primary)]/20"
                    iconColor="text-[var(--primary)]"
                />
                <StatCard
                    label="Active"
                    value={stats.active}
                    icon={<Zap className="w-5 h-5" />}
                    gradient="from-emerald-500/10 to-green-500/5"
                    borderColor="border-emerald-500/20"
                    iconBg="bg-emerald-500/20"
                    iconColor="text-emerald-500"
                />
                <StatCard
                    label="Free Tier"
                    value={stats.free}
                    icon={<Shield className="w-5 h-5" />}
                    gradient="from-cyan-500/10 to-blue-500/5"
                    borderColor="border-cyan-500/20"
                    iconBg="bg-cyan-500/20"
                    iconColor="text-cyan-500"
                />
                <StatCard
                    label="Pro Tier"
                    value={stats.pro}
                    icon={<Crown className="w-5 h-5" />}
                    gradient="from-amber-500/10 to-orange-500/5"
                    borderColor="border-amber-500/20"
                    iconBg="bg-amber-500/20"
                    iconColor="text-amber-500"
                />
            </div>

            {/* Category Distribution */}
            {stats.categories.length > 0 && (
                <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <h2 className="text-lg font-semibold text-[var(--surface-900)] mb-4">Category Distribution</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {stats.categories.map(({ category, count }) => {
                            const cs = catStyles[category] || catStyles.uncategorized;
                            return (
                                <div
                                    key={category}
                                    className="p-3 rounded-xl"
                                    style={{ background: cs.bg, border: `1px solid ${cs.border}` }}
                                >
                                    <p className="text-xs capitalize" style={{ color: cs.text }}>{category}</p>
                                    <p className="text-xl font-bold text-[var(--surface-900)] mt-0.5">{count}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Agents Grid (client component — fetches from API) */}
            <AgentsGrid />
        </div>
    );
}


// ─── Sub-component ───────────────────────────────────────────────────────────
function StatCard({
    label, value, icon, gradient, borderColor, iconBg, iconColor,
}: {
    label: string; value: number; icon: React.ReactNode;
    gradient: string; borderColor: string; iconBg: string; iconColor: string;
}) {
    return (
        <div className={`p-5 rounded-2xl bg-gradient-to-br ${gradient} border ${borderColor}`}>
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-[var(--surface-500)]">{label}</p>
                    <p className="text-2xl font-bold text-[var(--surface-900)]">{value}</p>
                </div>
            </div>
        </div>
    );
}
