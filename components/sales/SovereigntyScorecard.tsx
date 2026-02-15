"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
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

import { ResponsiveSwitcher } from "./responsive/ResponsiveSwitcher";

export default function SovereigntyScorecard() {
    const [activeRow, setActiveRow] = useState(0);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);
    const [isHoveredManually, setIsHoveredManually] = useState(false);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.2 });

    useEffect(() => {
        if (!isInView || isHoveredManually || hoveredRow !== null) return;

        const cycle = setInterval(() => {
            setActiveRow((prev) => (prev + 1) % COMPARISON_DATA.length);
        }, 6000);

        return () => clearInterval(cycle);
    }, [isInView, isHoveredManually, hoveredRow]);

    useEffect(() => {
        if (!isInView) return;
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
    }, [isInView]);

    const desktopView = (
        <div className="relative pt-32 pb-12">
            {/* Background Slab */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-surface-50/50 rounded-[48px] border border-white/[0.05] shadow-2xl -z-10" />

            {/* Matrix Headers */}
            <div className="grid grid-cols-12 w-full border-b border-white/[0.05]">
                <div className="col-span-4 p-14 border-r border-white/5">
                    <div className="space-y-4">
                        <span className="text-[10px] font-mono font-black text-zinc-200 uppercase tracking-[0.6em] block">SYSTEM_AXIS</span>
                        <div className="h-[2px] w-12 bg-primary/60" />
                    </div>
                </div>

                {/* ORAYA MONOLITH HEADER */}
                <div className="col-span-3 relative">
                    <div className="absolute -top-32 bottom-0 left-[-4px] right-[-4px] bg-surface-0 border-x border-t border-primary/30 rounded-t-[56px] z-20 shadow-[0_-60px_120px_-20px_rgba(245,158,11,0.2)] overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-primary z-30 shadow-[0_0_20px_var(--primary)]" />
                        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 via-primary/[0.02] to-transparent opacity-40" />
                        {isInView && (
                            <motion.div
                                animate={{ y: ["-100%", "200%"] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-x-0 h-px bg-primary/10 pointer-events-none"
                            />
                        )}
                    </div>
                    <div className="relative z-30 p-14 flex flex-col items-center gap-6 h-full justify-center">
                        <Image src="/logos/oraya-light.png" alt="Oraya" width={160} height={55} className="h-16 w-auto object-contain brightness-150 contrast-125 select-none" />
                        <div className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[9px] font-mono font-black uppercase tracking-[0.4em]">Active_Kernel</div>
                    </div>
                </div>

                {/* COMPETITORS HEADERS */}
                <div className="col-span-5 grid grid-cols-3">
                    <CompetitorHeader model="GPT-4o" label="Model_01" />
                    <CompetitorHeader model="CURSOR" label="Spec_02" />
                    <CompetitorHeader model="CLAUDE" label="Node_03" />
                </div>
            </div>

            {/* Matrix Body Rows */}
            <div className="relative">
                {COMPARISON_DATA.map((row, i) => (
                    <div key={i} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} className="grid grid-cols-12 w-full border-b border-white/[0.03] group/row transition-all duration-700 ease-[0.16,1,0.3,1] hover:bg-white/[0.02]">
                        <div className="col-span-4 p-16 border-r border-white/5 space-y-4">
                            <h4 className="text-2xl font-black text-white uppercase group-hover/row:text-primary transition-colors duration-500">{row.feature}</h4>
                            <p className="text-sm text-zinc-500 font-sans font-light uppercase tracking-tight max-w-sm">{row.detail}</p>
                            <AnimatePresence>
                                {(hoveredRow === i || activeRow === i) && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="pt-4 flex items-start gap-3">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                        <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest leading-relaxed">{row.spec}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="col-span-3 relative">
                            <div className={cn("absolute inset-0 bg-surface-0 border-x border-primary/30 z-20 transition-all duration-700 ease-[0.16,1,0.3,1]", (activeRow === i || hoveredRow === i) ? "bg-primary/[0.08]" : "group-hover/row:bg-primary/[0.04]")} />
                            {activeRow === i && !isHoveredManually && !hoveredRow && (
                                <motion.div className="absolute right-0 top-0 bottom-0 w-1 bg-primary z-30 opacity-40" layoutId="scorecard-indicator" initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 6, ease: "linear" }} />
                            )}
                            <div className="relative z-30 h-full flex flex-col items-center justify-center p-16 gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                    <Check className="text-primary" size={24} strokeWidth={4} />
                                </div>
                                <span className="text-xl font-black text-primary uppercase text-center">{row.oraya}</span>
                            </div>
                        </div>
                        <div className="col-span-5 grid grid-cols-3">
                            <CompetitorCell value={row.chatgpt} isActive={activeRow === i || hoveredRow === i} />
                            <CompetitorCell value={row.cursor} isActive={activeRow === i || hoveredRow === i} border />
                            <CompetitorCell value={row.claude} isActive={activeRow === i || hoveredRow === i} border />
                        </div>
                    </div>
                ))}
            </div>

            {/* Monolith Base */}
            <div className="grid grid-cols-12 w-full">
                <div className="col-start-5 col-span-3 relative h-12">
                    <div className="absolute inset-0 bg-surface-0 border-x border-b border-primary/30 rounded-b-[48px] z-20 shadow-[0_45px_100px_rgba(0,0,0,0.8)]" />
                </div>
            </div>
        </div>
    );

    const mobileView = (
        <div className="space-y-8 mt-12 pb-12">
            {COMPARISON_DATA.map((row, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-[40px] bg-white/[0.02] border border-white/5 overflow-hidden shadow-2xl"
                >
                    <div className="p-8 border-b border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight">{row.feature}</h4>
                            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] font-mono font-black uppercase tracking-widest">
                                Critical_Metric
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 font-sans font-light uppercase tracking-tight">{row.detail}</p>
                    </div>

                    {/* Oraya Advantage */}
                    <div className="p-8 bg-surface-0 border-y border-primary/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/[0.02]" />
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <Check className="text-primary" size={24} strokeWidth={4} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-mono text-primary font-black uppercase tracking-widest">ORAYA_SOVEREIGN</span>
                                <div className="text-lg font-black text-white uppercase tracking-tight">{row.oraya}</div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-primary/10">
                            <p className="text-[10px] font-mono text-zinc-400 uppercase leading-relaxed tracking-wider italic">
                                &quot;{row.spec}&quot;
                            </p>
                        </div>
                    </div>

                    {/* Competitor Status */}
                    <div className="p-8 space-y-6">
                        <div className="text-[9px] font-mono text-zinc-600 font-black uppercase tracking-[0.3em]">Competitor_Analysis // High_Friction</div>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { name: "GPT-4o", value: row.chatgpt },
                                { name: "Cursor", value: row.cursor },
                                { name: "Claude", value: row.claude }
                            ].map((comp, idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="text-[8px] font-mono text-zinc-500 uppercase text-center font-bold tracking-widest">{comp.name}</div>
                                    <div className="flex flex-col items-center gap-2">
                                        <X className="text-zinc-800" size={14} strokeWidth={3} />
                                        <div className="text-[8px] font-black text-zinc-500 uppercase text-center leading-tight line-clamp-2 italic">{comp.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    return (
        <section ref={containerRef} onMouseEnter={() => setIsHoveredManually(true)} onMouseLeave={() => setIsHoveredManually(false)} className="py-12 md:py-24 bg-transparent relative" id="scorecard">
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="text-center mb-12 md:mb-20 space-y-8 md:space-y-12">
                    <div className="flex flex-col items-center gap-6">
                        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-4 px-5 md:px-7 py-2 md:py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-white/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            INTELLIGENCE_DOMINION_PROTOCOL
                        </motion.div>
                        <div className="font-mono text-[9px] md:text-[10px] text-zinc-600 uppercase tracking-[0.3em] md:tracking-[0.4em] h-4 overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div key={terminalLines.length} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    {terminalLines[terminalLines.length - 1]}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                    <h2 className="text-5xl md:text-[clamp(2.6rem,8vw,8rem)] font-display font-black text-white leading-[0.9] uppercase tracking-tight">
                        Absolute <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10">Authority.</span>
                    </h2>
                </div>

                <ResponsiveSwitcher mobile={mobileView} desktop={desktopView} />

                <div className="mt-12 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
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

function CompetitorCell({ value, border, isActive }: { value: string, border?: boolean, isActive?: boolean }) {
    return (
        <div className={cn(
            "p-10 md:p-16 flex flex-col items-center justify-center gap-6 opacity-20 transition-all duration-700 group-hover/row:opacity-100",
            border && "border-l border-white/5",
            isActive && "opacity-100"
        )}>
            <X className={cn("text-zinc-800 transition-colors", isActive ? "text-primary/40" : "")} size={20} strokeWidth={3} />
            <span className={cn("text-sm md:text-base font-black text-white uppercase italic text-center leading-tight transition-colors", isActive ? "text-white" : "text-white/40")}>{value}</span>
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
