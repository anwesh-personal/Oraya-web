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
        color: "#F0B429",
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
        color: "#00F0FF",
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
        color: "#FFFFFF",
        files: ["App.tsx", "screens/Chat.tsx", "services/api.ts"],
        language: "REACT_NATIVE",
        stats: "11,445 LC",
        nodes: "560K",
        sync: "97.5%"
    },
];

const CONNECTIONS = [
    { from: 0, to: 1, label: "AUTH_SCHEMA_HANDOFF", weight: 0.9, impact: "Critical" },
    { from: 0, to: 2, label: "INFRA_SECRETS_RELAY", weight: 0.6, impact: "Medium" },
    { from: 1, to: 3, label: "API_CONTRACT_SYNC", weight: 0.8, impact: "High" },
];

export default function MultiWorkspace() {
    const [activeWs, setActiveWs] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Auto-cycle Workspaces
    useEffect(() => {
        if (isHovered) return;

        const interval = setInterval(() => {
            setActiveWs((prev) => (prev + 1) % WORKSPACES.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isHovered]);

    // Synchronized Search Simulation based on Active Workspace
    useEffect(() => {
        const queriesMap: Record<number, string[]> = {
            0: ["handleAuth middleware", "postgres migration", "rust kernel hooks"],
            1: ["hydration error fix", "tailwind config", "supabase RLS"],
            2: ["k8s ingress rules", "docker build optimization", "secrets relay"],
            3: ["react native bridge", "ios push tokens", "navigation state"],
        };

        const currentQueries = queriesMap[activeWs];
        const q = currentQueries[Math.floor(Math.random() * currentQueries.length)];

        setIsSearching(true);
        setSearchQuery("");

        let charIndex = 0;
        const typeInterval = setInterval(() => {
            setSearchQuery(q.slice(0, charIndex + 1));
            charIndex++;
            if (charIndex >= q.length) {
                clearInterval(typeInterval);
                setTimeout(() => setIsSearching(false), 2000);
            }
        }, 40);

        return () => clearInterval(typeInterval);
    }, [activeWs]);

    const activeWorkspace = WORKSPACES[activeWs];

    return (
        <section
            className="py-12 md:py-16 bg-transparent relative overflow-hidden"
            id="workspaces"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">

                {/* ACT HEADER: Cross-Context Intelligence */}
                <div className="mb-16 space-y-12">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-16">
                        <div className="space-y-10">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40 shadow-2xl"
                            >
                                <Network size={14} className="text-primary/40" />
                                NEURAL_FLEET_ORCHESTRATION_v5
                            </motion.div>

                            <h2 className="text-[clamp(2.6rem,6vw,6rem)] font-display font-black text-white leading-[0.95] uppercase">
                                One Brain. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-white/10">Every Project.</span>
                            </h2>
                        </div>

                        <div className="max-w-2xl space-y-6 lg:pb-8">
                            <p className="text-zinc-500 font-extralight text-xl uppercase leading-snug">
                                Stop the context-switching tax. Oraya understands the <span className="text-white/60 italic font-normal">connective tissue</span> between your polyglot architecture. One unified intelligence for your entire engineering fleet.
                            </p>
                        </div>
                    </div>
                </div>

                {/* THE CONTROL HUB */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

                    {/* LEFT: WORKSPACE TELEMETRY CARDS (Span 5) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="mb-8 flex justify-between items-center px-6">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em]">Active_Node_Map</span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-800 uppercase tracking-[0.4em]">Fleet_Ready</span>
                        </div>

                        {WORKSPACES.map((ws, i) => (
                            <motion.button
                                key={ws.id}
                                layout
                                onClick={() => setActiveWs(i)}
                                className={cn(
                                    "w-full p-8 md:p-10 rounded-[40px] border text-left transition-all duration-700 group relative overflow-hidden shadow-2xl",
                                    activeWs === i
                                        ? "bg-white/[0.04] border-white/20 ring-1 ring-primary/20"
                                        : "bg-white/[0.01] border-white/[0.03] hover:border-white/10"
                                )}
                            >
                                <AnimatePresence>
                                    {activeWs === i && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none"
                                        />
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-8 relative z-10">
                                    <motion.div
                                        layout
                                        className={cn(
                                            "w-16 h-16 rounded-[24px] flex items-center justify-center border transition-all duration-1000 relative",
                                            activeWs === i ? "bg-surface-50 border-white/20" : "bg-black border-white/5"
                                        )} style={{ color: activeWs === i ? ws.color : '#52525b' }}>
                                        <Database size={32} strokeWidth={1} />
                                        {activeWs === i && (
                                            <motion.div
                                                layoutId="active-ws-glow"
                                                className="absolute inset-0 rounded-[24px] shadow-[0_0_30px_-5px_currentColor] transition-all"
                                            />
                                        )}
                                    </motion.div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <h4 className={cn(
                                                "text-2xl font-black uppercase transition-colors duration-700",
                                                activeWs === i ? "text-white" : "text-zinc-600"
                                            )}>{ws.name}</h4>
                                            {activeWs === i && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="px-3 py-1 bg-primary/10 border border-primary/20 text-[9px] font-mono font-black text-primary rounded-full tracking-widest uppercase"
                                                >
                                                    {ws.language}
                                                </motion.span>
                                            )}
                                        </div>
                                        <div className="flex gap-6 text-[10px] font-mono text-zinc-700 uppercase tracking-[0.2em]">
                                            <span>{ws.stats}</span>
                                            <span className="flex items-center gap-2">
                                                <Activity size={10} className={cn(activeWs === i && "animate-pulse", activeWs === i ? "text-primary" : "text-zinc-800")} />
                                                {ws.nodes} NODES
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence initial={false}>
                                    {activeWs === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-10 pt-8 border-t border-white/[0.05] grid grid-cols-1 gap-2">
                                                {ws.files.map((f, idx) => (
                                                    <motion.div
                                                        key={f}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="flex items-center justify-between text-[10px] font-mono bg-black/40 px-5 py-3 rounded-2xl border border-white/[0.05] group/file hover:border-primary/20 transition-all"
                                                    >
                                                        <div className="flex items-center gap-4 text-zinc-500 group-hover/file:text-white transition-colors">
                                                            <FileCode size={12} className="text-primary/40 group-hover/file:text-primary transition-colors" />
                                                            {f}
                                                        </div>
                                                        <span className="text-zinc-800 group-hover/file:text-zinc-600 transition-colors uppercase italic">{ws.sync} SYNC</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        ))}
                    </div>

                    {/* RIGHT: THE NEURAL BRIDGE VISUALIZATION (Span 7) */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="rounded-[64px] border border-white/[0.05] bg-surface-50 p-12 md:p-20 space-y-16 relative overflow-hidden shadow-2xl min-h-[600px] flex flex-col justify-center">
                            {/* Abstract Neural Layer Background */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
                                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
                            </div>

                            {/* Search Simulation - High Status */}
                            <div className="space-y-8 relative z-10">
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.6em]">GLOBAL_SEMANTIC_RECALL</div>
                                    <div className="flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                    </div>
                                </div>
                                <div className="p-10 rounded-[40px] bg-black/40 backdrop-blur-3xl border border-white/[0.08] flex items-center gap-8 shadow-inner">
                                    <Search size={28} className="text-zinc-700" strokeWidth={1} />
                                    <div className="flex-1 font-mono text-2xl md:text-3xl text-white uppercase">
                                        {searchQuery || <span className="text-zinc-800">awaiting_input...</span>}
                                        <motion.span
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="inline-block w-[3px] h-8 bg-primary ml-2 align-middle"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Active Dependency Visualization */}
                            <div className="space-y-10 relative z-10">
                                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.6em]">NEURAL_DEPENDENCY_RESOLVER</div>
                                <div className="space-y-6 bg-black/20 p-12 rounded-[48px] border border-white/[0.05] backdrop-blur-xl">
                                    {CONNECTIONS.map((conn, i) => {
                                        const isRelevant = WORKSPACES[conn.from].id === activeWorkspace.id || WORKSPACES[conn.to].id === activeWorkspace.id;
                                        return (
                                            <div key={i} className={cn(
                                                "flex items-center gap-8 transition-all duration-1000",
                                                isRelevant ? "opacity-100" : "opacity-10 grayscale"
                                            )}>
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.05] bg-surface-50 text-xl">
                                                    {WORKSPACES[conn.from].icon}
                                                </div>
                                                <div className="flex-1 h-[1px] bg-white/[0.05] relative">
                                                    {isRelevant && (
                                                        <motion.div
                                                            animate={{ x: ["0%", "100%"] }}
                                                            transition={{ duration: 3, repeat: Infinity, ease: [0.16, 1, 0.3, 1], delay: i * 0.8 }}
                                                            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                                                        />
                                                    )}
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-zinc-700 uppercase tracking-[0.3em] whitespace-nowrap">
                                                        {conn.label}
                                                    </div>
                                                </div>
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.05] bg-surface-50 text-xl">
                                                    {WORKSPACES[conn.to].icon}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Summary Box & Anticipatory Impact Report */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-10 rounded-[48px] border border-white/[0.03] bg-white/[0.01] space-y-6 shadow-2xl flex-1">
                                <h4 className="text-white/80 font-black uppercase tracking-tight text-xl">SYNTHESIZED_REPORT</h4>
                                <p className="text-zinc-500 font-extralight text-sm leading-relaxed uppercase italic">
                                    &quot;Oraya resolves <span className="text-white/60 font-normal">connective dependencies</span> in real-time, providing logic aware of the full system state.&quot;
                                </p>
                                <div className="flex gap-6 mt-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest leading-none">Fleet_Nodes</span>
                                        <span className="text-base font-mono text-white">4.8M ACTIVE</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest leading-none">Relay_Speed</span>
                                        <span className="text-base font-mono text-primary">0.02ms</span>
                                    </div>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-10 rounded-[48px] border border-primary/10 bg-primary/[0.02] space-y-6 shadow-2xl flex-1 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Scan size={60} className="text-primary" />
                                </div>
                                <h4 className="text-primary font-black uppercase tracking-tight text-xl">ANTICIPATORY_IMPACT</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span className="text-[10px] font-mono text-white/80 uppercase tracking-widest">Logic leak detected in API contact</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Mobile_Native sync pending...</span>
                                    </div>
                                    <div className="pt-2">
                                        <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Impact_Weight</div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                animate={{ width: ["10%", "85%", "40%", "72%"] }}
                                                transition={{ duration: 10, repeat: Infinity }}
                                                className="h-full bg-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
