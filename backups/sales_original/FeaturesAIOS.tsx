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
        title: "Neural Indexing",
        headline: "Total Knowledge Recall.",
        desc: "Oraya builds a living semantic graph across your entire stack. It never forgets context.",
        icon: Database,
        color: "#00F0FF",
        visual: "/assets/screenshots/ss2.png",
        stats: "12.4M Nodes",
        telemetry: ["8.2 GB Graph Size", "Sub-2ms Lookup", "78% Persistence"],
        payload: "Advanced vector-embedding engine using local Ollama/Llama-based models for semantic graph construction.",
        edge: "Everything you've ever typed, coded, or researched is indexed locally. You don't search for code; you recall it with zero latency."
    },
    {
        id: "execution",
        size: "medium",
        title: "Self-Healing",
        headline: "Autonomous Loops.",
        desc: "25-turn execution cycles with native terminal control.",
        icon: Workflow,
        color: "#FF00AA",
        stats: "Sub-12ms",
        telemetry: ["25-Turn Max", "Auto-Retry active", "Fail-Safe L3"],
        payload: "Native Rust execution kernel with auto-retry and state-aware recovery protocols.",
        edge: "Oraya doesn't just fail and stop. It analyzes the error, modifies the code, and re-executes until the mission is successful."
    },
    {
        id: "privacy",
        size: "medium",
        title: "Sovereign Shield",
        headline: "Hardware Privacy.",
        desc: "100% on-device weights. Biological isolation.",
        icon: Shield,
        color: "#10B981",
        stats: "E2EE",
        telemetry: ["Zero Cloud I/O", "HSM Isolation", "E2EE Rotating"],
        payload: "Secure enclave weight distribution with zero cloud-outbound traffic for logic processing.",
        edge: "Your IP is your edge. Oraya ensures it never touches a cloud server, preventing training leakage and corporate espionage."
    },
    {
        id: "dominion",
        size: "wide",
        title: "Kernel Dominion",
        headline: "God Mode for Your Machine.",
        desc: "Bypass the browser. Direct hooks into your terminal, filesystem, and GPU.",
        icon: Terminal,
        color: "#F0B429",
        visual: "/assets/screenshots/ss6.png",
        telemetry: ["Direct Syscall", "GPU Metal/CUDA", "Root Tunnel"],
        payload: "Direct system-level integration bypasses browser sandboxes for high-performance compute access.",
        edge: "Stop being limited by Chrome. Oraya talks directly to your hardware for sub-millisecond response times and full OS control."
    }
];

