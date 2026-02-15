"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, HardDrive, ShieldAlert, Terminal, HelpCircle, Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const COMPARISON_DATA = [
    {
        feature: "Execution Model",
        detail: "Native kernel hooks vs sandboxed web-wrappers.",
        oraya: "Native Rust Engine",
        chatgpt: "Public Proxy",
        cursor: "Electron Wrap",
        claude: "Web Snapshot",
        spec: "Direct syscall access via Rust backend bypassing the 200ms browser latency tax."
    },
    {
        feature: "Auto-Control",
        detail: "Direct terminal and file system command.",
        oraya: "L5 Dominion",
        chatgpt: "None (Text)",
        cursor: "API Only",
        claude: "Sandboxed",
        spec: "Autonomous loops with real-time environment sensing and hardware-level reflexes."
    },
    {
        feature: "Privacy Shield",
        detail: "Biological isolation of weights and logic.",
        oraya: "100% Local Enclave",
        chatgpt: "Data Extraction",
        cursor: "Telemetry",
        claude: "Model Training",
        spec: "E2EE per-session key rotation. Your IP never leaves the physical RAM of your machine."
    },
    {
        feature: "Memory Horizon",
        detail: "Neural shards vs sliding windows.",
        oraya: "Infinite Recall",
        chatgpt: "Goldfish Memory",
        cursor: "Global Window",
        claude: "Limited",
        spec: "Local Vector database with 2M+ token cold-storage and 50ms rehydration."
    },
    {
        feature: "Agent Swarm",
        detail: "Sovereign specialist deployment.",
        oraya: "Sovereign Swarm",
        chatgpt: "Single Thread",
        cursor: "Static Bot",
        claude: "Chat Bot",
        spec: "Parallel execution on 5+ specialized sub-agents with shared context relay."
    },
    {
        feature: "Latency",
        detail: "Sub-12ms native execution speed.",
        oraya: "Biological Speed",
        chatgpt: "Global 3s+",
        cursor: "Local 500ms",
        claude: "Web 5s+",
        spec: "In-memory processing logic. No global round-trips for tokenization or inference."
    }
];

