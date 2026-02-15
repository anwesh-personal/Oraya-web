"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Cpu, Shield, Zap, Terminal, Database, Link, Sparkles,
    Workflow, Brain, Monitor, Activity, Lock, Layers,
    Eye, ChevronRight, X, Globe, Fingerprint, Users,
    MessageSquare, Network, GitBranch, Boxes, BarChart3, ScanLine, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
    {
        id: "tactical-gold",
        name: "Tactical Gold // The Origin",
        primary: "#F0B429",
        secondary: "#00F0FF",
        bg: "#020202",
        surface: "#080808",
        accent: "rgba(240, 180, 41, 0.4)",
        fontDisplay: "font-display",
        fontMono: "font-mono",
        aesthetic: "Industrial, High-Status, Sovereign",
        animation: "Parallax & Scanning Lines"
    },
    {
        id: "ghost-protocol",
        name: "Ghost Protocol // The Stealth",
        primary: "#10B981",
        secondary: "#64748B",
        bg: "#020617",
        surface: "#0f172a",
        accent: "rgba(16, 185, 129, 0.4)",
        fontDisplay: "font-sans",
        fontMono: "font-mono",
        aesthetic: "Military-Spec, Covert, Minimal",
        animation: "Glitch & Rapid Terminal"
    },
    {
        id: "neural-pulse",
        name: "Neural Pulse // The Sentient",
        primary: "#8B5CF6",
        secondary: "#EC4899",
        bg: "#0F172A",
        surface: "#1e293b",
        accent: "rgba(139, 92, 246, 0.4)",
        fontDisplay: "font-display",
        fontMono: "font-mono",
        aesthetic: "Futuristic, Fluid, Ethereal",
        animation: "Liquid Motion & Glow Pulse"
    },
    {
        id: "monolithic-raw",
        name: "Monolithic Raw // The Engineer",
        primary: "#FFFFFF",
        secondary: "#D1D5DB",
        bg: "#000000",
        surface: "#111111",
        accent: "rgba(255, 255, 255, 0.4)",
        fontDisplay: "font-display",
        fontMono: "font-mono",
        aesthetic: "Brutalist, Raw, Authoritative",
        animation: "Rigid Geometric & Brute Scale"
    },
    {
        id: "copper-sovereign",
        name: "Copper Sovereign // The Architect",
        primary: "#D97706",
        secondary: "#9CA3AF",
        bg: "#111827",
        surface: "#1f2937",
        accent: "rgba(217, 119, 6, 0.4)",
        fontDisplay: "font-display",
        fontMono: "font-mono",
        aesthetic: "Vintage-Industrial, Sophisticated, Warm",
        animation: "Warm Glows & Depth Blurs"
    },
    {
        id: "phantom-architect",
        name: "Phantom Architect // The Shadow Archive",
        primary: "#D97706", // Copper Hero
        secondary: "#10B981", // Ghost Emerald (The 20% Influence)
        bg: "#050505", // Warmer Obsidian
        surface: "#0c0c0c",
        accent: "rgba(217, 119, 6, 0.25)",
        fontDisplay: "font-display",
        fontMono: "font-mono",
        aesthetic: "Copper-Dominant Stealth, Monolithic, Warm Depth",
        animation: "Slow Amber Pulses & Muted Telemetry"
    }
];

