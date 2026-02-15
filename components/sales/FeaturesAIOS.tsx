"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
    Cpu, Shield, Zap, Terminal, Database, Link, Sparkles,
    Workflow, Brain, Monitor, Activity, Lock, Layers,
    Eye, ChevronRight, X, Globe, Fingerprint, Users,
    MessageSquare, Network, GitBranch, Boxes, BarChart3, ScanLine
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

// Simple performance-optimized typewriter effect
function Typewriter({ text, delay = 20 }: { text: string; delay?: number }) {
    const [displayText, setDisplayText] = useState("");

    React.useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayText(text.slice(0, i));
            i++;
            if (i > text.length) clearInterval(interval);
        }, delay);
        return () => clearInterval(interval);
    }, [text, delay]);

    return <span>{displayText}</span>;
}

// Helper Portal component for Lightbox decoupling
function FeaturePortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children, document.body) : null;
}

const BENTO_FEATURES = [
    {
        id: "indexing",
        size: "large",
        title: "Total Knowledge Persistence",
        headline: "Context Eternal.",
        desc: "Oraya builds a living semantic graph across your entire stack. It never forgets context.",
        icon: Database,
        color: "var(--primary)",
        visual: "/assets/screenshots/ss2.png",
        stats: "12.4M Nodes",
        telemetry: ["2M+ Tokens", "Sub-2ms Lookup", "Neural Persistence"],
        code: `await oraya.persistence.persist({\n  depth: "SEMANTIC_GRAPH",\n  mode: "SOVEREIGN_RECALL",\n  isolation: true\n});`,
        payload: "Advanced vector-embedding engine using local Rust-based models for semantic graph construction.",
        edge: "Everything you've ever typed, coded, or researched is indexed locally. You don't search for code; you recall it with zero latency."
    },
    {
        id: "pulse",
        size: "medium",
        title: "Sub-ms Tactical Pulse",
        headline: "Instant Decisioning.",
        desc: "Neural response times that outpace human thought. Zero-latency feedback loops.",
        icon: Zap,
        color: "#00F0FF",
        stats: "0.12ms LATENCY",
        telemetry: ["Fast-path IO", "Kernel Bypass", "Non-blocking Async"],
        code: `const pulse = await oraya.pulse.ping();\nif (pulse.latency < 0.2) execute();`,
        payload: "High-frequency neural bus optimized for real-time task decisioning and local feedback.",
        edge: "Oraya reacts before you even finish the sentence. Every interaction is fluid, native, and local."
    },
    {
        id: "execution",
        size: "medium",
        title: "Atomic Execution Kernel",
        headline: "Direct Hardware Hooks.",
        desc: "Bypass the proxy layer. Direct terminal and filesystem dominance.",
        icon: Workflow,
        color: "#10B981", // Emerald
        stats: "Sub-12ms",
        telemetry: ["0.2ms RPC", "Direct Syscall", "L5 Dominion"],
        code: `oraya --execute "refactor --atomic" \\\n      --direct-kernel-hooks \\\n      --mode=ABSOLUTE`,
        payload: "Native execution kernel with state-aware recovery protocols and environment sensing.",
        edge: "Oraya doesn't just fail and stop. It analyzes the error, modifies the code, and re-executes until the mission is successful."
    },
    {
        id: "privacy",
        size: "medium",
        title: "Sovereign Isolation Matrix",
        headline: "Biological Isolation.",
        desc: "100% on-device weights. Your data stays in RAM.",
        icon: Shield,
        color: "#D97706", // Copper
        stats: "E2EE_ACTIVE",
        telemetry: ["Zero Cloud I/O", "HSM Isolation", "AES-256 GCM"],
        code: `const vault = new SovereignVault({\n  enclave: "HSM_L5",\n  zeroOutbound: true\n});\nvault.lock(process.env.IP_SECRET);`,
        payload: "Secure enclave weight distribution with zero cloud-outbound traffic for logic processing.",
        edge: "Your IP is your edge. Oraya ensures it never touches a cloud server, preventing training leakage and corporate espionage."
    },
    {
        id: "recall",
        size: "medium",
        title: "Neural Recall API",
        headline: "Memory as an Interface.",
        desc: "Programmatic access to every interaction slice. Total archival dominance.",
        icon: Brain,
        color: "#F0B429",
        stats: "99.9% ACCURACY",
        telemetry: ["Vector Search", "Hybrid Ranking", "Context Stitching"],
        code: `const memory = await oraya.recall("Q4_Strategy");\nconsole.log(memory.layers[0]);`,
        payload: "Semantic retrieval API built on top of the local graph for instant context injection.",
        edge: "Stop searching logs. Query your memory like a database. Oraya understands the intent, not just the keywords."
    },
    {
        id: "dominion",
        size: "wide",
        title: "Parallel Architectural Dominion",
        headline: "God Mode for Architects.",
        desc: "Spawn specialists like Ora, Ova, and Mara to execute parallel refactors.",
        icon: Terminal,
        color: "#10B981", // Emerald
        stats: "L5_CLEARED",
        telemetry: ["5+ Parallel Agents", "Shared Context Relay", "Root Tunnel"],
        code: `trigger swarm(Ora, Ova) {\n  task: "REFRESH_ARCHITECTURE",\n  mode: "PARALLEL_DOMINION"\n}`,
        payload: "Multi-agent orchestration layer managing ephemeral sub-agents based on task complexity.",
        edge: "Stop being a coder and start being a commander. Trigger a 5-agent parallel refactor while you focus on the $18M vision."
    }
];

