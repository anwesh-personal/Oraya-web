"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Shield, Zap, Activity, Cpu, Terminal, Binary, HelpCircle, HardDrive, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const COMPARISON_DATA = [
    {
        feature: "Execution Model",
        detail: "Native kernel hooks vs sandboxed web-wrappers.",
        oraya: "Native Kernel",
        chatgpt: "Cloud Only",
        cursor: "Process Wrap",
        claude: "Web Snapshot",
        spec: "Direct syscall access via Rust backend. bypassing the 200ms browser latency tax."
    },
    {
        feature: "Auto-Control",
        detail: "Direct terminal and file system command.",
        oraya: "OS Dominion",
        chatgpt: "None (Text)",
        cursor: "API Only",
        claude: "Sandboxed",
        spec: "25-turn autonomous loops with real-time error recovery and environment sensing."
    },
    {
        feature: "Privacy Shield",
        detail: "Biological isolation of weights and logic.",
        oraya: "100% Local",
        chatgpt: "Extraction",
        cursor: "Telemetry",
        claude: "Training",
        spec: "E2EE per-session key rotation. Your IP never leaves the physical RAM of your machine."
    },
    {
        feature: "Memory Horizon",
        detail: "Infinite neural shards vs sliding windows.",
        oraya: "Neural Persistence",
        chatgpt: "Session",
        cursor: "Global Window",
        claude: "Limited",
        spec: "Local Vector database with 2M+ token cold-storage and 50ms rehydration."
    },
    {
        feature: "Agent Swarm",
        detail: "Spawn sovereign specialist agents.",
        oraya: "Specialists",
        chatgpt: "Single Thread",
        cursor: "Static",
        claude: "Chat Bot",
        spec: "Parallel execution on 5+ specialized sub-agents with shared context relay."
    },
    {
        feature: "Latency",
        detail: "Sub-12ms native execution speed.",
        oraya: "Sub-12ms",
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
            "STATUS: oraya_dominion_stable_v4.2"
        ];
        let i = 0;
        const interval = setInterval(() => {
            setTerminalLines(prev => [...prev.slice(-4), logs[i % logs.length]]);
            i++;
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 md:py-48 bg-black relative overflow-hidden noise-overlay" id="scorecard">
            <div className="scanline" />

            {/* High-Fidelity Atmosphere */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,#F0B42903_0%,transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20" />

                {/* Floating Neural Shards */}
                <motion.div
                    animate={{ y: [0, -20, 0], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] right-[10%] w-64 h-64 bg-[#F0B429] blur-[120px] rounded-full"
                />
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">
                {/* Header Section with Live Telemetry */}
                <div className="text-center mb-32 space-y-10">
                    <div className="flex flex-col items-center gap-4">
                        <motion.div
                            className="inline-flex items-center gap-3 px-5 py-2 bg-[#F0B429]/10 border border-[#F0B429]/30 rounded-full font-mono text-[11px] font-black uppercase tracking-[0.4em] text-[#F0B429] backdrop-blur-3xl shadow-[0_0_40px_rgba(240,180,41,0.1)]"
                        >
                            <span className="w-2 h-2 rounded-full bg-[#F0B429] animate-pulse" />
                            INTELLIGENCE_DOMINION_PROTOCOL
                        </motion.div>

                        {/* Live Terminal Header */}
                        <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest h-4 overflow-hidden">
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

                    <h2 className="text-6xl md:text-8xl lg:text-9xl font-sans font-black text-white tracking-tighter leading-[0.85] uppercase">
                        Absolute <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#F0B429]">Authority.</span>
                    </h2>

                    <p className="text-zinc-500 font-light text-xl md:text-2xl max-w-3xl mx-auto uppercase tracking-tighter">
                        Why settle for a <span className="text-white font-normal italic">wrapper</span> when you can own the <span className="text-[#F0B429] font-bold">kernel</span>?
                    </p>
                </div>

                {/* THE MATRIX: PRISTINE READABILITY + YELLOW ORAYA HIGHLIGHT */}
                <div className="relative rounded-[40px] md:rounded-[60px] bg-white/[0.01] border border-white/5 overflow-visible backdrop-blur-3xl">
                    <div className="w-full">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="p-8 sm:p-12 w-[35%] sm:w-[32%]">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] sm:text-[11px] font-mono font-black text-zinc-500 uppercase tracking-[0.6em]">SYSTEM_AXIS</span>
                                            <div className="h-[1px] w-12 bg-[#F0B429]/40" />
                                        </div>
                                    </th>

                                    {/* ORAYA HEADER COLUMN - THE SLAB */}
                                    <th className="p-0 relative w-[25%] sm:w-[28%] overflow-visible">
                                        <div className="absolute -top-16 -bottom-16 left-[-4px] right-[-4px] bg-[#0A0A0A] border-[1px] border-white/10 rounded-[32px] md:rounded-[48px] z-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,1)]">
                                            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#F0B429] to-transparent opacity-50" />
                                            <div className="absolute inset-0 bg-[#F0B429]/[0.02] rounded-[inherit]" />
                                        </div>

                                        <div className="relative z-20 p-10 sm:p-14 flex flex-col items-center justify-center gap-6">
                                            <motion.div
                                                whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
                                                className="relative"
                                            >
                                                <Image
                                                    src="/logos/oraya-light.png"
                                                    alt="Oraya"
                                                    width={160}
                                                    height={55}
                                                    className="h-10 sm:h-14 w-auto object-contain brightness-150 grayscale invert"
                                                    style={{ filter: "drop-shadow(0 0 15px rgba(240,180,41,0.4))" }}
                                                />
                                            </motion.div>
                                            <div className="bg-[#F0B429] text-black px-4 py-1 rounded-sm text-[10px] font-mono font-black uppercase tracking-[0.4em] shadow-[0_0_20px_rgba(240,180,41,0.3)]">
                                                Active_Kernel
                                            </div>
                                        </div>
                                    </th>

                                    <th className="p-8 sm:p-12 text-center w-[13.33%] sm:w-[13.33%]">
                                        <div className="space-y-4">
                                            <span className="text-[11px] font-mono font-black text-zinc-600 uppercase tracking-widest block">Model_01</span>
                                            <span className="text-[13px] sm:text-[16px] font-black text-white/40 uppercase tracking-tighter">GPT-4o</span>
                                        </div>
                                    </th>

                                    <th className="p-8 sm:p-12 text-center w-[13.33%] sm:w-[13.33%]">
                                        <div className="space-y-4">
                                            <span className="text-[11px] font-mono font-black text-zinc-600 uppercase tracking-widest block">Spec_02</span>
                                            <span className="text-[13px] sm:text-[16px] font-black text-white/40 uppercase tracking-tighter">CURSOR</span>
                                        </div>
                                    </th>

                                    <th className="hidden sm:table-cell p-8 sm:p-12 text-center w-[13.33%]">
                                        <div className="space-y-4">
                                            <span className="text-[11px] font-mono font-black text-zinc-600 uppercase tracking-widest block">Node_03</span>
                                            <span className="text-[13px] sm:text-[16px] font-black text-white/40 uppercase tracking-tighter">CLAUDE</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON_DATA.map((row, i) => (
                                    <motion.tr
                                        key={i}
                                        onMouseEnter={() => setHoveredRow(i)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                        className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-all duration-300 group/row"
                                    >
                                        <td className="p-10 sm:p-14 relative overflow-hidden">
                                            <div className="relative z-10 space-y-3">
                                                <h4 className="text-[16px] sm:text-[20px] font-black text-white uppercase tracking-tight group-hover/row:text-[#F0B429] transition-colors leading-none">{row.feature}</h4>
                                                <p className="text-[12px] sm:text-[14px] text-zinc-500 font-sans font-light leading-snug group-hover/row:text-zinc-300 transition-all uppercase tracking-tight max-w-[280px]">{row.detail}</p>
                                            </div>

                                            {/* Spec Details on Hover */}
                                            <AnimatePresence>
                                                {hoveredRow === i && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        className="absolute bottom-4 left-14 text-[9px] font-mono text-[#F0B429] uppercase tracking-widest max-w-[250px]"
                                                    >
                                                        {`>> ${row.spec}`}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </td>

                                        {/* ORAYA DATA - THE GOLD STANDARD */}
                                        <td className="p-0 relative">
                                            <div className={cn(
                                                "relative z-20 p-10 sm:p-14 flex flex-col items-center justify-center transition-all duration-500 h-full border-x-[1px] border-white/5",
                                                hoveredRow === i ? "bg-[#F0B429]/10 shadow-[inset_0_0_60px_rgba(240,180,41,0.15)]" : ""
                                            )}>
                                                <div className="relative">
                                                    <Check size={32} className="text-[#F0B429] mb-4" strokeWidth={5} />
                                                    <div className="absolute inset-0 blur-[15px] bg-[#F0B429]/50 animate-pulse" />
                                                </div>
                                                <span className="text-[15px] sm:text-[18px] font-black text-[#F0B429] uppercase tracking-tight text-center leading-tight drop-shadow-2xl">{row.oraya}</span>
                                            </div>
                                        </td>

                                        <td className="p-8 sm:p-14 text-center opacity-40 group-hover/row:opacity-80 transition-all duration-500">
                                            <div className="flex flex-col items-center gap-4">
                                                <X size={20} className="text-zinc-800" strokeWidth={4} />
                                                <span className="text-[14px] sm:text-[16px] font-black text-white uppercase tracking-tighter leading-tight">{row.chatgpt}</span>
                                            </div>
                                        </td>

                                        <td className="p-8 sm:p-14 text-center opacity-40 group-hover/row:opacity-100 transition-all duration-500 border-l border-white/[0.03]">
                                            <div className="flex flex-col items-center gap-4">
                                                <X size={20} className="text-zinc-800" strokeWidth={4} />
                                                <span className="text-[14px] sm:text-[16px] font-black text-white uppercase tracking-tighter leading-tight">{row.cursor}</span>
                                            </div>
                                        </td>

                                        <td className="hidden sm:table-cell p-8 sm:p-14 text-center opacity-40 group-hover/row:opacity-100 transition-all duration-500 border-l border-white/[0.03]">
                                            <div className="flex flex-col items-center gap-4">
                                                <X size={20} className="text-zinc-800" strokeWidth={4} />
                                                <span className="text-[14px] sm:text-[16px] font-black text-white uppercase tracking-tighter leading-tight">{row.claude}</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Status Ribbons - Premium Tactical Hardware */}
                <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-10">
                    <StatusMetric icon={HardDrive} label="NATIVE_DRIVE" value="Kernel_Lvl" desc="Zero proxy layer between LLM and hardware." color="#F0B429" />
                    <StatusMetric icon={ShieldAlert} label="ISO_VAULT" value="Biological" desc="Proprietary local-only weight distribution." color="#F0B429" />
                    <StatusMetric icon={Terminal} label="AUTO_DOMINION" value="God Mode" desc="100% control over terminal and file-ops." color="#F0B429" />
                </div>
            </div>
        </section>
    );
}

function StatusMetric({ icon: Icon, label, value, desc, color }: { icon: any, label: string, value: string, desc: string, color: string }) {
    return (
        <div className="group p-10 rounded-[40px] border border-white/5 bg-white/[0.01] flex items-center gap-8 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={120} strokeWidth={0.5} style={{ color }} />
            </div>

            <div className="w-20 h-20 shrink-0 rounded-3xl bg-black flex items-center justify-center text-zinc-800 group-hover:text-white border border-white/5 group-hover:border-[#F0B429]/40 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative z-10">
                <Icon size={40} strokeWidth={1} />
            </div>

            <div className="relative z-10">
                <div className="text-[11px] font-mono text-zinc-600 uppercase tracking-[0.4em] mb-2">{label}</div>
                <div className="text-[24px] font-sans font-black text-white uppercase tracking-tight mb-1 group-hover:text-[#F0B429] transition-colors">{value}</div>
                <div className="text-[13px] font-sans text-zinc-500 leading-snug font-light uppercase tracking-tighter">{desc}</div>
            </div>
        </div>
    );
}
