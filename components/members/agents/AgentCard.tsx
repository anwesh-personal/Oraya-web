"use client";

import { Bot, Download, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AgentTemplate {
    id: string;
    name: string;
    description: string | null;
    emoji: string | null;
    icon_url: string | null;
    category: string | null;
    factory_version: number | null;
    factory_published_at: string | null;
}

export interface AssignedAgent {
    id: string;
    template_id: string;
    assignment_type: "push" | "entitled";
    assigned_at: string;
    config_overrides: Record<string, unknown> | null;
    template: AgentTemplate;
}

interface AgentCardProps {
    agent: AssignedAgent;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const assignmentLabel: Record<AssignedAgent["assignment_type"], string> = {
    push: "Assigned",
    entitled: "Included",
};

const assignmentColor: Record<AssignedAgent["assignment_type"], string> = {
    push: "var(--primary)",
    entitled: "var(--info)",
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function AgentCard({ agent }: AgentCardProps) {
    const { template, assignment_type, assigned_at } = agent;
    const color = assignmentColor[assignment_type];
    const label = assignmentLabel[assignment_type];

    return (
        <article
            className={cn(
                "group relative flex flex-col gap-4 p-5 rounded-2xl",
                "bg-[var(--surface-50)] border border-[var(--surface-300)]",
                "hover:border-[var(--surface-400)] hover:bg-[var(--surface-100)]",
                "transition-all duration-200"
            )}
        >
            {/* ── Header ── */}
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{
                        background: `color-mix(in srgb, ${color} 12%, var(--surface-100))`,
                        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                    }}
                >
                    {template.emoji || <Bot className="w-6 h-6" style={{ color }} />}
                </div>

                {/* Title + badge */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[var(--surface-900)] truncate">
                            {template.name}
                        </h3>

                        {/* Assignment type badge */}
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                            style={{
                                color,
                                background: `color-mix(in srgb, ${color} 12%, transparent)`,
                                borderWidth: 1,
                                borderStyle: "solid",
                                borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
                            }}
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            {label}
                        </span>
                    </div>

                    {template.category && (
                        <p className="text-xs text-[var(--surface-500)] mt-0.5 capitalize">
                            {template.category}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Description ── */}
            {template.description && (
                <p className="text-sm text-[var(--surface-600)] leading-relaxed line-clamp-2">
                    {template.description}
                </p>
            )}

            {/* ── Footer ── */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--surface-200)]">
                <div className="flex items-center gap-1.5 text-xs text-[var(--surface-500)]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Assigned {formatDate(assigned_at)}</span>
                </div>

                {template.factory_version !== null && template.factory_version > 0 && (
                    <div className="flex items-center gap-1 text-xs text-[var(--surface-500)]">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span>v{template.factory_version}</span>
                    </div>
                )}
            </div>

            {/* ── Install CTA — appears on hover ── */}
            <div
                className={cn(
                    "absolute inset-x-0 bottom-0 flex items-center justify-center gap-2",
                    "p-3 rounded-b-2xl",
                    "bg-gradient-to-t from-[var(--surface-100)] to-transparent",
                    "opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0",
                    "transition-all duration-200"
                )}
            >
                <a
                    href="oraya://open"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: `var(--gradient-primary)` }}
                    title="Open Oraya Desktop to access this agent"
                >
                    <Download className="w-3.5 h-3.5" />
                    Open in Oraya
                </a>
            </div>
        </article>
    );
}
