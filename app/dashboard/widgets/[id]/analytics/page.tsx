"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface DailyStat {
    date: string;
    messages: number;
    sessions: number;
    tokens: number;
}

interface Referrer {
    domain: string;
    count: number;
}

interface Conversation {
    id: string;
    visitor_id: string;
    message_count: number;
    token_count: number;
    status: string;
    created_at: string;
    last_message_at: string;
    referrer: string;
}

interface Analytics {
    widget: { id: string; name: string; is_active: boolean; created_at: string };
    summary: {
        total_sessions: number;
        total_messages: number;
        total_tokens_used: number;
        active_sessions: number;
        unique_visitors: number;
        avg_messages_per_session: number;
    };
    daily_stats: DailyStat[];
    top_referrers: Referrer[];
    recent_conversations: Conversation[];
}

export default function WidgetAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const widgetId = params.id as string;
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/members/widgets/analytics?widget_id=${widgetId}`)
            .then((r) => r.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [widgetId]);

    if (loading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
                Loading analytics...
            </div>
        );
    }

    if (!data?.widget) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
                Widget not found or no data.
            </div>
        );
    }

    const s = data.summary;
    const maxMsg = Math.max(...data.daily_stats.map((d) => d.messages), 1);

    return (
        <div style={{ padding: "1.5rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <button
                    onClick={() => router.push(`/dashboard/widgets/${widgetId}`)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.4rem 0.8rem", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" }}
                >
                    ← Back to Editor
                </button>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                    📊 {data.widget.name} — Analytics
                </h1>
                <span style={{
                    padding: "0.2rem 0.6rem", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600,
                    background: data.widget.is_active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    color: data.widget.is_active ? "#4ade80" : "#f87171",
                }}>
                    {data.widget.is_active ? "Active" : "Inactive"}
                </span>
            </div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                {[
                    { label: "Conversations", value: s.total_sessions, icon: "💬", color: "#818cf8" },
                    { label: "Messages", value: s.total_messages, icon: "📨", color: "#34d399" },
                    { label: "Tokens Used", value: s.total_tokens_used.toLocaleString(), icon: "⚡", color: "#fbbf24" },
                    { label: "Unique Visitors", value: s.unique_visitors, icon: "👤", color: "#f472b6" },
                    { label: "Active Now", value: s.active_sessions, icon: "🟢", color: "#4ade80" },
                    { label: "Avg Msgs/Session", value: s.avg_messages_per_session, icon: "📏", color: "#a78bfa" },
                ].map((card) => (
                    <div key={card.label} style={{
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12, padding: "1.2rem", position: "relative", overflow: "hidden",
                    }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: "0.3rem" }}>{card.icon}</div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: card.color }}>{card.value}</div>
                        <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.2rem" }}>{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Daily chart (simple bar chart) */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.5rem", marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "1rem" }}>Messages — Last 30 Days</h2>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
                    {data.daily_stats.map((d) => (
                        <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div
                                title={`${d.date}: ${d.messages} msgs`}
                                style={{
                                    width: "100%", maxWidth: 20,
                                    height: Math.max(2, (d.messages / maxMsg) * 100),
                                    background: d.messages > 0 ? "linear-gradient(to top, #6366f1, #818cf8)" : "rgba(255,255,255,0.05)",
                                    borderRadius: "4px 4px 0 0",
                                    transition: "height 0.3s ease",
                                }}
                            />
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>{data.daily_stats[0]?.date}</span>
                    <span style={{ fontSize: "0.65rem", color: "#64748b" }}>{data.daily_stats[data.daily_stats.length - 1]?.date}</span>
                </div>
            </div>

            {/* Two-column: Referrers + Recent Conversations */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem" }}>
                {/* Top Referrers */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.2rem" }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "1rem" }}>Top Referrers</h2>
                    {data.top_referrers.length === 0 ? (
                        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No data yet</p>
                    ) : (
                        data.top_referrers.map((r) => (
                            <div key={r.domain} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <span style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>{r.domain}</span>
                                <span style={{ color: "#818cf8", fontSize: "0.85rem", fontWeight: 600 }}>{r.count}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Recent Conversations */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#e2e8f0", margin: 0 }}>Recent Conversations</h2>
                        <button
                            onClick={() => router.push(`/dashboard/widgets/${widgetId}/conversations`)}
                            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "0.3rem 0.7rem", color: "#818cf8", cursor: "pointer", fontSize: "0.8rem" }}
                        >
                            View All →
                        </button>
                    </div>
                    {data.recent_conversations.length === 0 ? (
                        <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No conversations yet</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {data.recent_conversations.slice(0, 8).map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => router.push(`/dashboard/widgets/${widgetId}/conversations?session_id=${c.id}`)}
                                    style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "0.6rem 0.8rem", borderRadius: 8, cursor: "pointer",
                                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                                >
                                    <div>
                                        <div style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>
                                            {c.visitor_id.slice(0, 8)}… · {c.message_count} msgs
                                        </div>
                                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: 8,
                                        background: c.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)",
                                        color: c.status === "active" ? "#4ade80" : "#94a3b8",
                                    }}>
                                        {c.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
