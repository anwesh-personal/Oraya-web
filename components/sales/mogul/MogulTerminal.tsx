"use client";

import { motion } from "framer-motion";
import { Terminal, Cpu, Zap, Activity, Globe, Shield } from "lucide-react";
import { useState, useEffect } from "react";

const CODE_LINES = [
    "[SYSTEM] initializing_dominion_kernel_v4.02...",
    "[NETWORK] routing_nodes_via_l5_enclave",
    "[SECURITY] ring-0_isolation_established",
    "[ENCRYPTION] 4096-bit_quantum_shield_active",
    "[ORCHESTRA] waking_swarm_mara_v4",
    "[ORCHESTRA] waking_swarm_ova_synthesis",
    "[MARKET] scanning_high-status_leads_pipeline",
    "[BYPASS] cloud_subscription_tax_terminated",
    "[MARKET] executing_cognitive_transformation",
    "[DATA] local_weights_hosting_active",
    "[DATA] sync_complete_in_12.4ms",
    "[RESULT] DOMINION_ACTIVE"
];

export default function MogulTerminal() {
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i < CODE_LINES.length) {
                setLines(prev => [...prev, CODE_LINES[i]]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 bg-black relative overflow-hidden noise-overlay">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                    {/* The Copy Side */}
                    <div className="lg:col-span-5 space-y-10 order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-4 px-6 py-2 bg-primary/10 border border-primary/20 rounded-full font-mono text-[10px] font-black text-primary uppercase tracking-[0.5em]"
                        >
                            <Terminal size={14} /> TACTICAL_COMMAND_CORE
                        </motion.div>

                        <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-display font-black text-white leading-[0.95] uppercase">
                            The raw logic <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white/20 italic">of leverage.</span>
                        </h2>

                        <p className="text-xl text-zinc-500 font-extralight leading-relaxed max-w-xl">
                            Oraya doesn&apos;t just run apps. It executes **Sovereign Directives**. Watch the kernel bypass the cloud tax and establish Ring-0 dominance on your own hardware.
                        </p>

                        <div className="flex flex-wrap gap-8 pt-6">
                            <div className="space-y-2">
                                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Latency</div>
                                <div className="text-2xl font-black text-primary italic">0.12ms</div>
                            </div>
                            <div className="w-[1px] h-12 bg-white/10" />
                            <div className="space-y-2">
                                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Efficiency</div>
                                <div className="text-2xl font-black text-primary italic">84X</div>
                            </div>
                        </div>
                    </div>

                    {/* The Sexy Terminal Side */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-7 relative group perspective-3000 order-1 lg:order-2"
                    >
                        {/* Chromatic Aberration Shadow */}
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000" />

                        {/* 3D Container */}
                        <div className="relative rounded-[40px] bg-[#0A0A0A] border border-white/10 shadow-[0_80px_160px_-40px_rgba(0,0,0,1)] overflow-hidden transition-all duration-1000 group-hover:border-primary/50 group-hover:-rotate-y-12 group-hover:rotate-x-3 group-hover:scale-[1.02]">

                            {/* Window Header */}
                            <div className="h-14 bg-white/[0.03] border-b border-white/5 flex items-center px-8 justify-between">
                                <div className="flex gap-2">
                                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-[10px] font-mono text-primary font-black uppercase tracking-[0.2em] animate-pulse">
                                        RING-0_ISOLATION::ACTIVE
                                    </div>
                                    <div className="h-4 w-[1px] bg-white/10" />
                                    <div className="flex items-center gap-3 text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
                                        <Shield size={10} /> session::enclave_x
                                    </div>
                                </div>
                            </div>

                            {/* Terminal Buffer */}
                            <div className="p-12 font-mono text-xs md:text-sm h-[450px] overflow-hidden relative group/buffer">
                                {/* SCANLINE OVERLAY */}
                                <div className="absolute inset-0 scanline opacity-40 pointer-events-none z-30" />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent pointer-events-none" />

                                <div className="space-y-5 relative z-10">
                                    {lines.map((line, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -15, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                            className="flex gap-6 items-start group/line"
                                        >
                                            <span className="text-zinc-800 tabular-nums font-black opacity-40 group-hover/line:text-primary transition-colors">{(idx + 1).toString().padStart(2, '0')}</span>
                                            <span className={cn(
                                                "tracking-wider transition-all duration-300",
                                                line?.includes("SYSTEM") ? "text-primary drop-shadow-[0_0_8px_var(--primary-glow)]" :
                                                    line?.includes("RESULT") ? "text-emerald-400 font-bold tracking-[0.2em]" :
                                                        line?.includes("BYPASS") ? "text-secondary italic" :
                                                            "text-white/70"
                                            )}>
                                                {line || ""}
                                            </span>
                                        </motion.div>
                                    ))}
                                    <motion.div
                                        animate={{ opacity: [1, 0, 1] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className="inline-block w-2.5 h-5 bg-primary shadow-[0_0_15px_var(--primary-glow)] ml-14"
                                    />
                                </div>

                                {/* Floating HUD Elements - More Sexy */}
                                <div className="absolute bottom-12 right-12 flex flex-col items-end gap-5 pointer-events-none">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="flex items-center gap-5 px-8 py-4 bg-primary/10 border border-primary/30 rounded-[24px] glass-card backdrop-blur-3xl shadow-[0_0_40px_rgba(240,180,41,0.1)]"
                                    >
                                        <Activity size={20} className="text-primary animate-pulse" />
                                        <div className="text-left">
                                            <div className="text-[10px] font-mono text-primary uppercase font-black tracking-widest">Neural_Load</div>
                                            <div className="text-xl font-black text-white italic">0.02ms_LATENCY</div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="flex items-center gap-5 px-8 py-4 bg-white/[0.03] border border-white/10 rounded-[24px] glass-card shadow-2xl"
                                    >
                                        <Cpu size={20} className="text-white/40" />
                                        <div className="text-left">
                                            <div className="text-[10px] font-mono text-white/40 uppercase font-black tracking-widest">Sovereignty_Tier</div>
                                            <div className="text-xl font-black text-white italic">ABSOLUTE</div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                        {/* External Hardware Elements */}
                        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute top-1/2 -rotate-90 -left-12 origin-center text-[10px] font-mono text-white/10 uppercase tracking-[1em]">TACTICAL_INTERFACE_X5</div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// Helper for conditional classes if not already available in scope
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
