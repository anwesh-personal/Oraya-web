import { Bot, Sparkles } from "lucide-react";
import { AgentCard, type AssignedAgent } from "./AgentCard";

// ─────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
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
                No agents assigned yet
            </h3>
            <p className="text-sm text-[var(--surface-500)] max-w-xs leading-relaxed">
                Your administrator hasn&apos;t assigned any agents to your account.
                Check back later or contact your workspace admin.
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Grid
// ─────────────────────────────────────────────────────────────

interface AgentGridProps {
    agents: AssignedAgent[];
}

export function AgentGrid({ agents }: AgentGridProps) {
    if (agents.length === 0) {
        return <EmptyState />;
    }

    return (
        <section>
            {/* Count row */}
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm text-[var(--surface-500)]">
                    {agents.length} agent{agents.length !== 1 ? "s" : ""} available to you
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                ))}
            </div>
        </section>
    );
}