const secondaryFeatures = [
    {
        icon: Users,
        label: "L5 Task Orchestration",
        desc: "Complex delegation of power across specialized sub-systems.",
        color: "#00F0FF",
        stats: "LEVEL_5_ENABLED",
        code: `const swarm = await Oraya.spawnSwarm("L5");\nswarm.delegate(task.refactor);`,
        payload: "Orchestration layer managing ephemeral sub-agents based on task complexity analysis.",
        edge: "You stop being a coder and start being a commander. Trigger a 5-agent parallel refactor while you watch."
    },
    {
        icon: Network,
        label: "Encrypted Team Relay",
        desc: "Sync knowledge across your circle without a central server.",
        color: "#10B981",
        stats: "P2P_ACTIVE",
        code: `relay.sync({ \n  protocol: "GHOST", \n  p2p: true \n});`,
        payload: "Peer-to-peer relay protocol for decentralized team synchronization and consensus.",
        edge: "Collaboration without compromise. Sync your team's neural shards directly without ever touching the cloud."
    },
    {
        icon: MessageSquare,
        label: "Neuro-Link Relay",
        desc: "Command your agents via secure satellite relay while off the grid.",
        color: "#F0B429",
        stats: "RELAY_ENCRYPTED",
        code: `relay.connect({ \n  key: AUTH_SHARD, \n  ephemeral: true \n});`,
        payload: "Secure bi-directional relay between Oraya Core and the encrypted bot API.",
        edge: "Your AI shouldn't have a leash. Command builds, check status, and get proactive alerts from your phone. Anytime. Anywhere."
    },
    {
        icon: Globe,
        label: "Global Sovereignty Map",
        desc: "Visualize your tactical node distribution across the globe.",
        color: "#00F0FF",
        stats: "NODES_VISUALIZED",
        code: `map.traceNodes();\nmap.highlightSovereign();`,
        payload: "Geo-spatial visualization engine for monitoring decentralized Oraya deployments.",
        edge: "See your kingdom. Track Every Recon Node and Sovereign Entity in real-time on a high-fidelity tactical display."
    },
    {
        icon: Database,
        label: "Ghost Persistence",
        desc: "Dual-layer encrypted storage for absolute 24/7 sovereignty.",
        color: "#10B981",
        stats: "GHOST_ACTIVE",
        code: `persistence.layerMode("DUAL");\npersistence.encryptAll();`,
        payload: "Dual-layer storage with E2EE. Local for privacy, secure relay for 24/7 autonomous persistence.",
        edge: "The privacy of a ghost, the power of a cluster. Research runs 24/7 on the cloud, but your IP stays on your disk."
    },
    {
        icon: Workflow,
        label: "Self-Healing Kernel",
        desc: "Background loops that fix technical debt while you sleep.",
        color: "#F0B429",
        stats: "HEALING_ENABLED",
        code: `while (sleeping) {\n  kernel.scanDebt();\n  kernel.applyPatch();\n}`,
        payload: "System event-hooks and cron-loops for background context optimization and self-healing.",
        edge: "Most AIs wait for you. Oraya doesn't. He researches your new dependencies and has a plan ready before you wake up."
    }
];

import { useResponsive } from "./responsive/ResponsiveProvider";
import { ResponsiveSwitcher } from "./responsive/ResponsiveSwitcher";