export default function DesignPlayground() {
    const [activeTheme, setActiveTheme] = useState(THEMES[0]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div
            className="min-h-screen py-20 px-6 transition-colors duration-1000 overflow-hidden relative"
            style={{ backgroundColor: activeTheme.bg, color: activeTheme.primary }}
        >
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="max-w-[1400px] mx-auto relative z-10">
                {/* THEME SWITCHER HUD */}
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex gap-2 p-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => setActiveTheme(theme)}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-[10px] font-mono font-black uppercase tracking-widest transition-all duration-500 border",
                                activeTheme.id === theme.id
                                    ? "bg-white text-black border-white shadow-[0_0_20px_white]"
                                    : "bg-transparent text-white/40 border-transparent hover:text-white"
                            )}
                        >
                            {theme.id.split('-').join('_')}
                        </button>
                    ))}
                </div>

                {/* HEADER DEMO */}
                <div className="mb-40 space-y-10 text-center pt-20">
                    <motion.div
                        key={activeTheme.id + "-badge"}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="inline-flex items-center gap-3 px-8 py-3 rounded-full border border-white/40 font-mono text-[14px] font-black uppercase tracking-[0.4em] glass shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                        style={{ color: activeTheme.id === 'phantom-architect' ? activeTheme.secondary : activeTheme.primary }}
                    >
                        <ScanLine size={16} className="animate-pulse" />
                        SYSTEM_AESTHETIC_REPORT // {activeTheme.id.toUpperCase().replace('-', '_')}
                    </motion.div>

                    <motion.h1
                        key={activeTheme.id + "-h1"}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className={cn(activeTheme.fontDisplay, "text-[clamp(2.25rem,7.5vw,7.5rem)] font-black uppercase tracking-tighter leading-[0.8] mb-12")}
                    >
                        <span className="opacity-60 block mb-4 text-[0.4em] tracking-[0.2em] font-mono">Behold the</span>
                        <span
                            className="text-transparent bg-clip-text bg-[length:200%_auto] animate-gradient-x"
                            style={{ backgroundImage: `linear-gradient(135deg, ${activeTheme.primary} 0%, ${activeTheme.primary} 60%, ${activeTheme.secondary} 100%)` }}
                        >
                            Architectural <br /> Dominion.
                        </span>
                    </motion.h1>

                    <div className="space-y-8">
                        <p className="text-xl md:text-3xl font-sans font-extralight max-w-4xl mx-auto uppercase tracking-wider opacity-60">
                            Design System: <span className="text-white font-bold">{activeTheme.name}</span> <br />
                        </p>

                        {/* THE LINE: Clearly visible with depth effect */}
                        <div
                            className="h-px w-64 mx-auto relative overflow-hidden"
                            style={{ backgroundColor: `${activeTheme.primary}20` }}
                        >
                            <motion.div
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
                                style={{
                                    '--tw-gradient-via': activeTheme.primary,
                                    boxShadow: `0 0 15px ${activeTheme.primary}`
                                } as any}
                            />
                        </div>

                        <p className="text-[10px] font-mono opacity-80 tracking-[0.4em] uppercase font-black">
                            Aesthetic: {activeTheme.aesthetic} // Anim: {activeTheme.animation}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* LEFT SIDE: CARDS & UI ELEMENTS */}
                    <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* FEATURE CARD */}
                        <motion.div
                            key={activeTheme.id + "-card1"}
                            whileHover={{ y: -10 }}
                            className="p-12 rounded-[48px] border border-white/5 transition-all duration-700 relative overflow-hidden group"
                            style={{ backgroundColor: activeTheme.surface }}
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-1000" style={{ backgroundColor: activeTheme.primary }} />
                            <div className="relative z-10 space-y-8">
                                <div className="w-16 h-16 rounded-[24px] flex items-center justify-center border border-white/10 bg-black group-hover:scale-110 transition-transform duration-700" style={{ color: activeTheme.primary }}>
                                    <Shield size={32} strokeWidth={1} />
                                </div>
                                <div>
                                    <h3 className={cn(activeTheme.fontDisplay, "text-3xl font-black uppercase tracking-tight text-white")}>Sovereign Security</h3>
                                    <p className="text-zinc-500 mt-4 leading-relaxed font-light italic">"Hardware-level verification for every byte and packet transmitted."</p>
                                </div>
                                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Protocol L5</span>
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </motion.div>

                        {/* STAT CARD */}
                        <motion.div
                            key={activeTheme.id + "-card2"}
                            className="p-12 rounded-[48px] border border-white/10 flex flex-col justify-center items-center text-center space-y-6"
                            style={{ backgroundImage: `radial-gradient(circle at center, ${activeTheme.primary}10, transparent 70%)` }}
                        >
                            <div className="font-mono text-xs opacity-40 tracking-[0.5em] uppercase">Reflex_Latency</div>
                            <div
                                className={cn(activeTheme.fontDisplay, "text-[8rem] font-black leading-none tracking-tighter")}
                                style={{ color: 'white', textShadow: `0 0 60px ${activeTheme.primary}40` }}
                            >
                                12<span className="text-2xl font-mono align-top mt-10 ml-2">MS</span>
                            </div>
                            <div className="h-px w-24 bg-white/10" />
                            <div className="text-sm font-mono uppercase tracking-[0.2em]" style={{ color: activeTheme.secondary }}>Biological Speed</div>
                        </motion.div>

                        {/* SYSTEM LOGS / TERMINAL */}
                        <div
                            className="p-10 rounded-[40px] border border-white/5 bg-black/40 backdrop-blur-3xl font-mono text-[13px] leading-relaxed space-y-4"
                        >
                            <div className="flex items-center gap-3 pb-4 border-b border-white/5 mb-6">
                                <Activity size={14} style={{ color: activeTheme.primary }} className="animate-pulse" />
                                <span className="opacity-40 uppercase tracking-[0.4em]">Kernel_Stream_Monitor</span>
                            </div>
                            <div className="space-y-2.5 opacity-90">
                                <p><span style={{ color: activeTheme.primary }}>[08:44:12]</span> INIT_SOVEREIGN_RECOVERY...</p>
                                <p><span style={{ color: activeTheme.id === 'phantom-architect' ? '#10B981' : activeTheme.secondary }}>[08:44:13]</span> HANDSHAKE_SUCCESSFUL (sf_node_01)</p>
                                <p><span className="text-white font-bold animate-pulse">[08:44:15]</span> NEURAL_PERSISTENCE_SYNC: 84%</p>
                                <p style={{ color: activeTheme.primary }}>[08:44:17] DEPLOYING_GHOST_PROTOCOL_V4</p>
                                <p className="text-zinc-600 italic">// Waiting for architect input...</p>
                            </div>
                        </div>
                    </div>

                    {/* BUTTONS & SMALL UI */}
                    <div className="lg:col-span-12 flex flex-wrap justify-center gap-12 pt-20">
                        <button
                            className="px-12 py-5 rounded-[24px] font-mono font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 shadow-2xl hover:scale-105 active:scale-95"
                            style={{ backgroundColor: activeTheme.primary, color: 'black', boxShadow: `0 20px 80px -20px ${activeTheme.primary}60` }}
                        >
                            Deploy Engine
                        </button>

                        <button
                            className="px-12 py-5 rounded-[24px] font-mono font-black text-xs uppercase tracking-[0.4em] transition-all border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white"
                        >
                            Read Manifesto
                        </button>

                        <div className="flex items-center gap-6 px-8 py-4 rounded-full border border-white/5 bg-white/[0.01]">
                            <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeTheme.primary }} />
                            <span className="text-[10px] font-mono font-bold tracking-[0.5em] opacity-40 uppercase">System_Nominal</span>
                        </div>
                    </div>
                </div>

                {/* THEMATIC DESCRIPTION */}
                <div className="mt-40 pt-40 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-20">
                    <div className="space-y-8">
                        <h4 className={cn(activeTheme.fontDisplay, "text-5xl font-black text-white uppercase tracking-tighter")}>Rationale.</h4>
                        <p className="text-xl text-zinc-500 font-light leading-relaxed italic">
                            "Every aesthetic decision here is a strategic signal. We aren't just choosing colors; we're choosing which frequency the Architect operates on."
                        </p>
                    </div>
                    <div className="space-y-12">
                        <div className="space-y-2">
                            <div className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Primary_Variable</div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: activeTheme.primary }} />
                                <span className="font-mono text-xl">{activeTheme.primary}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Secondary_Variable</div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: activeTheme.secondary }} />
                                <span className="font-mono text-xl">{activeTheme.secondary}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* THEMATIC AMBIENCE EFFECTS */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTheme.id + "-ambient"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2 }}
                    className="fixed inset-0 pointer-events-none z-0"
                >
                    <div
                        className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[150px] opacity-10"
                        style={{ backgroundColor: activeTheme.primary }}
                    />
                    <div
                        className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[150px] opacity-10"
                        style={{ backgroundColor: activeTheme.secondary }}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
