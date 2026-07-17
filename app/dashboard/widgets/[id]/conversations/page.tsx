"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

interface Message {
    role: string;
    content: string;
    ts?: number;
}

interface ConvoListItem {
    id: string;
    visitor_id: string;
    message_count: number;
    token_count: number;
    status: string;
    created_at: string;
    last_message_at: string;
    preview: string;
    referrer: string;
}

interface SessionDetail {
    id: string;
    visitor_id: string;
    visitor_meta: any;
    message_count: number;
    token_count: number;
    status: string;
    created_at: string;
    messages: Message[];
}

export default function ConversationsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const widgetId = params.id as string;
    const selectedSessionId = searchParams.get("session_id");

    const [conversations, setConversations] = useState<ConvoListItem[]>([]);
    const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);

    // Load conversation list
    useEffect(() => {
        fetch(`/api/members/widgets/conversations?widget_id=${widgetId}&limit=100`)
            .then((r) => r.json())
            .then((d) => { setConversations(d.conversations || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [widgetId]);

    // Load detail if session_id in URL
    useEffect(() => {
        if (!selectedSessionId) { setSelectedSession(null); return; }
        setDetailLoading(true);
        fetch(`/api/members/widgets/conversations?widget_id=${widgetId}&session_id=${selectedSessionId}`)
            .then((r) => r.json())
            .then((d) => { setSelectedSession(d.session || null); setDetailLoading(false); })
            .catch(() => setDetailLoading(false));
    }, [widgetId, selectedSessionId]);

    const selectConvo = (id: string) => {
        router.push(`/dashboard/widgets/${widgetId}/conversations?session_id=${id}`);
    };

    const exportCSV = () => {
        window.open(`/api/members/widgets/conversations?widget_id=${widgetId}&export=csv`, "_blank");
    };

    const exportJSON = () => {
        window.open(`/api/members/widgets/conversations?widget_id=${widgetId}&export=json`, "_blank");
    };

    return (
        <div style={{ padding: "1.5rem 2rem", maxWidth: 1200, margin: "0 auto", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexShrink: 0 }}>
                <button
                    onClick={() => router.push(`/dashboard/widgets/${widgetId}/analytics`)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.4rem 0.8rem", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" }}
                >
                    ← Analytics
                </button>
                <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#f1f5f9", margin: 0, flex: 1 }}>
                    💬 Conversations
                </h1>
                <button onClick={exportCSV} style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "0.35rem 0.7rem", color: "#4ade80", cursor: "pointer", fontSize: "0.8rem" }}>
                    Export CSV
                </button>
                <button onClick={exportJSON} style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "0.35rem 0.7rem", color: "#818cf8", cursor: "pointer", fontSize: "0.8rem" }}>
                    Export JSON
                </button>
            </div>

            {/* Main content: list + detail */}
            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1rem", flex: 1, minHeight: 0 }}>
                {/* Conversation list */}
                <div style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, overflow: "auto",
                }}>
                    {loading ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading...</div>
                    ) : conversations.length === 0 ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>No conversations yet</div>
                    ) : (
                        conversations.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => selectConvo(c.id)}
                                style={{
                                    padding: "0.8rem 1rem", cursor: "pointer",
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    background: selectedSessionId === c.id ? "rgba(99,102,241,0.1)" : "transparent",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => { if (selectedSessionId !== c.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                onMouseLeave={(e) => { if (selectedSessionId !== c.id) e.currentTarget.style.background = "transparent"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                                    <span style={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 500 }}>
                                        {c.visitor_id.slice(0, 10)}…
                                    </span>
                                    <span style={{ color: "#64748b", fontSize: "0.7rem" }}>
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {c.preview || "No preview"}
                                </div>
                                <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.3rem" }}>
                                    <span style={{ color: "#64748b", fontSize: "0.7rem" }}>💬 {c.message_count}</span>
                                    <span style={{ color: "#64748b", fontSize: "0.7rem" }}>⚡ {c.token_count}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Conversation detail */}
                <div style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, overflow: "auto", padding: "1rem",
                }}>
                    {!selectedSessionId ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                            Select a conversation to view
                        </div>
                    ) : detailLoading ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading messages...</div>
                    ) : !selectedSession ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>Session not found</div>
                    ) : (
                        <div>
                            {/* Session meta */}
                            <div style={{ marginBottom: "1rem", padding: "0.8rem", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.8rem", color: "#94a3b8" }}>
                                    <span>Visitor: <strong style={{ color: "#e2e8f0" }}>{selectedSession.visitor_id.slice(0, 16)}</strong></span>
                                    <span>Messages: <strong style={{ color: "#e2e8f0" }}>{selectedSession.message_count}</strong></span>
                                    <span>Tokens: <strong style={{ color: "#e2e8f0" }}>{selectedSession.token_count}</strong></span>
                                    <span>Status: <strong style={{ color: selectedSession.status === "active" ? "#4ade80" : "#94a3b8" }}>{selectedSession.status}</strong></span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                {selectedSession.messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                                        }}
                                    >
                                        <div style={{
                                            maxWidth: "70%", padding: "0.7rem 1rem", borderRadius: 12,
                                            background: msg.role === "user"
                                                ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                                                : "rgba(255,255,255,0.06)",
                                            color: msg.role === "user" ? "#fff" : "#e2e8f0",
                                            fontSize: "0.85rem", lineHeight: 1.5,
                                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                                        }}>
                                            {msg.content}
                                            {msg.ts && (
                                                <div style={{ fontSize: "0.65rem", color: msg.role === "user" ? "rgba(255,255,255,0.6)" : "#64748b", marginTop: "0.3rem" }}>
                                                    {new Date(msg.ts).toLocaleTimeString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