export default function SovereigntyScorecard() {
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    useEffect(() => {
        const logs = [
            "KERNEL: initializing_sovereign_core...",
            "SUCCESS: hardware_isolation_active",
            "SCANNING: competitor_logic_leaks... detected",
            "ROUTING: sub_synaptic_pathway_established",
            "STATUS: oraya_dominion_stable_v5.0_GOLD"
        ];
        let i = 0;
        const interval = setInterval(() => {
            setTerminalLines(prev => [...prev.slice(-4), logs[i % logs.length]]);
            i++;
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-12 md:py-24 bg-transparent relative" id="scorecard">
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">

                {/* ─── HEADER: THE AUTHORITY ───────────────────────────────── */}
                <div className="text-center mb-20 space-y-12">
                    <div className="flex flex-col items-center gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            INTELLIGENCE_DOMINION_PROTOCOL
                        </motion.div>

                        <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-[0.4em] h-4 overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={terminalLines.length}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {terminalLines[terminalLines.length - 1]}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <h2 className="text-[clamp(2.6rem,8vw,8rem)] font-display font-black text-white leading-[0.9] uppercase tracking-tighter">
                        Absolute <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10">Authority.</span>
                    </h2>
                </div>

                {/* ─── THE GRID: GRID-BASED ARCHITECTURE (NO TABLE CLIPPING) ────── */}
                <div className="relative pt-32 pb-12">

                    {/* Background Slab */}
                    <div className="absolute inset-x-0 top-0 bottom-0 bg-surface-50/50 rounded-[48px] border border-white/[0.05] shadow-2xl -z-10" />

                    {/* Matrix Headers */}
                    <div className="grid grid-cols-1 md:grid-cols-12 w-full border-b border-white/[0.05]">
                        <div className="col-span-full md:col-span-4 p-8 md:p-14 border-b md:border-b-0 md:border-r border-white/5">
                            <div className="space-y-4">
                                <span className="text-[10px] font-mono font-black text-zinc-200 uppercase tracking-[0.6em] block">SYSTEM_AXIS</span>
                                <div className="h-[2px] w-12 bg-primary/60" />
                            </div>
                        </div>

                        {/* ORAYA MONOLITH HEADER */}
                        <div className="col-span-full md:col-span-3 relative px-8 md:px-0">
                            {/* The Monolith Slab Elevation - High Performance & High Fidelity */}
                            <div className="absolute -top-32 bottom-0 left-[-4px] right-[-4px] bg-surface-0 border-x border-t border-primary/30 rounded-t-[56px] z-20 shadow-[0_-60px_120px_-20px_rgba(245,158,11,0.2)] overflow-hidden">
                                {/* Apex Light Beam - Softened Glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-primary z-30 shadow-[0_0_20px_var(--primary)]" />

                                {/* Polish Highlight Overlay */}
                                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent opacity-40" />

                                {/* Scanning Ray (Low Cost Performance) */}
                                <motion.div
                                    animate={{ y: ["-100%", "200%"] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-x-0 h-px bg-primary/10 pointer-events-none"
                                />
                            </div>

                            <div className="relative z-30 p-10 md:p-14 flex flex-col items-center gap-6 h-full justify-center">
                                <Image
                                    src="/logos/oraya-light.png"
                                    alt="Oraya"
                                    width={160}
                                    height={55}
                                    className="h-10 md:h-16 w-auto object-contain brightness-150 contrast-125 select-none"
                                />
                                <div className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[9px] font-mono font-black uppercase tracking-[0.4em]">
                                    Active_Kernel
                                </div>
                            </div>
                        </div>

                        {/* COMPETITORS HEADERS */}
                        <div className="col-span-full md:col-span-5 grid grid-cols-3">
                            <CompetitorHeader model="GPT-4o" label="Model_01" />
                            <CompetitorHeader model="CURSOR" label="Spec_02" />
                            <CompetitorHeader model="CLAUDE" label="Node_03" />
                        </div>
                    </div>

                    {/* Matrix Body Rows */}
                    <div className="relative">
                        {COMPARISON_DATA.map((row, i) => (
                            <div
                                key={i}
                                onMouseEnter={() => setHoveredRow(i)}
                                onMouseLeave={() => setHoveredRow(null)}
                                className="grid grid-cols-1 md:grid-cols-12 w-full border-b border-white/[0.03] group/row transition-all duration-700 ease-[0.16,1,0.3,1] hover:bg-white/[0.02]"
                            >
                                {/* Left Feature Description */}
                                <div className="col-span-full md:col-span-4 p-8 md:p-16 border-b md:border-b-0 md:border-r border-white/5 space-y-4">
                                    <h4 className="text-xl md:text-2xl font-black text-white uppercase group-hover/row:text-primary transition-colors duration-500">{row.feature}</h4>
                                    <p className="text-sm text-zinc-500 font-sans font-light uppercase tracking-tight max-w-sm">{row.detail}</p>

                                    <AnimatePresence>
                                        {hoveredRow === i && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="pt-4 flex items-start gap-3"
                                            >
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                                <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest leading-relaxed">
                                                    {row.spec}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* ORAYA DATA - THE MONOLITH CELL */}
                                <div className="col-span-full md:col-span-3 relative p-10 md:p-0">
                                    <div className="absolute inset-0 bg-surface-0 border-x border-primary/30 z-20 group-hover/row:bg-primary/[0.04] transition-all duration-700 ease-[0.16,1,0.3,1]" />
                                    <div className="relative z-30 h-full flex flex-col items-center justify-center p-10 md:p-16 gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                            <Check className="text-primary" size={24} strokeWidth={4} />
                                        </div>
                                        <span className="text-lg md:text-xl font-black text-primary uppercase text-center">{row.oraya}</span>
                                    </div>
                                </div>

                                {/* COMPETITOR DATA CELLS */}
                                <div className="col-span-full md:col-span-5 grid grid-cols-3">
                                    <CompetitorCell value={row.chatgpt} />
                                    <CompetitorCell value={row.cursor} border />
                                    <CompetitorCell value={row.claude} border />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* The Monolith Base (Bottom Rounding) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 w-full">
                        <div className="col-span-full md:col-start-5 md:col-span-3 relative h-12">
                            <div className="absolute inset-0 bg-surface-0 border-x border-b border-primary/30 rounded-b-[48px] z-20 shadow-[0_45px_100px_rgba(0,0,0,0.8)]" />
                        </div>
                    </div>
                </div>

                {/* ─── FOOTER: THE METRICS ───────────────────────────────── */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10">
                    <StatusMetric icon={HardDrive} label="NATIVE_DRIVE" value="Kernel_Lvl" desc="Zero proxy layer between LLM and hardware." />
                    <StatusMetric icon={ShieldAlert} label="ISO_VAULT" value="Biological" desc="Proprietary local-only weight distribution." />
                    <StatusMetric icon={Terminal} label="AUTO_DOMINION" value="God Mode" desc="100% control over terminal and file-ops." />
                </div>
            </div>
        </section>
    );
}

function CompetitorHeader({ model, label }: { model: string, label: string }) {
    return (
        <div className="p-8 md:p-14 flex flex-col items-center justify-center border-l border-white/5 opacity-40">
            <span className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-widest block mb-4">{label}</span>
            <span className="text-base md:text-lg font-black text-white/40 uppercase">{model}</span>
        </div>
    );
}

function CompetitorCell({ value, border }: { value: string, border?: boolean }) {
    return (
        <div className={cn(
            "p-10 md:p-16 flex flex-col items-center justify-center gap-6 opacity-20 transition-all duration-700 group-hover/row:opacity-100",
            border && "border-l border-white/5"
        )}>
            <X className="text-zinc-800" size={20} strokeWidth={3} />
            <span className="text-sm md:text-base font-black text-white uppercase italic text-center leading-tight">{value}</span>
        </div>
    );
}

function StatusMetric({ icon: Icon, label, value, desc }: { icon: any, label: string, value: string, desc: string }) {
    return (
        <div className="group p-10 rounded-[48px] border border-white/5 bg-[#0A0A0A] hover:bg-white/[0.03] transition-all duration-700 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={160} strokeWidth={0.5} className="text-primary" />
            </div>
            <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-700 group-hover:text-primary transition-all duration-500">
                    <Icon size={32} strokeWidth={1} />
                </div>
                <div>
                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] mb-2">{label}</div>
                    <div className="text-2xl font-black text-white uppercase mb-2 group-hover:text-primary transition-colors">{value}</div>
                    <p className="text-sm text-zinc-500 font-light uppercase leading-snug">{desc}</p>
                </div>
            </div>
        </div>
    );
}