export default function FeaturesAIOS() {
    const [hovered, setHovered] = React.useState<string | null>(null);
    const [selectedFeature, setSelectedFeature] = React.useState<any>(null);
    const [autoIndex, setAutoIndex] = useState(0);
    const [isHoveredManually, setIsHoveredManually] = useState(false);
    const { isMobile } = useResponsive();

    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.2 });

    useEffect(() => {
        if (!isInView || isHoveredManually || hovered) return;

        const interval = setInterval(() => {
            setAutoIndex((prev) => (prev + 1) % BENTO_FEATURES.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [isInView, isHoveredManually, hovered]);

    // Lock body scroll when a feature is selected
    React.useEffect(() => {
        if (selectedFeature) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [selectedFeature]);

    const architectHeader = (
        <div className="relative mb-24 md:mb-40">
            {/* Background Scanning Stroke - Atmospheric Element */}
            <div className="absolute -top-20 -left-20 w-[120%] h-[120%] pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] animate-scan-x bg-[length:200%_100%]" />
            </div>

            <div className={cn(
                "relative z-10 flex flex-col xl:flex-row items-center xl:items-start justify-between gap-16 md:gap-24",
                isMobile ? "text-center" : "text-left"
            )}>
                {/* 1. THE FOUNDER KEY (Architect Card) */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                        "relative group shrink-0",
                        isMobile ? "w-full max-w-[320px]" : "w-72"
                    )}
                >
                    {/* Glowing Aura */}
                    <div className="absolute -inset-4 bg-primary/10 rounded-[60px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="relative aspect-[3/4] rounded-[48px] overflow-hidden border border-white/10 bg-[#050505] shadow-2xl overflow-hidden">
                        <Image
                            src="/architect_authentic_likeness.png"
                            alt="The Architect"
                            fill
                            className="object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000 scale-105 group-hover:scale-100"
                        />

                        {/* Scanning Line Animation */}
                        <motion.div
                            animate={{ y: ["-100%", "300%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-40 z-20"
                        />

                        {/* Card Overlay Info */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Fingerprint size={10} className="text-primary" />
                                    <span className="text-[8px] font-mono text-white/40 tracking-[0.4em] uppercase">Security_Clearance: L5</span>
                                </div>
                                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Anwesh Rath</h3>
                                <p className="text-[9px] font-mono text-primary font-black tracking-[0.2em] uppercase">SYSTEM_ARCHITECT_01</p>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[7px] font-mono text-zinc-600 uppercase tracking-widest">
                                <span>SINCE_2024</span>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Outer Metadata Tags */}
                    <div className="absolute top-10 -right-8 flex flex-col gap-2 pointer-events-none hidden md:flex">
                        <div className="px-3 py-1 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-[8px] font-mono text-white/40 tracking-widest uppercase">
                            Bio_Verified
                        </div>
                        <div className="px-3 py-1 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-[8px] font-mono text-white/40 tracking-widest uppercase">
                            Core_Root
                        </div>
                    </div>
                </motion.div>

                {/* 2. THE COMMAND HEADLINE */}
                <div className="flex-1 space-y-12">
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className={cn(
                                "inline-flex items-center gap-4 px-6 py-2.5 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/30 shadow-2xl",
                                isMobile && "mx-auto"
                            )}
                        >
                            <ScanLine size={12} className="text-primary/50 animate-pulse" />
                            Establishing_Dominion
                        </motion.div>

                        <h2 className="text-5xl md:text-[clamp(3rem,8vw,8rem)] font-display font-black text-white leading-[0.85] uppercase tracking-tighter">
                            The First <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white animate-shimmer bg-[length:200%_auto]">
                                Sovereign OS.
                            </span>
                        </h2>
                    </div>

                    <div className={cn(
                        "grid grid-cols-1 md:grid-cols-2 gap-12",
                        isMobile && "text-center"
                    )}>
                        <div className="space-y-6">
                            <p className="text-lg md:text-2xl text-zinc-400 font-extralight uppercase leading-tight tracking-tight">
                                Oraya is not a browser extension. It is a <span className="text-white font-medium italic">Resident Intelligence</span> that owns the machine motor cortex.
                                <span className="text-white"> Full kernel dominance. Direct disk control. Zero telemetry.</span>
                            </p>
                            <div className={cn("flex gap-4 font-mono text-[9px] text-primary/40 uppercase tracking-[0.4em]", isMobile && "justify-center")}>
                                <span>$ grep -p "sovereignty" /sys/kernel</span>
                                <span className="animate-pulse">_</span>
                            </div>
                        </div>

                        {/* 3. SYSTEM TELEMETRY PANEL (Tactical Metadata) */}
                        <div className="hidden lg:block space-y-6 border-l border-white/5 pl-12">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600 font-black uppercase tracking-widest">
                                    <span>Kernel_Integrity</span>
                                    <span className="text-primary">100%</span>
                                </div>
                                <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                                    <motion.div
                                        animate={{ width: ["20%", "85%", "60%", "100%", "45%"] }}
                                        transition={{ duration: 10, repeat: Infinity }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Memory_Safe
                                    </div>
                                    <div className="text-lg font-display font-black text-white">RUST_L5</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[9px] font-mono text-white/20 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        Encryption
                                    </div>
                                    <div className="text-lg font-display font-black text-white">AES_GCM</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const augmentationHeader = (
        <div className="text-center mb-24 md:mb-40 space-y-8 md:space-y-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-4 px-6 md:px-7 py-2 md:py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-white/40 shadow-2xl"
            >
                <Layers size={12} className="text-primary/40" />
                TACTICAL_KERNEL_EXTENSIONS
            </motion.div>

            <h2 className="text-4xl md:text-[clamp(2.25rem,4.5vw,4.5rem)] font-display font-black text-white uppercase leading-[0.95]">
                Deep <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-white/10">Augmentations.</span>
            </h2>
        </div>
    );

    const desktopView = (
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
            {architectHeader}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {BENTO_FEATURES.map((item) => {
                    const uniqueId = `bento-${item.id}`;
                    return (
                        <BentoCard
                            key={uniqueId}
                            item={item}
                            uniqueId={uniqueId}
                            isHovered={hovered === item.id || (!hovered && BENTO_FEATURES[autoIndex].id === item.id)}
                            isAutoHighlight={!hovered && BENTO_FEATURES[autoIndex].id === item.id}
                            onHover={() => setHovered(item.id)}
                            onLeave={() => setHovered(null)}
                            onClick={() => setSelectedFeature({ ...item, uniqueId })}
                        />
                    );
                })}
            </div>

            <div className="mt-56 space-y-24">
                {augmentationHeader}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {secondaryFeatures.map((item, i) => {
                        const uniqueId = `small-feat-${i}`;
                        return (
                            <FeatureSmallCard
                                key={uniqueId}
                                item={item}
                                uniqueId={uniqueId}
                                index={i}
                                onClick={() => setSelectedFeature({ ...item, uniqueId })}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const mobileView = (
        <div className="px-6 relative z-10 space-y-32">
            {architectHeader}
            <div className="space-y-6">
                {BENTO_FEATURES.map((item) => {
                    const uniqueId = `bento-mob-${item.id}`;
                    return (
                        <BentoCard
                            key={uniqueId}
                            item={item}
                            uniqueId={uniqueId}
                            isHovered={hovered === item.id}
                            isAutoHighlight={false}
                            onHover={() => setHovered(item.id)}
                            onLeave={() => setHovered(null)}
                            onClick={() => setSelectedFeature({ ...item, uniqueId })}
                            isMobile={true}
                        />
                    );
                })}
            </div>

            <div className="pt-20">
                {augmentationHeader}
                <div className="space-y-6">
                    {secondaryFeatures.map((item, i) => {
                        const uniqueId = `small-feat-mob-${i}`;
                        return (
                            <FeatureSmallCard
                                key={uniqueId}
                                item={item}
                                uniqueId={uniqueId}
                                index={i}
                                onClick={() => setSelectedFeature({ ...item, uniqueId })}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <section
            ref={containerRef}
            onMouseEnter={() => setIsHoveredManually(true)}
            onMouseLeave={() => setIsHoveredManually(false)}
            className="py-24 bg-transparent relative overflow-hidden"
            id="aios-features"
        >
            <ResponsiveSwitcher mobile={mobileView} desktop={desktopView} />

            {/* LIGHTBOX MODAL */}
            <AnimatePresence>
                {selectedFeature && (
                    <FeaturePortal>
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 overflow-y-auto overflow-x-hidden">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedFeature(null)}
                                className="fixed inset-0 bg-black/95 backdrop-blur-3xl cursor-zoom-out"
                            />

                            <motion.div
                                layoutId={selectedFeature.uniqueId}
                                className="relative w-full max-w-5xl bg-[#050505] border border-white/10 rounded-[32px] md:rounded-[48px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,1)] flex flex-col md:flex-row z-10"
                            >
                                <div className={cn(
                                    "flex items-center justify-center relative p-12 md:p-24 overflow-hidden border-b md:border-b-0 md:border-r border-white/5",
                                    isMobile ? "w-full aspect-video" : "w-[45%] h-full"
                                )}>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
                                    {(() => {
                                        const FeatureIcon = selectedFeature.icon;
                                        return <FeatureIcon size={isMobile ? 80 : 160} strokeWidth={0.5} style={{ color: selectedFeature.color }} className="relative z-10 drop-shadow-[0_0_40px_rgba(217,119,6,0.2)]" />;
                                    })()}
                                    <div className="absolute bottom-8 md:bottom-12 left-6 right-6 font-mono text-[7px] md:text-[9px] text-zinc-800 uppercase tracking-[0.5em] text-center">
                                        Subsystem_ID: {selectedFeature.id?.toUpperCase() || 'CORE'} // ARCHITECT_ONLY
                                    </div>
                                </div>

                                <div className="flex-1 p-8 md:p-16 space-y-8 md:space-y-10 relative">
                                    <button onClick={() => setSelectedFeature(null)} className="absolute top-6 right-6 md:top-10 md:right-10 text-zinc-700 hover:text-white transition-colors">
                                        <X size={isMobile ? 24 : 28} />
                                    </button>

                                    <div className="space-y-3 md:space-y-4">
                                        <div className="inline-flex items-center gap-2 text-[9px] md:text-[11px] font-mono font-black uppercase tracking-[0.5em]" style={{ color: selectedFeature.color }}>
                                            <Activity size={isMobile ? 10 : 12} className="animate-pulse" />
                                            Subsystem_Report_v4.02
                                        </div>
                                        <h2 className="text-xl md:text-3xl font-display font-black text-white uppercase tracking-tight leading-none">{selectedFeature.title || selectedFeature.label}</h2>
                                    </div>

                                    <div className="space-y-10 md:space-y-12">
                                        <div className="space-y-3 md:space-y-4">
                                            <div className="text-[9px] md:text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.4em] md:tracking-[0.6em]">Core_Rationale</div>
                                            <div className="p-6 md:p-8 rounded-[24px] md:rounded-[32px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                                                <p className="text-zinc-300 text-base md:text-xl leading-relaxed italic font-light relative z-10">&quot;{selectedFeature.desc}&quot;</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 md:space-y-4">
                                            <div className="text-[9px] md:text-[10px] font-mono font-black text-secondary uppercase tracking-[0.4em] md:tracking-[0.6em]">Technical_Nucleus</div>
                                            <div className="p-6 md:p-8 rounded-[24px] md:rounded-[32px] bg-secondary/5 border border-secondary/10 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <Terminal size={isMobile ? 32 : 40} className="text-secondary" />
                                                </div>
                                                <pre className="text-secondary text-xs md:text-base font-mono leading-relaxed font-black whitespace-pre-wrap min-h-[4em]">
                                                    <code><Typewriter text={selectedFeature.code || `oraya --status ${selectedFeature.id?.toUpperCase() || 'CORE'}`} /></code>
                                                </pre>
                                                <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-secondary/10 flex items-center justify-between">
                                                    <span className="text-[8px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{selectedFeature.stats || "LOAD_NOMINAL"}</span>
                                                    <span className="text-[8px] md:text-[10px] font-mono text-secondary/40 font-black">X_RECV_099</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 md:pt-8 border-t border-white/5 flex justify-between items-center bg-black/50">
                                        <div className="flex gap-6 md:gap-8">
                                            <div className="space-y-1">
                                                <div className="text-[8px] md:text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Clearance</div>
                                                <div className="text-[9px] md:text-[11px] font-mono text-white">SOVEREIGN_L5</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedFeature(null)} className="px-5 py-2.5 md:px-8 md:py-3 bg-primary text-black font-mono font-black text-[9px] md:text-xs uppercase tracking-widest hover:bg-white transition-colors rounded-xl shadow-[0_10px_30px_var(--primary-glow)]">Terminate</button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </FeaturePortal>
                )}
            </AnimatePresence>
        </section>
    );
}

function BentoCard({ item, uniqueId, isHovered, isAutoHighlight, onHover, onLeave, onClick, isMobile }: any) {
    const isLarge = item.size === "large";
    const isWide = item.size === "wide";

    return (
        <motion.div
            layoutId={uniqueId}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
            className={cn(
                "relative group rounded-[32px] md:rounded-[40px] border border-white/5 bg-[#080808] overflow-hidden transition-all duration-700 cursor-pointer shadow-2xl",
                !isMobile && (isLarge ? "md:col-span-2 md:row-span-2" : isWide ? "md:col-span-2" : "md:col-span-1"),
                isMobile && "min-h-[240px]"
            )}
        >
            <div
                className={cn(
                    "absolute inset-0 opacity-0 transition-opacity duration-1000 pointer-events-none",
                    isHovered ? "opacity-10" : ""
                )}
                style={{ backgroundColor: item.color }}
            />

            {isAutoHighlight && (
                <motion.div
                    className="absolute bottom-0 left-0 h-1 z-30 opacity-60"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 6, ease: "linear" }}
                />
            )}

            <div className={cn("h-full flex flex-col justify-between relative z-20", isMobile ? "p-8" : "p-10")}>
                <div className={cn("space-y-6 md:space-y-8")}>
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[24px] flex items-center justify-center border border-white/10 bg-black group-hover:border-[currentColor] group-hover:bg-[currentColor]/5 transition-all duration-700" style={{ color: item.color }}>
                            {(() => {
                                const ItemIcon = item.icon;
                                return <ItemIcon size={isMobile ? 24 : 32} strokeWidth={1} />;
                            })()}
                        </div>

                        {!isMobile && (
                            <div className="text-right space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                                {item.telemetry?.map((t: string, i: number) => (
                                    <div key={i} className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">{t}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        {item.stats && !isMobile && <span className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-[0.5em] mb-4 block group-hover:text-zinc-500 transition-colors">{item.stats}</span>}
                        <h3 className="text-xl md:text-3xl font-sans font-black text-white tracking-tight uppercase leading-none">{item.title}</h3>
                        <p className="text-zinc-500 text-sm md:text-[15px] leading-relaxed max-w-[300px] group-hover:text-zinc-300 transition-colors font-light italic">&quot;{item.desc}&quot;</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-8 md:mt-12 bg-white/[0.02] border border-white/5 rounded-2xl p-4 group-hover:bg-white/[0.04] transition-colors">
                    <div className="text-[9px] md:text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] group-hover:text-white transition-colors">
                        View_Detailed_Spec
                    </div>
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
            </div>

            {item.visual && (
                <div className={cn(
                    "absolute opacity-20 group-hover:opacity-60 transition-all duration-1000",
                    !isMobile ? (isLarge ? "right-[-15%] bottom-[-5%] w-[110%]" : "right-[-10%] bottom-[-5%] w-[100%]") : "right-[-20%] bottom-[-10%] w-[80%]"
                )}>
                    <div className="relative aspect-video rounded-tl-[40px] md:rounded-tl-[60px] overflow-hidden border-t border-l border-white/10 shadow-[-40px_-40px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                        <Image src={item.visual} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-[4s] ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-l from-[#080808] via-transparent to-transparent" />
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function FeatureSmallCard({ item, uniqueId, index, onClick }: { item: any, uniqueId: string, index: number, onClick: () => void }) {
    const Icon = item.icon;
    const { isMobile } = useResponsive();

    return (
        <motion.div
            layoutId={uniqueId}
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.03 }}
            onClick={onClick}
            className="group relative p-8 md:p-10 rounded-[28px] md:rounded-[32px] bg-[#0A0A0A] border border-white/5 hover:border-[currentColor] hover:bg-white/[0.02] transition-all duration-700 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[240px] md:min-h-[280px]"
            style={{ color: item.color }}
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: 'currentColor' }} />

            <div className="relative z-10 space-y-4 md:space-y-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10 bg-black group-hover:border-[currentColor] group-hover:shadow-[0_0_30px_-5px_currentColor] transition-all duration-700">
                    <Icon size={isMobile ? 24 : 28} strokeWidth={1} />
                </div>
                <div className="space-y-2 md:space-y-3">
                    <h4 className="text-white font-black text-lg md:text-xl uppercase tracking-tight">{item.label}</h4>
                    <p className="text-zinc-600 text-xs md:text-sm leading-snug group-hover:text-zinc-400 transition-colors font-light">{item.desc}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-mono text-zinc-800 uppercase tracking-[0.4em] md:tracking-[0.5em] mt-6 group-hover:text-white transition-colors">
                L5_SPEC <ChevronRight size={isMobile ? 12 : 14} className="group-hover:translate-x-1 transition-all" />
            </div>
        </motion.div>
    );
}

