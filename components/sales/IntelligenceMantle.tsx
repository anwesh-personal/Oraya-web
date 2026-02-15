"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
    GitBranch, GitMerge, Boxes, Sparkles, Brain,
    ChevronRight, Network, Zap, Shield, Fingerprint, Activity, Users
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const SUPERPOWERS = [
    {
        id: "handover",
        title: "Neural Handover",
        headline: "Context Continuity.",
        desc: "Ora synthesizes her own logical trail, passing a high-density summary to the next session for absolute context continuity. Zero knowledge loss.",
        icon: GitBranch,
        color: "var(--primary)",
        stats: "CONTINUITY_L5",
        code: `await ora.handover.summarize();\n// Context relay initiated...`,
        telemetry: ["Context Shard", "State Relay", "Ora Summary"],
        glow: "rgba(240, 180, 41, 0.4)",
        visual: "/assets/Assets/brain_resonance.png"
    },
    {
        id: "synthesis",
        title: "Multiverse Synthesis",
        headline: "Combined Thread Logic.",
        desc: "Fuse disparate conversation timelines into a unified intelligence shard. Launch new, hyper-focused directives from combined historical data.",
        icon: GitMerge,
        color: "#00F0FF",
        stats: "SYNTH_ACTIVE",
        code: `oraya.multiverse.fuse([chat1, chat2]);\n// Intelligence shard extracted`,
        telemetry: ["Cross-Chat Bias", "Logic Fusion", "Shard Export"],
        glow: "rgba(0, 240, 255, 0.4)",
        visual: "/assets/Assets/brain_tactical.png"
    },
    {
        id: "universe",
        title: "Closed Universe",
        headline: "Efficiency Isolation.",
        desc: "Initiate isolated compute sessions for specialized repositories. Manage multiple workspaces in one logical thread for maximum focus and zero leakage.",
        icon: Boxes,
        color: "#10B981",
        stats: "UNIVERSE_LOCKED",
        code: `session.initiate("CLOSED_UNIVERSE");\n// Workspaces: [Repo_A, Repo_B]`,
        telemetry: ["Zero Leakage", "Isolated Compute", "Workspace Fluidity"],
        glow: "rgba(16, 185, 129, 0.4)",
        visual: "/assets/Assets/brain_tactical1Black.png"
    },
    {
        id: "agency",
        title: "Autonomous Agency",
        headline: "Thought to Execution.",
        desc: "Oraya doesn't just suggest; it executes. Autonomously refactor technical debt and patch security leaks while you architect the future.",
        icon: Zap,
        color: "#FF3366",
        stats: "AGENCY_ENGAGED",
        code: `brain.takeAction();\n// Mission: SELF_HEAL_L5_SUCCESS`,
        telemetry: ["Autonomous Agency", "Direct Patch", "L5 Dominion"],
        glow: "rgba(255, 51, 102, 0.4)",
        visual: "/assets/Assets/transparent_brain1.png"
    }
];

