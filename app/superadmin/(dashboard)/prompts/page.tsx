import { createServiceRoleClient } from "@/lib/supabase/server";
import { PromptsManager } from "@/components/superadmin/prompts/PromptsManager";
import { Terminal, Shield, Lock, Layers } from "lucide-react";

// ─── Server-side: fetch prompt sections + assignments ─────────────────────────
async function getPromptData() {
    const supabase = createServiceRoleClient();

    const [sectionsResult, assignmentsResult] = await Promise.all([
        supabase.from("headless_prompt_sections")
            .select("*")
            .order("category", { ascending: true })
            .order("name", { ascending: true }),
        supabase.from("headless_agent_prompt_assignments")
            .select("*, section:headless_prompt_sections(*)")
            .order("priority", { ascending: true }),
    ]);

    const sections = sectionsResult.data || [];
    const assignments = assignmentsResult.data || [];

    // Stats
    const agents = [...new Set(assignments.map((a: any) => a.agent_key))];
    const categories = [...new Set(sections.map((s: any) => s.category))];

    return {
        sections,
        assignments,
        stats: {
            totalSections: sections.length,
            activeSections: sections.filter((s: any) => s.is_active).length,
            systemSections: sections.filter((s: any) => s.is_system).length,
            headlessAgents: agents.length,
            categories: categories.length,
        },
    };
}

const catStyles: Record<string, { bg: string; border: string; text: string; icon: typeof Terminal }> = {
    identity: { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", text: "rgb(139,92,246)", icon: Terminal },
    security: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", text: "rgb(239,68,68)", icon: Shield },
    routing: { bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.2)", text: "rgb(6,182,212)", icon: Layers },
    behavior: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", text: "rgb(245,158,11)", icon: Lock },
    general: { bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)", text: "rgb(107,114,128)", icon: Terminal },
};

export default async function PromptsPage() {
    const data = await getPromptData();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">Headless Agent Prompts</h1>
                    <p className="text-[var(--surface-500)] mt-1">
                        Manage system prompts for headless agents — edit, reorder, and deploy directives
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard label="Prompt Sections" value={data.stats.totalSections} gradient="from-violet-500/10 to-purple-500/5" borderColor="border-violet-500/20" iconBg="bg-violet-500/20" iconColor="text-violet-500" />
                <StatCard label="Active" value={data.stats.activeSections} gradient="from-emerald-500/10 to-green-500/5" borderColor="border-emerald-500/20" iconBg="bg-emerald-500/20" iconColor="text-emerald-500" />
                <StatCard label="System (Locked)" value={data.stats.systemSections} gradient="from-red-500/10 to-rose-500/5" borderColor="border-red-500/20" iconBg="bg-red-500/20" iconColor="text-red-500" />
                <StatCard label="Headless Agents" value={data.stats.headlessAgents} gradient="from-cyan-500/10 to-blue-500/5" borderColor="border-cyan-500/20" iconBg="bg-cyan-500/20" iconColor="text-cyan-500" />
                <StatCard label="Categories" value={data.stats.categories} gradient="from-amber-500/10 to-orange-500/5" borderColor="border-amber-500/20" iconBg="bg-amber-500/20" iconColor="text-amber-500" />
            </div>

            {/* Prompts Manager (client component) */}
            <PromptsManager
                initialSections={data.sections}
                initialAssignments={data.assignments}
            />
        </div>
    );
}

function StatCard({
    label, value, gradient, borderColor, iconBg, iconColor,
}: {
    label: string; value: number; gradient: string; borderColor: string; iconBg: string; iconColor: string;
}) {
    return (
        <div className={`p-5 rounded-2xl bg-gradient-to-br ${gradient} border ${borderColor}`}>
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
                    <Terminal className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm text-[var(--surface-500)]">{label}</p>
                    <p className="text-2xl font-bold text-[var(--surface-900)]">{value}</p>
                </div>
            </div>
        </div>
    );
}
