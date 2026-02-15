"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function FeaturesAIOS() {
    const [hovered, setHovered] = React.useState<string | null>(null);
    const [selectedFeature, setSelectedFeature] = React.useState<any>(null);

    // Lock body scroll when a feature is selected to prevent viewport shifts
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

    return (
        <section className="py-12 bg-transparent relative overflow-hidden" id="aios-features">
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                {/* ACT HEADER: Architectural Subsystems */}
                <div className="mb-12 space-y-12">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-16">
                        <div className="flex flex-col md:flex-row gap-12 items-start">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="w-full md:w-64 aspect-[4/5] relative rounded-[48px] overflow-hidden border border-white/[0.05] group bg-surface-50 shadow-2xl shrink-0"
                            >
                                <Image
                                    src="/architect_authentic_likeness.png"
                                    alt="The Architect of Oraya"
                                    fill
                                    className="object-cover grayscale brightness-75 hover:brightness-100 transition-all duration-1000 scale-105 group-hover:scale-100"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-transparent to-transparent opacity-80" />

                                {/* ID Badge HUD */}
                                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-[24px] border border-white/[0.08] bg-black/40 backdrop-blur-2xl space-y-2 z-10">
                                    <p className="text-[9px] font-mono font-black text-primary/60 tracking-[0.4em] uppercase">// ARCHITECT_VERIFIED</p>
                                    <p className="text-base font-display font-black text-white uppercase tracking-tight">Anwesh Rath</p>
                                    <p className="text-[8px] font-mono text-zinc-600 tracking-[0.2em] uppercase">ID: 4192.BF.F0 // OS: v1.2</p>
                                </div>
                            </motion.div>

                            <div className="space-y-10">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40 shadow-2xl"
                                >
                                    <ScanLine size={14} className="text-secondary/40" />
                                    SOVEREIGN_SUBSYSTEM_AUDIT
                                </motion.div>

                                <h2 className="text-[clamp(2.6rem,6vw,6rem)] font-display font-black text-white leading-[0.95] uppercase">
                                    The First <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-white/10">Sovereign OS.</span>
                                </h2>
                            </div>
                        </div>

                        <div className="max-w-md space-y-6 lg:pb-8">
                            <p className="text-zinc-500 font-extralight text-xl uppercase leading-snug">
                                Unlike modular &quot;AI Tools&quot; that live in a browser tab, Oraya is a <span className="text-white/60 italic font-normal">Resident Intelligence</span> that owns the machine motor cortex.
                            </p>
                            <div className="flex gap-4 font-mono text-[9px] text-primary/30 uppercase tracking-[0.4em]">
                                <span>$ grep -p &quot;sovereignty&quot; /kernel</span>
                                <span className="animate-pulse">_</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* THE BENTO GRID - HIGH DENSITY */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {BENTO_FEATURES.map((item) => {
                        const uniqueId = `bento-${item.id}`;
                        return (
                            <BentoCard
                                key={uniqueId}
                                item={item}
                                uniqueId={uniqueId}
                                isHovered={hovered === item.id}
                                onHover={() => setHovered(item.id)}
                                onLeave={() => setHovered(null)}
                                onClick={() => setSelectedFeature({ ...item, uniqueId })}
                            />
                        );
                    })}
                </div>

                {/* THE SUB-FEATURES GRID - REFINED ACCENTS */}
                <div className="mt-56 space-y-24">
                    <div className="text-center mb-40 space-y-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40 shadow-2xl"
                        >
                            <Layers size={14} className="text-primary/40" />
                            TACTICAL_KERNEL_EXTENSIONS
                        </motion.div>

                        <h2 className="text-[clamp(2.25rem,4.5vw,4.5rem)] font-display font-black text-white uppercase leading-[0.95] uppercase">
                            Deep <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-white/10">Augmentations.</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[...secondaryFeatures, ...secondaryFeatures].map((item, i) => {
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

            {/* LIGHTBOX MODAL - THE "REPORT" UI (Portaled for stability) */}
            <AnimatePresence>
                {selectedFeature && (
                    <FeaturePortal>
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedFeature(null)}
                                className="absolute inset-0 bg-black/95 backdrop-blur-3xl cursor-zoom-out"
                            />

                            <motion.div
                                layoutId={selectedFeature.uniqueId}
                                className="relative w-full max-w-5xl bg-[#050505] border border-white/10 rounded-[48px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,1)] flex flex-col md:flex-row z-10"
                            >
                                <div className="w-full md:w-[45%] aspect-square flex items-center justify-center relative p-16 md:p-24 overflow-hidden border-r border-white/5">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
                                    {(() => {
                                        const FeatureIcon = selectedFeature.icon;
                                        return <FeatureIcon size={160} strokeWidth={0.5} style={{ color: selectedFeature.color }} className="relative z-10 drop-shadow-[0_0_40px_rgba(217,119,6,0.2)]" />;
                                    })()}
                                    <div className="absolute bottom-12 left-12 right-12 font-mono text-[9px] text-zinc-800 uppercase tracking-[0.5em] text-center">
                                        Subsystem_ID: {selectedFeature.tag} // ARCHITECT_ONLY
                                    </div>
                                </div>

                                <div className="flex-1 p-10 md:p-16 space-y-10 relative overflow-hidden">
                                    <button onClick={() => setSelectedFeature(null)} className="absolute top-10 right-10 text-zinc-700 hover:text-white transition-colors">
                                        <X size={28} />
                                    </button>

                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 text-[11px] font-mono font-black uppercase tracking-[0.5em]" style={{ color: selectedFeature.color }}>
                                            <Activity size={12} className="animate-pulse" />
                                            Subsystem_Report_v4.02
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight leading-none">{selectedFeature.title}</h2>
                                    </div>

                                    <div className="space-y-12">
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.6em]">Core_Rationale</div>
                                            <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                                                <p className="text-zinc-300 text-xl leading-relaxed italic font-light relative z-10">&quot;{selectedFeature.desc}&quot;</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] font-mono font-black text-secondary uppercase tracking-[0.6em]">Technical_Nucleus // Execution</div>
                                            <div className="p-8 rounded-[32px] bg-secondary/5 border border-secondary/10 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <Terminal size={40} className="text-secondary" />
                                                </div>
                                                <pre className="text-secondary text-sm md:text-base font-mono leading-relaxed font-black whitespace-pre-wrap min-h-[4em]">
                                                    <code><Typewriter text={selectedFeature.code || `oraya --status ${selectedFeature.id?.toUpperCase() || 'CORE'}`} /></code>
                                                </pre>
                                                <div className="mt-8 pt-6 border-t border-secondary/10 flex items-center justify-between">
                                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{selectedFeature.stats || "LOAD_NOMINAL"}</span>
                                                    <span className="text-[10px] font-mono text-secondary/40 font-black">X_RECV_099</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/5 flex justify-between items-center bg-black/50 sticky bottom-0">
                                        <div className="flex gap-8">
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Clearance</div>
                                                <div className="text-[11px] font-mono text-white">SOVEREIGN_L5</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedFeature(null)} className="px-8 py-3 bg-primary text-black font-mono font-black text-xs uppercase tracking-widest hover:bg-white transition-colors rounded-xl shadow-[0_10px_30px_var(--primary-glow)]">Terminate_Report</button>
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

