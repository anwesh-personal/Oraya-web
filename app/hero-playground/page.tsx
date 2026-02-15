"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Cpu, Shield, Zap, Terminal, Database, Activity, Lock, Globe, Command, ChevronRight, Layout } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// --- OPTIONS DATA ---
const HERO_OPTIONS = [
    {
        id: "synaptic-command",
        title: "01 // SYNAPTIC_COMMAND",
        subtitle: "The Sovereign Hybrid",
        description: "The ultimate convergence: The Neural Constellation brain core surrounded by a rotating orbit of Tactical HUD shards. Biological intelligence meeting absolute command mastery.",
        image: "/neural_constellation_core_1771105349453.png",
        accent: "#10B981", // Emerald
        glow: "rgba(16, 185, 129, 0.2)"
    },
    {
        id: "kernel",
        title: "02 // THE HOLLOW KERNEL",
        subtitle: "The Stealthed Monolith",
        description: "A hyper-minimalist, translucent obsidian prism with laser-thin aged copper wireframe lines. It screams privacy and hardware isolation.",
        image: "/hollow_kernel_prism_1771105332710.png",
        accent: "#D97706", // Copper
        glow: "rgba(217, 119, 6, 0.2)"
    }
];

export default function HeroPlayground() {
    const [activeOption, setActiveOption] = useState(HERO_OPTIONS[0]);

    return (
        <main className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-primary selection:text-black font-sans antialiased">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(217,119,6,0.03)_0%,transparent_50%)]" />
                <div className="absolute inset-0 opacity-20 mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            {/* Navigation HUD */}
            <header className="fixed top-0 inset-x-0 z-50 p-6 md:p-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
                <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-black">O</div>
                        <div className="space-y-1">
                            <h1 className="text-sm font-black tracking-[0.4em] uppercase">HERO_LAB_v5.0</h1>
                            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">PHANTOM_ARCHITECT_RECON</p>
                        </div>
                    </div>
                    <Link href="/" className="px-6 py-2 border border-white/10 rounded-full text-[10px] font-mono text-zinc-400 hover:text-white hover:border-white/30 transition-all uppercase tracking-widest">
                        Exit_Lab
                    </Link>
                </div>
            </header>

            {/* Main Stage */}
            <div className="relative pt-40 pb-20 px-6 min-h-screen flex flex-col items-center">
                <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-20 items-center justify-center">

                    {/* LEFT: Information & Selector */}
                    <div className="w-full lg:w-1/3 space-y-12 z-10">
                        <div className="space-y-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeOption.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div className="inline-flex items-center gap-4 px-5 py-1.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                                        RECON_PHASE_ACTIVE
                                    </div>
                                    <h2 className="text-5xl font-display font-black tracking-tighter uppercase leading-[0.8]">
                                        {activeOption.subtitle.split(' ').map((word, i) => (
                                            <span key={i} className={i === 0 ? "text-white" : "text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 block"}>
                                                {word}{' '}
                                            </span>
                                        ))}
                                    </h2>
                                    <p className="text-zinc-500 font-extralight text-lg leading-relaxed uppercase tracking-tighter">
                                        {activeOption.description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Option Switches */}
                        <div className="grid grid-cols-1 gap-4">
                            {HERO_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setActiveOption(opt)}
                                    className={cn(
                                        "p-6 rounded-[24px] border text-left transition-all duration-500 group relative overflow-hidden",
                                        activeOption.id === opt.id
                                            ? "bg-white/[0.04] border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                                            : "bg-transparent border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex justify-between items-center relative z-10">
                                        <div className="space-y-1">
                                            <div className={cn(
                                                "text-[9px] font-mono uppercase tracking-[0.4em]",
                                                activeOption.id === opt.id ? "text-primary" : "text-zinc-700"
                                            )}>
                                                {opt.title}
                                            </div>
                                            <div className="text-sm font-black uppercase tracking-widest">{opt.subtitle}</div>
                                        </div>
                                        <ChevronRight size={16} className={cn(
                                            "transition-transform",
                                            activeOption.id === opt.id ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
                                        )} />
                                    </div>
                                    {activeOption.id === opt.id && (
                                        <motion.div
                                            layoutId="active-bg"
                                            className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent pointer-events-none"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: The Visual Stage */}
                    <div className="w-full lg:w-2/3 flex items-center justify-center relative min-h-[500px] md:min-h-[700px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeOption.id}
                                initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                exit={{ opacity: 0, scale: 1.1, rotateY: 10 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="relative w-full aspect-square md:aspect-video flex items-center justify-center"
                            >
                                {/* Stage Props */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--glow),transparent_70%)] opacity-30 pointer-events-none" style={{ '--glow': activeOption.glow } as any} />

                                {activeOption.id === "synaptic-command" ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        {/* Background Glow */}
                                        <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] pointer-events-none" />

                                        {/* The Brain Core */}
                                        <div className="relative z-10 w-[60%] h-[60%] md:w-[70%] md:h-[70%] lg:w-[80%] lg:h-[80%] flex items-center justify-center">
                                            <Image
                                                src="/neural_constellation_core_1771105349453.png"
                                                alt="Neural Constellation"
                                                width={800}
                                                height={800}
                                                className="w-full h-full object-contain filter brightness-110 drop-shadow-[0_0_80px_rgba(16,185,129,0.2)]"
                                            />
                                        </div>

                                        {/* The Orbiting HUD Shards */}
                                        <TacticalHUDStage isHybrid />
                                    </div>
                                ) : (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        {/* Decorative Ring */}
                                        <div className="absolute w-[80%] h-[80%] border border-white/5 rounded-full animate-spin-slow opacity-20" />

                                        <Image
                                            src={activeOption.image!}
                                            alt={activeOption.subtitle}
                                            width={800}
                                            height={800}
                                            className="w-[90%] h-[90%] object-contain drop-shadow-[0_0_100px_rgba(0,0,0,0.8)] filter brightness-110"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Selection Footer */}
            <footer className="fixed bottom-0 inset-x-0 p-10 z-50 pointer-events-none">
                <div className="max-w-[1400px] mx-auto flex justify-between items-end">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                            ))}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-800 uppercase tracking-[1em]">SYSTEM_CALIBRATION_READY</div>
                    </div>
                    <div className="pointer-events-auto">
                        <button className="px-12 py-5 bg-white text-black font-black uppercase tracking-[0.4em] text-xs rounded-2xl hover:bg-primary transition-all">
                            Initialize_Selection
                        </button>
                    </div>
                </div>
            </footer>
        </main>
    );
}

