"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Brain, Search, Moon, Clock, Palette, Sliders,
    RefreshCw, Network, Lightbulb, Bookmark, Layers, ScanSearch,
    Wand2, UserCog, Paintbrush, Settings2, Server, CloudOff,
    Wifi, Power, Bell, ChevronRight, Activity, Cpu, Binary, Target, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

const PILLARS = [
    {
        id: "research",
        label: "24/7_RESEARCH",
        icon: Search,
        color: "#00F0FF",
        headline: "She Researches While You Sleep.",
        tagline: "DREAM_MODE // VPS_RELAY",
        desc: "Oraya's AI auto-senses the importance of topics from your conversations and researches them in Dream Mode — indexing, synthesizing, and discovering patterns you'd never find manually.",
        stats: { value: "12,482", label: "RESEARCH_LOOPS", unit: "NODES" },
        features: [
            { icon: Moon, label: "Dream State Processing", detail: "Background indexing during idle time" },
            { icon: Server, label: "VPS Relay Driver", detail: "Research continues even when system is off" },
            { icon: Bell, label: "Gentle Nudge", detail: "Surfaces findings in your next conversation" },
        ],
        terminal: [
            "# Dream State activated — Session idle: 257m",
            "Auto-detected: 'Tauri desktop app' research target",
            "VPS Relay: Fetching documentation fragments...",
            "Cluster: 'auth_middleware ↔ rate_limiter' linked 23x",
            "✓ Nudge ready for next session.",
        ],
    },
    {
        id: "learning",
        label: "ADAPTIVE_BIAS",
        icon: Brain,
        color: "#FF00AA",
        headline: "Knows You Better Than You Know Yourself.",
        tagline: "REFLECTION // LEARNING_LOOP",
        desc: "Oraya builds a permanent neural model of your coding style, preferences, and decision history through a self-reflection system. She adapts to you, measured in metrics, not just text.",
        stats: { value: "94.7%", label: "STYLE_MATCH", unit: "CONFIDENCE" },
        features: [
            { icon: RefreshCw, label: "Self-Reflection", detail: "Quality scoring after every interaction" },
            { icon: Lightbulb, label: "Pattern Matching", detail: "Tabs vs Spaces, Naming, Architectural bias" },
            { icon: Activity, label: "Circadian Sync", detail: "Time-aware consciousness tracking" },
        ],
        terminal: [
            "# Neural model loaded: user_profile_v847",
            "Reflection #20 — Quality: 85%",
            "✓ Maintained persona across LLM changes",
            "Learning loop: Pattern confidence → 94.7%",
            "✓ Profile updated. Adapting responses...",
        ],
    },
    {
        id: "sovereignty",
        label: "SYSTEM_DOMINION",
        icon: Sliders,
        color: "#F0B429",
        headline: "Your OS. Your Rules. Always Local.",
        tagline: "ENCLAVE // PROTOCOL_L5",
        desc: "Nothing is hardcoded. Themes, agent personalities, security protocols, and model providers are all under your direct sovereign control. Oraya is your personal digital territory.",
        stats: { value: "ZERO", label: "CLOUD_LEAK", unit: "TELEMETRY" },
        features: [
            { icon: UserCog, label: "Agent Wizard", detail: "6-tab configuration: Identity → Provider" },
            { icon: Cpu, label: "Hardware Hooks", detail: "Direct GPU/File-system access L5" },
            { icon: Lock, label: "Vault Lockdown", detail: "Biometric key isolation as standard" },
        ],
        terminal: [
            "# Protocol: L5 — Full system access active",
            "Identity: ORA | Role: SYSTEM_ADMIN",
            "Security: Biometric key isolation verified",
            "Capabilities: God Mode, Memory, Agent Spawning",
            "✓ 47 custom parameters synced to local disk.",
        ],
    },
];

