"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Microscope,
    Play,
    Pause,
    Settings,
    Clock,
    Globe,
    FileText,
    Zap,
    AlertTriangle,
    Loader2,
    Check,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    BookOpen,
    Target,
    RefreshCw,
    Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ResearchJob {
    id: string;
    name: string;
    status: "running" | "paused" | "completed" | "failed" | "queued";
    query: string;
    sources: string[];
    created_at: string;
    last_run_at: string | null;
    total_findings: number;
    tokens_used: number;
    schedule: string | null;
    next_run_at: string | null;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
}

const statusConfig: Record<string, { color: string; label: string }> = {
    running: { color: "var(--success)", label: "Running" },
    paused: { color: "var(--warning)", label: "Paused" },
    completed: { color: "var(--primary)", label: "Completed" },
    failed: { color: "var(--error)", label: "Failed" },
    queued: { color: "var(--surface-500)", label: "Queued" },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function ResearchPage() {
    const [jobs, setJobs] = useState<ResearchJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [expandedJob, setExpandedJob] = useState<string | null>(null);

    // Create form state
    const [newJobName, setNewJobName] = useState("");
    const [newJobQuery, setNewJobQuery] = useState("");
    const [newJobSchedule, setNewJobSchedule] = useState("daily");
    const [newJobSources, setNewJobSources] = useState<string[]>(["web", "academic"]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    async function fetchJobs() {
        try {
            const res = await fetch("/api/members/research");
            if (res.ok) {
                const data = await res.json();
                setJobs(data.jobs || []);
            }
        } catch (err) {
            console.error("Failed to fetch research jobs:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateJob(e: React.FormEvent) {
        e.preventDefault();
        if (!newJobName.trim() || !newJobQuery.trim()) return;

        setCreating(true);
        try {
            const res = await fetch("/api/members/research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newJobName,
                    query: newJobQuery,
                    schedule: newJobSchedule,
                    sources: newJobSources,
                }),
            });
            if (res.ok) {
                setShowCreateForm(false);
                setNewJobName("");
                setNewJobQuery("");
                setNewJobSchedule("daily");
                setNewJobSources(["web", "academic"]);
                await fetchJobs();
            }
        } catch (err) {
            console.error("Failed to create research job:", err);
        } finally {
            setCreating(false);
        }
    }

    async function toggleJob(jobId: string, currentStatus: string) {
        const action = currentStatus === "running" ? "pause" : "resume";
        try {
            await fetch(`/api/members/research/${jobId}/${action}`, { method: "POST" });
            await fetchJobs();
        } catch (err) {
            console.error("Failed to toggle job:", err);
        }
    }

    async function deleteJob(jobId: string) {
        if (!confirm("Are you sure you want to delete this research job? All findings will be lost.")) return;
        try {
            await fetch(`/api/members/research/${jobId}`, { method: "DELETE" });
            await fetchJobs();
        } catch (err) {
            console.error("Failed to delete job:", err);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    const totalTokensUsed = jobs.reduce((sum, job) => sum + job.tokens_used, 0);
    const totalFindings = jobs.reduce((sum, job) => sum + job.total_findings, 0);
    const runningJobs = jobs.filter(j => j.status === "running").length;

    return (
        <div className="max-w-5xl mx-auto">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)] font-display">
                        24/7 Research
                    </h1>
                    <p className="text-[var(--surface-600)] mt-1">
                        Cloud-powered continuous research that works even when your desktop is offline.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/20"
                >
                    <Plus className="w-4 h-4" />
                    New Research Job
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[var(--success)]/10">
                            <Play className="w-4 h-4 text-[var(--success)]" />
                        </div>
                        <span className="text-sm text-[var(--surface-500)]">Active Jobs</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--surface-900)]">{runningJobs}</p>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[var(--primary)]/10">
                            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                        </div>
                        <span className="text-sm text-[var(--surface-500)]">Total Findings</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--surface-900)]">{formatNumber(totalFindings)}</p>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-[var(--warning)]/10">
                            <Zap className="w-4 h-4 text-[var(--warning)]" />
                        </div>
                        <span className="text-sm text-[var(--surface-500)]">Tokens Used</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--surface-900)]">{formatNumber(totalTokensUsed)}</p>
                </div>
            </div>

            {/* ── Create Form ── */}
            {showCreateForm && (
                <div className="mb-8 p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--primary)]/20">
                    <h2 className="text-lg font-semibold text-[var(--surface-800)] mb-5">
                        Create Research Job
                    </h2>
                    <form onSubmit={handleCreateJob} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                Job Name
                            </label>
                            <input
                                type="text"
                                value={newJobName}
                                onChange={(e) => setNewJobName(e.target.value)}
                                placeholder="e.g., AI Safety Research Tracker"
                                required
                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                Research Query
                            </label>
                            <textarea
                                value={newJobQuery}
                                onChange={(e) => setNewJobQuery(e.target.value)}
                                placeholder="Describe what you want to research continuously. Example: Track new developments in AI safety, alignment research, and interpretability methods published in top ML conferences and preprint servers."
                                required
                                rows={4}
                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 text-sm resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                    Schedule
                                </label>
                                <select
                                    value={newJobSchedule}
                                    onChange={(e) => setNewJobSchedule(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] text-sm"
                                >
                                    <option value="hourly">Every hour</option>
                                    <option value="every_6h">Every 6 hours</option>
                                    <option value="every_12h">Every 12 hours</option>
                                    <option value="daily">Once a day</option>
                                    <option value="weekly">Once a week</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                    Sources
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {["web", "academic", "news", "patents", "social"].map(src => (
                                        <button
                                            key={src}
                                            type="button"
                                            onClick={() => {
                                                setNewJobSources(prev =>
                                                    prev.includes(src)
                                                        ? prev.filter(s => s !== src)
                                                        : [...prev, src]
                                                );
                                            }}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
                                                newJobSources.includes(src)
                                                    ? "bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]"
                                                    : "bg-[var(--surface-100)] border-[var(--surface-300)] text-[var(--surface-600)]"
                                            )}
                                        >
                                            {src}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 rounded-xl text-sm text-[var(--surface-600)] hover:bg-[var(--surface-100)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                {creating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Microscope className="w-4 h-4" />
                                )}
                                {creating ? "Creating..." : "Create Job"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Jobs List ── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--surface-800)]">
                        Research Jobs ({jobs.length})
                    </h2>
                    <button
                        onClick={fetchJobs}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--surface-500)] hover:text-[var(--surface-700)] hover:bg-[var(--surface-100)] transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                </div>

                {jobs.length === 0 ? (
                    <div className="p-12 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] text-center">
                        <Microscope className="w-12 h-12 text-[var(--surface-400)] mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-[var(--surface-800)] mb-2">
                            No research jobs yet
                        </h3>
                        <p className="text-sm text-[var(--surface-500)] max-w-md mx-auto mb-6">
                            Create your first cloud research job. Oraya will continuously search the web, academic databases, and other sources for the information you need — even while your desktop is off.
                        </p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/20"
                        >
                            <Plus className="w-4 h-4" />
                            Create Your First Research Job
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => {
                            const status = statusConfig[job.status] || statusConfig.queued;
                            const isExpanded = expandedJob === job.id;

                            return (
                                <div
                                    key={job.id}
                                    className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] overflow-hidden transition-all"
                                >
                                    {/* Job Header */}
                                    <div className="p-5 flex items-center gap-4">
                                        <div
                                            className="p-2.5 rounded-xl"
                                            style={{ backgroundColor: `color-mix(in srgb, ${status.color} 10%, transparent)` }}
                                        >
                                            <Microscope
                                                className="w-5 h-5"
                                                style={{ color: status.color }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-semibold text-[var(--surface-900)] truncate">
                                                    {job.name}
                                                </h3>
                                                <span
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                                    style={{
                                                        backgroundColor: `color-mix(in srgb, ${status.color} 10%, transparent)`,
                                                        color: status.color,
                                                    }}
                                                >
                                                    <span
                                                        className={cn("w-1.5 h-1.5 rounded-full", job.status === "running" && "animate-pulse")}
                                                        style={{ backgroundColor: status.color }}
                                                    />
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[var(--surface-500)] truncate">
                                                {job.query}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right hidden md:block mr-4">
                                                <p className="text-sm font-semibold text-[var(--surface-800)]">
                                                    {formatNumber(job.total_findings)} findings
                                                </p>
                                                <p className="text-xs text-[var(--surface-500)]">
                                                    {formatNumber(job.tokens_used)} tokens used
                                                </p>
                                            </div>

                                            {(job.status === "running" || job.status === "paused") && (
                                                <button
                                                    onClick={() => toggleJob(job.id, job.status)}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors",
                                                        job.status === "running"
                                                            ? "hover:bg-[var(--warning)]/10 text-[var(--warning)]"
                                                            : "hover:bg-[var(--success)]/10 text-[var(--success)]"
                                                    )}
                                                    title={job.status === "running" ? "Pause" : "Resume"}
                                                >
                                                    {job.status === "running" ? (
                                                        <Pause className="w-4 h-4" />
                                                    ) : (
                                                        <Play className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}

                                            <button
                                                onClick={() => deleteJob(job.id)}
                                                className="p-2 rounded-lg hover:bg-[var(--error)]/10 text-[var(--surface-400)] hover:text-[var(--error)] transition-colors"
                                                title="Delete job"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                                                className="p-2 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-400)] transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="border-t border-[var(--surface-200)] p-5 bg-[var(--surface-100)]/50">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs text-[var(--surface-500)]">Created</p>
                                                    <p className="text-sm text-[var(--surface-700)]">{formatDate(job.created_at)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[var(--surface-500)]">Last Run</p>
                                                    <p className="text-sm text-[var(--surface-700)]">{formatDate(job.last_run_at)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[var(--surface-500)]">Next Run</p>
                                                    <p className="text-sm text-[var(--surface-700)]">{formatDate(job.next_run_at)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[var(--surface-500)]">Schedule</p>
                                                    <p className="text-sm text-[var(--surface-700)] capitalize">{job.schedule || "Manual"}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[var(--surface-500)] mb-1">Sources</p>
                                                <div className="flex gap-2 flex-wrap">
                                                    {job.sources.map(src => (
                                                        <span
                                                            key={src}
                                                            className="px-2 py-1 rounded-lg bg-[var(--surface-200)] text-xs text-[var(--surface-600)] capitalize"
                                                        >
                                                            {src}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <p className="text-xs text-[var(--surface-500)] mb-1">Full Query</p>
                                                <p className="text-sm text-[var(--surface-700)] bg-[var(--surface-200)] p-3 rounded-xl">
                                                    {job.query}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Info Banner ── */}
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary)]/5 border border-[var(--primary)]/15">
                <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--surface-900)] mb-1">
                            How 24/7 Research Works
                        </h3>
                        <p className="text-xs text-[var(--surface-600)] leading-relaxed">
                            Research jobs run on Oraya's cloud infrastructure, continuously monitoring the specified sources for new information matching your query.
                            Findings are synced to your desktop app automatically when it's online. Each run consumes tokens from your wallet based on the complexity of the research and number of sources.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
