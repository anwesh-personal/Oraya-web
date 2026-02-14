"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Layers, ArrowLeftRight, FolderOpen, GitBranch, Zap,
    Link2, Plus, Search, FileCode, Share2, Network,
    Activity, Monitor, Database, Scan
} from "lucide-react";
import { cn } from "@/lib/utils";

const WORKSPACES = [
    {
        id: "ws-01",
        name: "Backend_Kernel",
        icon: "⚡",
        color: "#00F0FF",
        files: ["src/routes/auth.rs", "src/middleware/cors.rs", "src/db/migrations.sql"],
        language: "RUST",
        stats: "24,391 LC",
        nodes: "1.2M",
        sync: "98.4%"
    },
    {
        id: "ws-02",
        name: "Frontend_SaaS",
        icon: "🎨",
        color: "#FF00AA",
        files: ["app/page.tsx", "components/Dashboard.tsx", "lib/supabase.ts"],
        language: "TYPESCRIPT",
        stats: "18,672 LC",
        nodes: "840K",
        sync: "99.1%"
    },
    {
        id: "ws-03",
        name: "Infra_Manifests",
        icon: "🛡️",
        color: "#F0B429",
        files: ["Dockerfile", "railway.json", "k8s/deployment.yaml"],
        language: "YAML/DOCKER",
        stats: "3,108 LC",
        nodes: "120K",
        sync: "100%"
    },
    {
        id: "ws-04",
        name: "Mobile_Native",
        icon: "📱",
        color: "#8B5CF6",
        files: ["App.tsx", "screens/Chat.tsx", "services/api.ts"],
        language: "REACT_NATIVE",
        stats: "11,445 LC",
        nodes: "560K",
        sync: "97.5%"
    },
];

const CONNECTIONS = [
    { from: 0, to: 1, label: "AUTH_SCHEMA_HANDOFF", weight: 0.9 },
    { from: 0, to: 2, label: "INFRA_SECRETS_RELAY", weight: 0.6 },
    { from: 1, to: 3, label: "API_CONTRACT_SYNC", weight: 0.8 },
];