export default function IntelligenceMantle() {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1.1, 1]);

    return (
        <section
            id="intelligence"
            ref={sectionRef}
            className="relative min-h-screen bg-[#050505] py-20 md:py-32 overflow-hidden"
        >
            {/* ─── ACT I: THE LARGER THAN LIFE ENTRANCE ────────────────────────── */}
            <div className="absolute inset-0 z-0">
                <motion.div style={{ y, scale }} className="relative w-full h-full">
                    <Image
                        src="/assets/Assets/anwesh-ai-team.jpeg"
                        alt="The Intelligence Team"
                        fill
                        className="object-cover opacity-20 grayscale brightness-50"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
                </motion.div>

                {/* Tactical Overlays */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(240,180,41,0.05)_0%,transparent_70%)]" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                {/* ─── SECTION HEADER ─────────────────────────────────────────── */}
                <div className="space-y-6 md:space-y-8 mb-16 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-4 px-4 md:px-6 py-2 bg-white/[0.03] border border-white/10 rounded-full w-fit backdrop-blur-xl"
                    >
                        <Network size={12} className="text-primary animate-pulse" />
                        <span className="text-[9px] md:text-[10px] font-mono text-white/50 font-black uppercase tracking-[0.4em] md:tracking-[0.6em]">Neural_Mantle_v5.0</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-[clamp(4rem,10vw,10rem)] font-display font-black text-white leading-[0.8] uppercase tracking-tighter"
                    >
                        Higher <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white animate-shimmer bg-[length:200%_auto]">
                            Intelligence.
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        viewport={{ once: true }}
                        className="max-w-2xl text-lg md:text-3xl text-zinc-500 font-extralight uppercase leading-tight tracking-tight"
                    >
                        Oraya is more than software. It is a <span className="text-white font-medium italic">Sentient Architect</span> that evolves with your logic.
                    </motion.p>
                </div>

                {/* ─── THE POSSE HERO SHOWCASE ─────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative mb-24 md:mb-40 group"
                >
                    <div className="relative aspect-square md:aspect-[21/9] rounded-[32px] md:rounded-[48px] overflow-hidden border border-white/10 bg-[#080808] shadow-2xl">
                        <Image
                            src="/assets/Assets/anwesh-ai-team.jpeg"
                            alt="The Posse"
                            fill
                            className="object-cover grayscale brightness-50 md:brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000 scale-105 group-hover:scale-100"
                        />

                        {/* Dramatic Lighting Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent" />

                        {/* Scanning Line Animation */}
                        <motion.div
                            animate={{ y: ["-100%", "300%"] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-x-0 h-[100px] bg-gradient-to-b from-transparent via-primary/10 to-transparent blur-xl pointer-events-none"
                        />

                        {/* Metadata Tags (Floating) */}
                        <div className="absolute top-6 md:top-10 left-6 md:left-10 flex flex-col gap-3">
                            <div className="px-4 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-[9px] md:text-[10px] font-mono text-white/40 tracking-[0.4em] uppercase">
                                Swarm_Status: <span className="text-primary animate-pulse">SYNCHRONIZED</span>
                            </div>
                            <div className="px-4 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-[9px] md:text-[10px] font-mono text-white/40 tracking-[0.4em] uppercase">
                                Chassis_Sync: 06_NODES
                            </div>
                        </div>

                        {/* Posse Branding */}
                        <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-4 text-primary font-mono text-[9px] font-black uppercase tracking-[0.4em]">
                                    <Users size={12} />
                                    The_Sovereign_Posse
                                </div>
                                <h3 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
                                    A Collective of <br />
                                    Resident Intelligence.
                                </h3>
                            </div>
                            <div className="hidden md:block text-right space-y-2">
                                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Architectural_Directives</div>
                                <div className="flex gap-2 justify-end">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                animate={{ x: ["-100%", "100%"] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                                                className="h-full w-1/2 bg-primary/40"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Atmospheric Glow behind the showcase */}
                    <div className="absolute -inset-20 bg-primary/5 blur-[120px] rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                </motion.div>

                {/* ─── SUPERPOWER GRID / HORIZONTAL SCROLL ON MOBILE ──────────── */}
                <div className="relative">
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-10 md:pb-0 snap-x snap-mandatory no-scrollbar">
                        {SUPERPOWERS.map((power, i) => (
                            <div key={power.id} className="min-w-[85vw] md:min-w-0 snap-center">
                                <PowerCard power={power} index={i} />
                            </div>
                        ))}
                    </div>
                    {/* Mobile Scroll Indicator */}
                    <div className="flex md:hidden justify-center gap-2 mt-4">
                        {SUPERPOWERS.map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-white/20" />
                        ))}
                    </div>
                </div>

                {/* ─── THE ARCHITECT'S PROMISE ────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 md:mt-40 p-8 md:p-14 rounded-[32px] md:rounded-[48px] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-3xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 md:p-12 opacity-[0.03] md:opacity-5">
                        <Fingerprint size={120} className="text-white md:w-[200px] md:h-[200px]" />
                    </div>

                    <div className="relative z-10 max-w-3xl space-y-6 md:space-y-8">
                        <div className="flex items-center gap-3 md:gap-4 text-primary font-mono text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">
                            <Activity size={12} />
                            Continuity_Verified
                        </div>
                        <h3 className="text-2xl md:text-5xl font-display font-black text-white uppercase tracking-tight leading-tight">
                            &quot;The Intelligence must be absolute. No context left behind. No logic left unverified.&quot;
                        </h3>
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden border border-white/20">
                                <Image
                                    src="/assets/Assets/anwesh-logo.webp"
                                    alt="Anwesh Logo"
                                    width={64}
                                    height={64}
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <div className="text-white font-black text-sm md:text-base uppercase tracking-tight">Anwesh Rath</div>
                                <div className="text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Founder & System Architect</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function PowerCard({ power, index }: { power: any, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group relative h-[450px] md:h-[500px] rounded-[32px] border border-white/5 bg-[#080808] overflow-hidden transition-all duration-700 hover:border-white/20"
        >
            {/* Atmosphere */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-1000"
                style={{ background: power.glow }}
            />

            {/* Visual Header */}
            <div className="relative h-2/5 md:h-1/2 overflow-hidden border-b border-white/5 bg-[#050505]">
                <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
                    <Image
                        src={power.visual}
                        alt={power.title}
                        fill
                        className="object-contain p-8 md:p-12 animate-pulse"
                    />
                </div>
                <div className="absolute top-6 md:top-8 left-6 md:left-8">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-black shadow-2xl overflow-hidden group-hover:scale-110 transition-transform duration-500">
                        <power.icon size={20} className="md:w-6 md:h-6" style={{ color: power.color }} strokeWidth={1.5} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 space-y-4 flex flex-col h-3/5 md:h-1/2 justify-between">
                <div className="space-y-2">
                    <div className="text-[9px] md:text-[10px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: power.color }}>
                        {power.headline}
                    </div>
                    <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">{power.title}</h4>
                    <p className="text-zinc-500 text-xs md:text-sm leading-relaxed font-light">{power.desc}</p>
                </div>

                <div className="pt-4 md:pt-6 border-t border-white/5 flex items-center justify-between group-hover:pt-4 transition-all">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-zinc-800 uppercase tracking-widest">Telemetry:</span>
                        <span className="text-[9px] md:text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">{power.stats}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-mono text-primary font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        Access <ChevronRight size={14} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
