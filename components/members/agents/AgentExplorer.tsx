"use client";

import { useState } from "react";
import {
    Fingerprint,
    Sparkles,
    Crown,
    Settings,
    Activity,
    Network,
    Bot,
    Download,
    Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Extended types (mirrors RPC output mapped in page.tsx)
// ─────────────────────────────────────────────────────────────

export interface AgentPersonality {
    personality?: string;
    style?: string;
    tone?: string;
    capabilities?: string[];
    role?: string;
    mode?: string;
}

export interface AgentTemplateExtended {
    id: string;
    name: string;
    emoji: string | null;
    icon_url: string | null;
    tagline: string | null;
    description: string | null;
    category: string | null;
    plan_tier: string;
    version: string | null;
    tags: string[];
    personality_config: AgentPersonality | null;
    factory_version: number | null;
    factory_published_at: string | null;
}

export interface AssignedAgentExtended {
    id: string;
    template_id: string;
    assignment_type: "push" | "entitled";
    assigned_at: string;
    config_overrides: Record<string, unknown> | null;
    template: AgentTemplateExtended;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * planRankMap — maps plan ID → display_order (rank).
 * Passed from the parent page as a prop, derived from the live plans table.
 * Falls back to 0 for unknown plans (safest fallback).
 */
export type PlanRankMap = Record<string, number>;

function tierColor(tier: string, rankMap: PlanRankMap): string {
    const rank = rankMap[tier] ?? 0;
    // Colour bands based on rank value — works for any plan hierarchy.
    // Admin adjusts display_order in Superadmin; colours shift automatically.
    if (rank <= 0) return "var(--surface-400)";
    if (rank === 1) return "var(--success)";
    if (rank === 2) return "var(--info)";
    if (rank === 3) return "var(--primary)";
    return "var(--warning)"; // rank 4+ (enterprise and above)
}

function tierClearance(tier: string, rankMap: PlanRankMap): string {
    const rank = rankMap[tier] ?? 0;
    if (rank <= 0) return "L0";
    return `L${rank}`;
}

function agentMode(agent: AssignedAgentExtended): string {
    if (agent.template.personality_config?.mode) return agent.template.personality_config.mode.toUpperCase();
    if (agent.template.category) return agent.template.category.toUpperCase();
    return "EXECUTE";
}

function agentCapabilities(agent: AssignedAgentExtended): string[] {
    if (agent.template.personality_config?.capabilities?.length) {
        return agent.template.personality_config.capabilities.slice(0, 6);
    }
    return (agent.template.tags ?? []).slice(0, 6);
}

// ─────────────────────────────────────────────────────────────
// Roster Item
// ─────────────────────────────────────────────────────────────

function RosterItem({
    agent,
    isActive,
    onClick,
    planRankMap,
}: {
    agent: AssignedAgentExtended;
    isActive: boolean;
    onClick: () => void;
    planRankMap: PlanRankMap;
}) {
    const color = tierColor(agent.template.plan_tier, planRankMap);
    const tier = agent.template.plan_tier;
    const clearance = tierClearance(tier, planRankMap);

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left relative overflow-hidden rounded-2xl border transition-all duration-300 group",
                "flex items-center gap-4 px-5 py-4",
                isActive
                    ? "bg-[var(--surface-100)] border-[var(--surface-400)]"
                    : "bg-transparent border-[var(--surface-200)] hover:bg-[var(--surface-50)] hover:border-[var(--surface-300)]"
            )}
            style={isActive ? { boxShadow: `inset 3px 0 0 ${color}, 0 0 0 1px ${color}20` } : {}}
        >
            {/* Avatar: prefer icon_url, fall back to emoji */}
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl transition-all duration-300 overflow-hidden"
                style={{
                    background: isActive
                        ? `color-mix(in srgb, ${color} 15%, var(--surface-200))`
                        : "var(--surface-100)",
                    border: `1px solid ${isActive ? color + "50" : "var(--surface-300)"}`,
                }}
            >
                {agent.template.icon_url ? (
                    <img src={agent.template.icon_url} alt={agent.template.name} className="w-full h-full object-cover" />
                ) : (
                    agent.template.emoji || "🤖"
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                        className="font-black text-sm uppercase tracking-tight truncate"
                        style={{ color: isActive ? "var(--surface-900)" : "var(--surface-700)" }}
                    >
                        {agent.template.name}
                    </span>
                    {(planRankMap[tier] ?? 0) >= 4 && (
                        <Crown className="w-3 h-3 flex-shrink-0" style={{ color }} />
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="text-[10px] font-mono font-semibold uppercase tracking-widest"
                        style={{ color }}
                    >
                        {(agent.template.category ?? tier).toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--surface-500)]">
                        // {clearance}
                    </span>
                </div>
            </div>

            {/* Subtle hover glow */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: `radial-gradient(ellipse at left, ${color}08 0%, transparent 70%)` }}
            />
        </button>
    );
}

// ─────────────────────────────────────────────────────────────
// Detail Panel
// ─────────────────────────────────────────────────────────────

function AgentDetail({ agent, planRankMap }: { agent: AssignedAgentExtended; planRankMap: PlanRankMap }) {
    const color = tierColor(agent.template.plan_tier, planRankMap);
    const clearance = tierClearance(agent.template.plan_tier, planRankMap);
    const mode = agentMode(agent);
    const capabilities = agentCapabilities(agent);
    const pc = agent.template.personality_config;

    return (
        <div
            className="relative rounded-2xl overflow-hidden border border-[var(--surface-300)]"
            style={{
                background: `linear-gradient(135deg, var(--surface-100) 0%, var(--surface-50) 60%, color-mix(in srgb, ${color} 4%, var(--surface-50)) 100%)`,
                boxShadow: `0 0 0 1px ${color}15, inset 0 0 60px ${color}06`,
            }}
        >
            {/* ── Top accent line ── */}
            <div
                className="absolute top-0 inset-x-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }}
            />

            {/* ── Background watermark ── */}
            <div
                className="absolute top-4 right-6 pointer-events-none select-none"
                style={{ opacity: 0.07, filter: "blur(2px)" }}
                aria-hidden
            >
                {agent.template.icon_url ? (
                    <img src={agent.template.icon_url} alt="" className="w-32 h-32 object-cover rounded-2xl" />
                ) : (
                    <span className="text-[180px] leading-none">{agent.template.emoji || "🤖"}</span>
                )}
            </div>

            {/* ── Main content ── */}
            <div className="p-8 space-y-6 relative z-10">

                {/* Identity pill */}
                <div
                    className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-[10px] font-bold uppercase tracking-[0.35em]"
                    style={{
                        color,
                        background: `color-mix(in srgb, ${color} 10%, var(--surface-200))`,
                        borderColor: `${color}35`,
                    }}
                >
                    <Fingerprint className="w-3 h-3" />
                    IDENTITY_VERIFIED //{" "}
                    {agent.assignment_type === "push" ? "ASSIGNED" : "ENTITLED"}
                </div>

                {/* Name + tagline */}
                <div className="flex items-start gap-4">
                    {agent.template.icon_url && (
                        <img
                            src={agent.template.icon_url}
                            alt={agent.template.name}
                            className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-[var(--surface-300)]"
                        />
                    )}
                    <div>
                        <h2
                            className="font-display font-black uppercase tracking-tight leading-none"
                            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "var(--surface-900)" }}
                        >
                            {agent.template.name}
                        </h2>
                        {agent.template.tagline && (
                            <p className="mt-2 text-[11px] font-mono text-[var(--surface-500)] uppercase tracking-[0.25em]">
                                {agent.template.tagline}
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                {agent.template.description && (
                    <p className="text-base text-[var(--surface-600)] font-light leading-relaxed max-w-lg">
                        &ldquo;{agent.template.description}&rdquo;
                    </p>
                )}

                {/* Capabilities / tags */}
                {capabilities.length > 0 && (
                    <div>
                        <p className="text-[9px] font-mono text-[var(--surface-500)] uppercase tracking-[0.4em] mb-3">
                            Capability_Stack
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {capabilities.map((cap, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[var(--surface-200)] bg-[var(--surface-100)] transition-colors hover:border-[var(--surface-300)]"
                                >
                                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                                    <span className="text-[11px] font-bold text-[var(--surface-700)] uppercase tracking-widest truncate">
                                        {cap}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Personality / Style / Tone */}
                {pc && (pc.personality || pc.style || pc.tone) && (
                    <div className="space-y-3">
                        {pc.personality && (
                            <div className="flex gap-3 items-start">
                                <Tag className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--surface-500)]" />
                                <span className="text-xs text-[var(--surface-600)] leading-relaxed">
                                    <span className="font-semibold text-[var(--surface-700)]">Personality: </span>
                                    {pc.personality}
                                </span>
                            </div>
                        )}
                        {pc.style && (
                            <div className="flex gap-3 items-start">
                                <Tag className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--surface-500)]" />
                                <span className="text-xs text-[var(--surface-600)] leading-relaxed">
                                    <span className="font-semibold text-[var(--surface-700)]">Style: </span>
                                    {pc.style}
                                </span>
                            </div>
                        )}
                        {pc.tone && (
                            <div className="flex gap-3 items-start">
                                <Tag className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--surface-500)]" />
                                <span className="text-xs text-[var(--surface-600)] leading-relaxed">
                                    <span className="font-semibold text-[var(--surface-700)]">Tone: </span>
                                    {pc.tone}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Telemetry footer ── */}
            <div
                className="px-8 py-6 border-t border-[var(--surface-200)] grid grid-cols-3 gap-6 relative z-10"
                style={{ background: `color-mix(in srgb, ${color} 3%, var(--surface-100))` }}
            >
                <div className="space-y-1">
                    <p className="text-[9px] font-mono text-[var(--surface-500)] uppercase tracking-[0.4em]">
                        Synapse_Memory
                    </p>
                    <p className="text-2xl font-black text-[var(--surface-900)]">
                        ∞{" "}
                        <span className="text-[10px] font-mono text-[var(--surface-500)] ml-1">NODES</span>
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-[9px] font-mono text-[var(--surface-500)] uppercase tracking-[0.4em]">
                        Clearance_Lv
                    </p>
                    <p className="text-2xl font-black text-[var(--surface-900)]">
                        {clearance}{" "}
                        <span
                            className="text-[10px] font-mono ml-1 uppercase"
                            style={{ color }}
                        >
                            {agent.template.plan_tier}
                        </span>
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-[9px] font-mono text-[var(--surface-500)] uppercase tracking-[0.4em]">
                        Execution_Mode
                    </p>
                    <p
                        className="text-2xl font-black uppercase tracking-tight"
                        style={{ color }}
                    >
                        {mode}
                    </p>
                </div>
            </div>

            {/* ── Open in Desktop ── */}
            <div className="px-8 py-5 border-t border-[var(--surface-200)] flex items-center justify-between relative z-10">
                <a
                    href="oraya://open"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{
                        background: `var(--gradient-primary)`,
                        color: "var(--primary-foreground)",
                    }}
                    title="Open Oraya Desktop to use this agent"
                >
                    <Download className="w-4 h-4" />
                    Open in Oraya Desktop
                </a>

                {/* Corner icons */}
                <div className="flex gap-3 opacity-20">
                    <Settings className="w-4 h-4 text-[var(--surface-600)]" />
                    <Activity className="w-4 h-4 text-[var(--surface-600)]" />
                    <Network className="w-4 h-4 text-[var(--surface-600)]" />
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                    background: "color-mix(in srgb, var(--primary) 10%, var(--surface-100))",
                    border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                }}
            >
                <Bot className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--surface-800)] mb-2">
                No agents available
            </h3>
            <p className="text-sm text-[var(--surface-500)] max-w-xs leading-relaxed">
                Your account has no agents yet. Contact your workspace admin or upgrade your plan.
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Root Component
// ─────────────────────────────────────────────────────────────

export function AgentExplorer({
    agents,
    planRankMap = {},
}: {
    agents: AssignedAgentExtended[];
    /**
     * Maps plan ID → display_order from the live plans table.
     * Build this in the parent page: Object.fromEntries(plans.map(p => [p.id, p.display_order]))
     */
    planRankMap?: PlanRankMap;
}) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (agents.length === 0) return <EmptyState />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
            {/* ── Roster ── */}
            <div className="lg:col-span-2 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 mb-3">
                    <span className="text-[10px] font-mono text-[var(--surface-500)] uppercase tracking-widest">
                        Active_Agents // {agents.length}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--success)] uppercase tracking-widest">
                        ● Authorized
                    </span>
                </div>

                {agents.map((agent, i) => (
                    <RosterItem
                        key={agent.id}
                        agent={agent}
                        isActive={activeIndex === i}
                        onClick={() => setActiveIndex(i)}
                        planRankMap={planRankMap}
                    />
                ))}
            </div>

            {/* ── Detail ── */}
            <div className="lg:col-span-3">
                <AgentDetail agent={agents[activeIndex]} planRankMap={planRankMap} />
            </div>
        </div>
    );
}