export default function MultiWorkspace() {
    const [activeWs, setActiveWs] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Auto-cycle search demo
    useEffect(() => {
        const queries = [
            "handleAuth middleware",
            "supabase RLS policy",
            "deployment config",
            "user session token",
        ];
        let i = 0;
        const interval = setInterval(() => {
            setIsSearching(true);
            setSearchQuery("");
            const q = queries[i % queries.length];
            let charIndex = 0;
            const typeInterval = setInterval(() => {
                setSearchQuery(q.slice(0, charIndex + 1));
                charIndex++;
                if (charIndex >= q.length) {
                    clearInterval(typeInterval);
                    setTimeout(() => setIsSearching(false), 2000);
                }
            }, 60);
            i++;
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 md:py-48 bg-black relative overflow-hidden noise-overlay border-t border-white/5" id="workspaces">
            <div className="scanline" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">

                {/* ACT HEADER: Cross-Context Intelligence */}
                <div className="mb-32 space-y-10 group">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-5 py-2 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.05)]"
                        >
                            <Network size={14} className="animate-pulse" />
                            NEURAL_CROSS_RELIANCE_V1.2
                        </motion.div>

                        <h2 className="text-6xl md:text-9xl font-sans font-black text-white tracking-tighter leading-[0.85] uppercase">
                            One Brain. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/50 to-[#00F0FF]">Every Project.</span>
                        </h2>

                        <p className="text-zinc-500 font-light text-xl md:text-2xl max-w-4xl uppercase tracking-tighter">
                            Oraya doesn't just see your folders—it understands the <span className="text-white italic">connective tissue</span> between your Backend, Frontend, and Cloud.
                        </p>
                    </div>
                </div>

                {/* THE CONTROL HUB */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* LEFT: WORKSPACE TELEMETRY CARDS */}
                    <div className="space-y-4">
                        <div className="mb-6 flex justify-between items-center px-4">
                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Active_Node_Map</span>
                            <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-widest">Syncing...</span>
                        </div>

                        {WORKSPACES.map((ws, i) => (
                            <motion.button
                                key={ws.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => setActiveWs(i)}
                                className={cn(
                                    "w-full p-8 rounded-[32px] border text-left transition-all duration-700 group relative overflow-hidden",
                                    activeWs === i
                                        ? "bg-white/[0.04] border-white/20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
                                        : "bg-white/[0.01] border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-4xl">{ws.icon}</span>
                                </div>

                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 bg-black group-hover:border-[currentColor] transition-all duration-700" style={{ color: ws.color }}>
                                        <Database size={32} strokeWidth={1} />
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{ws.name}</h4>
                                            <span className="px-3 py-0.5 rounded-sm border text-[8px] font-mono font-black" style={{ borderColor: `${ws.color}40`, color: ws.color }}>{ws.language}</span>
                                        </div>
                                        <div className="flex gap-6 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                            <span>{ws.stats}</span>
                                            <span className="text-zinc-800">//</span>
                                            <span>{ws.nodes} NODES</span>
                                            <span className="text-zinc-800">//</span>
                                            <span style={{ color: ws.color }} className="opacity-70">{ws.sync} SYNC</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Detail Fragment */}
                                <AnimatePresence>
                                    {activeWs === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mt-10 pt-8 border-t border-white/5 space-y-4"
                                        >
                                            <div className="flex flex-wrap gap-3">
                                                {ws.files.map(f => (
                                                    <div key={f} className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-black px-3 py-1.5 rounded-lg border border-white/5">
                                                        <FileCode size={12} style={{ color: ws.color }} />
                                                        {f}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        ))}
                    </div>

                    {/* RIGHT: THE NEURAL BRIDGE VISUALIZATION */}
                    <div className="space-y-6">
                        <div className="rounded-[40px] border border-white/5 bg-[#050505] p-10 space-y-10 relative overflow-hidden shadow-2xl">
                            {/* Search Simulation */}
                            <div className="space-y-6">
                                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.5em]">Global_Semantic_Search</div>
                                <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/10 flex items-center gap-4">
                                    <Search size={20} className="text-zinc-700" />
                                    <div className="flex-1 font-mono text-lg text-white tracking-tight">
                                        {searchQuery}
                                        <span className={cn("inline-block w-[2px] h-6 bg-[#00F0FF] ml-1", isSearching ? "animate-pulse" : "opacity-0")} />
                                    </div>
                                </div>
                            </div>

                            {/* Connection Graph Visualization */}
                            <div className="space-y-8">
                                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.5em]">Neural_Dependency_Flow</div>
                                <div className="space-y-6 bg-white/[0.01] p-8 rounded-[32px] border border-white/5">
                                    {CONNECTIONS.map((conn, i) => (
                                        <div key={i} className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 bg-black">
                                                <span className="text-xl">{WORKSPACES[conn.from].icon}</span>
                                            </div>
                                            <div className="flex-1 h-[2px] bg-white/5 relative">
                                                <motion.div
                                                    animate={{ x: ["0%", "100%"] }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                                                    className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent shadow-[0_0_15px_rgba(0,240,255,0.5)]"
                                                />
                                                <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 text-[8px] font-mono text-zinc-700 uppercase tracking-widest whitespace-nowrap">
                                                    {conn.label}
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 bg-black">
                                                <span className="text-xl">{WORKSPACES[conn.to].icon}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Summary Box */}
                        <div className="p-10 rounded-[40px] border border-white/5 bg-white/[0.01] space-y-4">
                            <h4 className="text-white font-black uppercase tracking-tight text-xl">Total Intelligence Unification.</h4>
                            <p className="text-zinc-500 font-light text-base leading-relaxed uppercase tracking-tighter italic">
                                &quot;Conversation context is <span className="text-white font-normal">synthesized across your entire fleet</span>. Ask about your backend schema and get answers that reference your frontend components.&quot;
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