function BentoCard({ item, uniqueId, isHovered, onHover, onLeave, onClick }: any) {
    const isLarge = item.size === "large";
    const isWide = item.size === "wide";

    return (
        <motion.div
            layoutId={uniqueId}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
            className={cn(
                "relative group rounded-[40px] border border-white/5 bg-[#080808] overflow-hidden transition-all duration-700 cursor-pointer shadow-2xl",
                isLarge ? "md:col-span-2 md:row-span-2" : isWide ? "md:col-span-2" : "md:col-span-1"
            )}
        >
            {/* Dynamic Background Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none" style={{ backgroundColor: item.color }} />

            {/* Content Container */}
            <div className="p-10 h-full flex flex-col justify-between relative z-20">
                <div className="space-y-8">
                    {/* Header: Icon + Telemetry */}
                    <div className="flex justify-between items-start">
                        <div className="w-16 h-16 rounded-[24px] flex items-center justify-center border border-white/10 bg-black group-hover:border-[currentColor] group-hover:bg-[currentColor]/5 transition-all duration-700" style={{ color: item.color }}>
                            {(() => {
                                const ItemIcon = item.icon;
                                return <ItemIcon size={32} strokeWidth={1} />;
                            })()}
                        </div>

                        {/* Technical Telemetry Bits */}
                        <div className="hidden sm:block text-right space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                            {item.telemetry?.map((t: string, i: number) => (
                                <div key={i} className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">{t}</div>
                            ))}
                        </div>
                    </div>

                    <div>
                        {item.stats && <span className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-[0.5em] mb-4 block group-hover:text-zinc-500 transition-colors">{item.stats} // LOAD_NOMINAL</span>}
                        <h3 className="text-3xl font-sans font-black text-white tracking-tighter uppercase mb-4 leading-none">{item.title}</h3>
                        <p className="text-zinc-500 text-[15px] leading-relaxed max-w-[300px] group-hover:text-zinc-300 transition-colors font-light italic">&quot;{item.desc}&quot;</p>
                    </div>
                </div>

                {/* Bottom Bar: Interactive Cue */}
                <div className="flex items-center justify-between mt-12 bg-white/[0.02] border border-white/5 rounded-2xl p-4 group-hover:bg-white/[0.04] transition-colors">
                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] group-hover:text-white transition-colors">
                        View_Detailed_Spec
                    </div>
                    <ChevronRight size={16} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
            </div>

            {/* Visual Preview Layer - Deep Framing */}
            {item.visual && (
                <div className={cn("absolute opacity-20 group-hover:opacity-60 transition-all duration-1000", isLarge ? "right-[-15%] bottom-[-5%] w-[110%]" : "right-[-10%] bottom-[-5%] w-[100%]")}>
                    <div className="relative aspect-video rounded-tl-[60px] overflow-hidden border-t border-l border-white/10 shadow-[-40px_-40px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                        <Image src={item.visual} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-[4s] ease-out" />
                        {/* Edge masking */}
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
    return (
        <motion.div
            layoutId={uniqueId}
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.03 }}
            onClick={onClick}
            className="group relative p-10 rounded-[32px] bg-[#0A0A0A] border border-white/5 hover:border-[currentColor] hover:bg-white/[0.02] transition-all duration-700 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[280px]"
            style={{ color: item.color }}
        >
            {/* Background Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: 'currentColor' }} />

            <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 bg-black group-hover:border-[currentColor] group-hover:shadow-[0_0_30px_-5px_currentColor] transition-all duration-700">
                    <Icon size={28} strokeWidth={1} />
                </div>
                <div className="space-y-3">
                    <h4 className="text-white font-black text-xl uppercase tracking-tighter">{item.label}</h4>
                    <p className="text-zinc-600 text-sm leading-snug group-hover:text-zinc-400 transition-colors font-light">{item.desc}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-800 uppercase tracking-[0.5em] mt-8 group-hover:text-white transition-colors">
                L5_SPEC <ChevronRight size={14} className="group-hover:translate-x-1 transition-all" />
            </div>
        </motion.div>
    );
}