export default function ResearchMemory() {
    const [activePillar, setActivePillar] = useState(0);
    const [terminalLines, setTerminalLines] = useState(0);

    useEffect(() => {
        setTerminalLines(0);
        const total = PILLARS[activePillar].terminal.length;
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setTerminalLines(i);
            if (i >= total) clearInterval(interval);
        }, 300);
        return () => clearInterval(interval);
    }, [activePillar]);

    const ActivePillarIcon = PILLARS[activePillar].icon;

    return (
        <section className="py-24 md:py-48 bg-black relative overflow-hidden noise-overlay border-t border-white/5" id="intelligence">
            <div className="scanline" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">

                {/* ACT HEADER: The Intelligence Layer */}
                <div className="text-center mb-32 space-y-10">
                    <div className="flex flex-col items-center gap-6">
                        <motion.div
                            className="inline-flex items-center gap-3 px-5 py-2 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500"
                        >
                            <Brain size={14} className="text-[#FF00AA]" />
                            NEURAL_ATMOSPHERE_SYST
                        </motion.div>

                        <h2 className="text-6xl md:text-9xl font-sans font-black text-white tracking-tighter leading-[0.85] uppercase">
                            The AI That <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/50 to-[#FF00AA]">Never Stops.</span>
                        </h2>
                    </div>
                </div>

                {/* THE HUB CONTROL: Pillar Selectors */}
                <div className="flex flex-wrap justify-center gap-4 mb-20">
                    {PILLARS.map((pillar, i) => {
                        const PillarIcon = pillar.icon;
                        return (
                            <button
                                key={pillar.id}
                                onClick={() => setActivePillar(i)}
                                className={cn(
                                    "flex items-center gap-4 px-8 py-4 rounded-[24px] font-mono text-xs font-black uppercase tracking-[0.3em] transition-all duration-700 border relative overflow-hidden group",
                                    activePillar === i
                                        ? "bg-white/[0.05] border-white/20 text-white shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                                        : "bg-white/[0.01] border-white/5 text-zinc-600 hover:text-white"
                                )}
                            >
                                {activePillar === i && (
                                    <motion.div
                                        layoutId="pillar-bg"
                                        className="absolute inset-x-0 bottom-0 h-[2px]"
                                        style={{ background: pillar.color }}
                                    />
                                )}
                                <PillarIcon size={16} style={{ color: activePillar === i ? pillar.color : undefined }} />
                                {pillar.label}
                            </button>
                        );
                    })}
                </div>

                {/* THE CORE CONTENT: 2-Column High-Stakes UI */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">

                    {/* LEFT: Pillar Report */}
                    <div className="p-10 md:p-16 rounded-[48px] border border-white/5 bg-[#050505] flex flex-col justify-between space-y-12 relative overflow-hidden group">
                        {/* Status Watermark */}
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                            <ActivePillarIcon size={250} strokeWidth={0.5} style={{ color: PILLARS[activePillar].color }} />
                        </div>

                        <div className="space-y-10 relative z-10">
                            <div className="space-y-4">
                                <div className="text-[10px] font-mono font-black uppercase tracking-[0.6em]" style={{ color: PILLARS[activePillar].color }}>
                                    {PILLARS[activePillar].tagline}
                                </div>
                                <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                                    {PILLARS[activePillar].headline}
                                </h3>
                                <p className="text-xl text-zinc-500 font-light leading-relaxed uppercase tracking-tighter italic">
                                    &quot;{PILLARS[activePillar].desc}&quot;
                                </p>
                            </div>

                            {/* Feature Checklist */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                {PILLARS[activePillar].features.map((f, idx) => {
                                    const Icon = f.icon;
                                    return (
                                        <div key={idx} className="flex gap-4 items-start p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <Icon size={16} style={{ color: PILLARS[activePillar].color }} className="shrink-0 mt-1" />
                                            <div className="space-y-1">
                                                <div className="text-xs font-black text-white uppercase tracking-tight">{f.label}</div>
                                                <div className="text-[10px] text-zinc-600 font-light leading-tight">{f.detail}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Telemetry Block */}
                        <div className="pt-10 border-t border-white/5 flex items-center justify-between relative z-10">
                            <div className="space-y-1">
                                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">{PILLARS[activePillar].stats.label}</div>
                                <div className="text-3xl font-black text-white uppercase tracking-tighter">
                                    {PILLARS[activePillar].stats.value}
                                    <span className="text-xs text-zinc-500 ml-2">{PILLARS[activePillar].stats.unit}</span>
                                </div>
                            </div>
                            <ActivePillarIcon size={48} className="text-zinc-800" strokeWidth={1} />
                        </div>
                    </div>

                    {/* RIGHT: Live Kernel Execution Simulation */}
                    <div className="flex flex-col gap-6">
                        <div className="flex-1 rounded-[48px] border border-white/5 bg-[#050505] overflow-hidden flex flex-col shadow-2xl">
                            {/* Terminal Window Header */}
                            <div className="bg-[#111] px-8 py-5 border-b border-white/5 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                                    <div className="w-3 h-3 rounded-full bg-zinc-800" />
                                </div>
                                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.5em]">ORAYA_SHELL // {PILLARS[activePillar].id}</div>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: PILLARS[activePillar].color }} />
                            </div>

                            {/* Terminal Buffer */}
                            <div className="p-10 font-mono text-sm space-y-4 flex-1">
                                {PILLARS[activePillar].terminal.slice(0, terminalLines).map((line, lid) => (
                                    <motion.div
                                        key={lid}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "flex items-start gap-4",
                                            line.startsWith("#") ? "text-zinc-700" :
                                                line.startsWith("✓") ? "text-emerald-500" : "text-zinc-300"
                                        )}
                                    >
                                        <span style={{ color: PILLARS[activePillar].color }}>→</span>
                                        <span>{line.replace(/^[#✓]\s?/, "")}</span>
                                    </motion.div>
                                ))}
                                {terminalLines < PILLARS[activePillar].terminal.length && (
                                    <div className="flex items-center gap-3">
                                        <span style={{ color: PILLARS[activePillar].color }}>→</span>
                                        <div className="w-2 h-5 animate-pulse" style={{ background: PILLARS[activePillar].color }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tactical Status Strip */}
                        <div className="p-10 rounded-[40px] border border-white/5 bg-white/[0.01] flex items-center justify-between px-12">
                            <div className="flex items-center gap-6">
                                <Activity size={24} className="text-[#00F0FF]" />
                                <div>
                                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Heartbeat</div>
                                    <div className="text-white font-black uppercase text-sm tracking-widest">Active_Nominal</div>
                                </div>
                            </div>
                            <div className="h-10 w-[1px] bg-white/5" />
                            <div className="flex items-center gap-6">
                                <Target size={24} className="text-[#FF00AA]" />
                                <div>
                                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Targeting</div>
                                    <div className="text-white font-black uppercase text-sm tracking-widest">Global_Context</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