const secondaryFeatures = [
    {
        icon: Users,
        label: "Multi-Agent System",
        desc: "Spawn and command specialized agents for parallel execution.",
        color: "#FF00AA",
        payload: "Orchestration layer managing ephemeral sub-agents based on task complexity analysis.",
        edge: "You stop being a coder and start being a commander. Trigger a 5-agent parallel refactor while you watch."
    },
    {
        icon: MessageSquare,
        label: "Telegram Neuro-Link",
        desc: "Command your agents via Telegram while you're off the grid.",
        color: "#00F0FF",
        payload: "Secure bi-directional relay between Oraya Core and the Telegram Bot API.",
        edge: "Your AI shouldn't have a leash. Command builds, check status, and get proactive alerts from your phone. Anytime. Anywhere."
    },
    {
        icon: Database,
        label: "Hybrid Privacy Core",
        desc: "Local SQLite + Supabase Postgres for absolute 24/7 sovereignty.",
        color: "#10B981",
        payload: "Dual-layer storage with E2EE. Local for privacy, Supabase for 24/7 autonomous persistence.",
        edge: "The privacy of a ghost, the power of a cluster. Research runs 24/7 on the cloud, but your IP stays on your disk."
    },
    {
        icon: Workflow,
        label: "Proactive Autonomy",
        desc: "Autonomous 'bakchodiyaan'—he fixes things before you ask.",
        color: "#F0B429",
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
        <section className="py-24 md:py-48 bg-black relative overflow-hidden noise-overlay" id="aios-features">
            <div className="scanline" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                {/* ACT HEADER: Architectural Subsystems */}
                <div className="mb-32 space-y-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-[#00F0FF]"
                            >
                                <ScanLine size={14} className="animate-pulse" />
                                SYSTEM_ORCHESTRATION_V2.04
                            </motion.div>

                            <h2 className="text-5xl md:text-8xl font-sans font-black text-white tracking-tighter leading-[0.85] uppercase">
                                The First <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/50 to-white/10">Sovereign OS.</span>
                            </h2>
                        </div>

                        <div className="max-w-md space-y-4">
                            <p className="text-zinc-500 font-light text-lg uppercase tracking-tighter">
                                Unlike "AI Tools" that live in a tab, Oraya is a <span className="text-white">Resident Intelligence</span> that owns the machine.
                            </p>
                            <div className="flex gap-4 font-mono text-[9px] text-[#00F0FF]/40 uppercase tracking-[0.2em]">
                                <span>$ grep -r "sovereignty" /core</span>
                                <span className="animate-pulse">_</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* THE BENTO GRID - HIGH DENSITY */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

                {/* THE SUB-FEATURES GRID - 16 MODULES (REPLICATING ORIGINAL HIGH COUNT) */}
                <div className="mt-32 space-y-16">
                    <div className="flex items-center gap-8">
                        <h3 className="text-3xl md:text-5xl font-sans font-black text-white uppercase tracking-tighter shrink-0">
                            Tactical <span className="text-[#00F0FF]">Augmentations.</span>
                        </h3>
                        <div className="h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                                    {/* Subtle Grid Background in Modal */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
                                    {(() => {
                                        const FeatureIcon = selectedFeature.icon;
                                        return <FeatureIcon size={160} strokeWidth={0.5} style={{ color: selectedFeature.color }} className="relative z-10 drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]" />;
                                    })()}
                                    <div className="absolute bottom-12 left-12 right-12 font-mono text-[9px] text-zinc-800 uppercase tracking-[0.5em] text-center">
                                        Hardware_ID: 0x{Math.floor(Math.random() * 10000000).toString(16)} // TYPE: SOVEREIGN
                                    </div>
                                </div>

                                <div className="flex-1 p-10 md:p-20 space-y-12 relative overflow-y-auto max-h-[90vh]">
                                    <button onClick={() => setSelectedFeature(null)} className="absolute top-10 right-10 text-zinc-700 hover:text-white transition-colors">
                                        <X size={28} />
                                    </button>

                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 text-[11px] font-mono font-black uppercase tracking-[0.5em]" style={{ color: selectedFeature.color }}>
                                            <Activity size={12} className="animate-pulse" />
                                            Subsystem_Report_3.02
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-sans font-black text-white uppercase tracking-tighter leading-none">{selectedFeature.title || selectedFeature.label}</h2>
                                        {selectedFeature.headline && <p className="text-2xl text-zinc-500 font-light tracking-tight">{selectedFeature.headline}</p>}
                                    </div>

                                    <div className="space-y-12">
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.6em]">System_Guts</div>
                                            <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    {(() => {
                                                        const FeatureIcon = selectedFeature.icon;
                                                        return <FeatureIcon size={80} />;
                                                    })()}
                                                </div>
                                                <p className="text-zinc-300 text-xl leading-relaxed italic font-light relative z-10">&quot;{selectedFeature.payload}&quot;</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="text-[10px] font-mono font-black text-[#00F0FF] uppercase tracking-[0.6em]">The_Edge</div>
                                            <div className="p-8 rounded-[32px] bg-[#00F0FF]/5 border border-[#00F0FF]/10">
                                                <p className="text-zinc-100 text-xl leading-relaxed font-normal">{selectedFeature.edge}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/5 flex justify-between items-center bg-black/50 sticky bottom-0">
                                        <div className="flex gap-8">
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Clearance</div>
                                                <div className="text-[11px] font-mono text-white">SOVEREIGN_L5</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Origin</div>
                                                <div className="text-[11px] font-mono text-white">ORAYA_CORE_v4</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedFeature(null)} className="px-8 py-3 bg-white text-black font-mono font-black text-xs uppercase tracking-widest hover:bg-[#F0B429] transition-colors rounded-xl">Terminate_Module</button>
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