function TacticalHUDStage({ isHybrid = false }: { isHybrid?: boolean }) {
    return (
        <div className={cn(
            "absolute inset-0 flex items-center justify-center perspective-1000",
            isHybrid ? "z-20" : "relative h-full"
        )}>
            {/* Spinning Orbit Shards */}
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                    key={i}
                    animate={{
                        rotateY: [i * 72, i * 72 + 360],
                        rotateX: [20, 20],
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 2
                    }}
                    className="absolute w-[260px] md:w-[320px] h-32 md:h-40"
                    style={{ transformStyle: "preserve-3d" }}
                >
                    <div
                        className="absolute inset-0 bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex flex-col justify-between"
                        style={{ transform: "translateZ(350px) rotateX(-20deg)" }}
                    >
                        <div className="flex justify-between items-start">
                            <Activity size={12} className="text-primary" />
                            <div className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase">SHARD_0{i + 1}</div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: ["10%", "90%", "30%", "60%"] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="h-full bg-primary"
                                />
                            </div>
                            <div className="text-[9px] font-mono font-black text-white/20 uppercase tracking-widest">RELAY_SYNCING...</div>
                        </div>
                    </div>
                </motion.div>
            ))}

            {!isHybrid && (
                <div className="relative z-10 w-40 h-40 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse" />
                    <div className="relative w-full h-full rounded-full border border-primary/40 flex items-center justify-center shadow-[inset_0_0_30px_rgba(217,119,6,0.2)]">
                        <Cpu size={48} className="text-primary animate-pulse" />
                    </div>
                </div>
            )}
        </div>
    );
}
