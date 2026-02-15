"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Brain, CheckCircle2, AlertCircle, Terminal, FileCode, Wand2, Sparkles, Activity, Target, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useResponsive } from "./responsive/ResponsiveProvider";
import { ResponsiveSwitcher } from "./responsive/ResponsiveSwitcher";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG & ASSETS
// ─────────────────────────────────────────────────────────────────────────────
const BRAIN_RESONANCE = "/assets/Assets/brain_resonance.png";
const REFLECTION_CORE = "/assets/Assets/reflection_core.png";
const KNOWLEDGE_GAP = "/assets/Assets/knowledge_gap.png";

type SystemPhase = "DREAMING" | "DETECTION" | "REFLECTING" | "HEALING" | "VERIFIED";

const GAPS = [
    { id: 1, type: "Logic", file: "auth/callback.ts", issue: "Circular dependency in oauth relay", severity: "High" },
    { id: 2, type: "Context", file: "services/neural_bridge.tsx", issue: "Memory shard mismatch in Act III", severity: "Critical" },
    { id: 3, type: "Security", file: "lib/vault/keys.go", issue: "Exposure in ephemeral session cleanup", severity: "Medium" }
];

export default function SelfHealingUI() {
    const [phase, setPhase] = useState<SystemPhase>("DREAMING");
    const [sysLoad, setSysLoad] = useState(24);
    const { isMobile } = useResponsive();
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.2 });

    // AUTONOMIC CYCLE LOGIC
    useEffect(() => {
        if (!isInView) return;

        let mounted = true;
        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const runCycle = async () => {
            while (mounted) {
                setPhase("DREAMING");
                setSysLoad(22 + Math.random() * 5);
                await wait(6000 + Math.random() * 3000);
                setPhase("DETECTION");
                setSysLoad(45 + Math.random() * 10);
                await wait(4000);
                setPhase("REFLECTING");
                setSysLoad(82 + Math.random() * 8);
                await wait(5000);
                setPhase("HEALING");
                setSysLoad(94 + Math.random() * 5);
                await wait(6000);
                setPhase("VERIFIED");
                setSysLoad(30);
                await wait(5000);
                if (!mounted) break;
            }
        };

        runCycle();
        return () => { mounted = false; };
    }, [isInView]);

    const loadColor = sysLoad <= 40 ? "#10B981" : sysLoad <= 80 ? "#F0B429" : "#EF4444";

    const commonHeader = (
        <div className={cn(
            "border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl z-20",
            isMobile ? "px-6 py-5" : "px-10 py-8"
        )}>
            <div className="flex items-center gap-4 md:gap-5">
                <div className="relative w-3 h-3 md:w-4 md:h-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <div className={cn("w-1.5 h-1.5 rounded-full", phase === "HEALING" ? "bg-red-500 animate-ping" : "bg-emerald-500")} />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-[8px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] md:tracking-[0.4em] leading-none">Status: {phase}</span>
                        <div className="h-px w-4 md:w-8 bg-white/10" />
                        <span className="text-[8px] md:text-[10px] font-mono font-black text-primary/80 uppercase">LOAD: {Math.round(sysLoad)}%</span>
                    </div>
                    <span className="text-xs md:text-sm font-black text-white uppercase tracking-tight mt-1">Ora // Autonomic_Engine</span>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <div className="hidden md:flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.03] border border-white/10">
                    <Activity size={12} className="text-primary animate-pulse" />
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-black">Dominion: Nominal</span>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <RefreshCw size={14} className={cn("text-primary", phase !== "DREAMING" && "animate-spin")} />
                </div>
            </div>
        </div>
    );

    const commonFooter = (
        <div className={cn(
            "border-t border-white/5 flex items-center justify-between text-zinc-600 font-mono text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.5em] bg-black/20",
            isMobile ? "px-6 py-5" : "px-10 py-8"
        )}>
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-12">
                <div className="flex gap-2 items-center">
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>UPTIME: <span className="text-white">99.998%</span></span>
                </div>
                <div className="flex gap-2 md:gap-3 text-zinc-500">
                    <Terminal size={12} className="md:w-3.5 md:h-3.5" />
                    <span>SOVEREIGN_AUTONOMIC</span>
                </div>
            </div>
        </div>
    );

    const canvasContent = (
        <AnimatePresence mode="wait">
            {phase === "DREAMING" && (
                <motion.div key="dreaming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full flex flex-col items-center justify-center text-center space-y-6 md:space-y-10">
                    <div className="relative">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-dashed border-primary/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20 backdrop-blur-xl">
                                <Brain size={isMobile ? 32 : 48} className="text-primary/40" />
                            </div>
                        </div>
                        <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10" />
                    </div>
                    <div className="space-y-3 md:space-y-4 px-4">
                        <h2 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-tight">Ready for Autonomic Analysis</h2>
                        <p className="text-zinc-600 font-mono text-[9px] md:text-[11px] uppercase tracking-[0.3em]">Neural Core: Reflecting on long-term memory shards</p>
                    </div>
                </motion.div>
            )}

            {phase === "DETECTION" && (
                <motion.div key="detection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col items-center justify-center text-center space-y-8 md:space-y-12">
                    <div className="relative w-full max-w-4xl aspect-[16/9] md:h-[300px] rounded-[24px] md:rounded-[40px] overflow-hidden border border-red-500/20 shadow-2xl mx-4">
                        <Image src={KNOWLEDGE_GAP} alt="Knowledge Gap" fill className="object-cover opacity-90 mix-blend-screen" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.1, repeat: 10 }} className="absolute inset-0 bg-red-500/5 mix-blend-overlay" />
                        <div className="absolute inset-0 flex items-center justify-center px-6">
                            <div className="px-4 py-2 md:px-8 md:py-3 bg-red-500/20 border border-red-500/40 rounded-full backdrop-blur-2xl flex items-center gap-3 md:gap-4">
                                <Target className="text-red-500 animate-pulse" size={isMobile ? 14 : 20} />
                                <span className="text-[10px] md:text-sm font-mono font-black text-red-500 uppercase tracking-widest leading-none">Gap Detected // 0xCC44</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 w-full px-4">
                        <h3 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-tight">Knowledge Gaps Identified</h3>
                        <div className={cn("flex justify-center flex-wrap gap-2 md:gap-3")}>
                            {GAPS.map((gap, i) => (
                                <motion.div key={gap.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                                    className="px-3 py-1.5 md:px-5 md:py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-mono text-zinc-400 flex items-center gap-2 md:gap-3">
                                    <FileCode size={12} className="text-primary" /> {gap.file}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {phase === "REFLECTING" && (
                <motion.div key="reflecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center space-y-8 md:space-y-12 px-6">
                    <div className="relative w-32 h-32 md:w-48 md:h-48">
                        <div className="absolute inset-0 bg-primary/30 blur-[60px] md:blur-[80px] animate-pulse" />
                        <motion.div animate={{ scale: [1, 1.1, 0.95, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}
                            className="w-full h-full rounded-[30px] md:rounded-[60px] border-2 border-primary/40 flex items-center justify-center bg-black/80 backdrop-blur-xl relative z-10 shadow-[0_0_50px_rgba(240,180,41,0.2)]">
                            <Brain size={isMobile ? 48 : 80} className="text-primary drop-shadow-[0_0_20px_#F0B429]" />
                        </motion.div>
                    </div>
                    <div className="space-y-4 md:space-y-6 max-w-2xl text-center">
                        <h3 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight">Sovereign Reflection</h3>
                        <p className="text-zinc-400 font-sans font-light text-base md:text-xl leading-relaxed tracking-tight">
                            &quot;Synthesizing connective tissue between project sharding and local hardware vault... deriving optimal fix.&quot;
                        </p>
                        <div className="flex justify-center gap-2 md:gap-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_#F0B429]" />
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {phase === "HEALING" && (
                <motion.div key="healing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col space-y-6 md:space-y-10 px-4 md:px-0">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex-shrink-0">
                            <Wand2 size={isMobile ? 20 : 32} className="animate-pulse" />
                        </div>
                        <h3 className="text-2xl md:text-5xl font-display font-black text-white uppercase tracking-tight leading-none">Executing Autonomic Fix</h3>
                    </div>

                    <div className="flex-1 bg-black/60 border border-white/10 rounded-[24px] md:rounded-[40px] p-6 md:p-12 font-mono text-sm md:text-lg relative overflow-hidden shadow-inner">
                        <div className="absolute top-0 right-0 p-6 md:p-12 opacity-[0.05] md:opacity-[0.08]">
                            <Sparkles size={isMobile ? 100 : 180} className="text-primary" />
                        </div>
                        <div className="space-y-3 md:space-y-4 relative z-10">
                            <div className="text-zinc-700 text-[10px] md:text-sm md:opacity-100">// Applying patch: neural_bridge_v5.patch</div>
                            <div className="text-emerald-500 flex items-center gap-2 md:gap-4 text-[11px] md:text-base">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                + Rewriting neural_bridge.tsx
                            </div>
                            <div className="text-zinc-500 opacity-60 text-[10px] md:text-sm">Successfully unlinked Cluster_0x4 and Node_99</div>
                            <div className="text-emerald-500 flex items-center gap-2 md:gap-4 text-[11px] md:text-base">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                + Memory graph restored...
                            </div>
                            <div className="text-emerald-400 font-black mt-6 md:mt-8 text-sm md:text-xl">HEALING_COMPLETE: 100% integrity restored.</div>

                            <div className="relative h-1 md:h-2 w-full bg-white/5 rounded-full overflow-hidden mt-6 md:mt-10">
                                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "easeInOut" }} className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_20px_#F0B429]" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {phase === "VERIFIED" && (
                <motion.div key="verified" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center space-y-8 md:space-y-12 px-6">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-emerald-500/10 border-4 border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 size={isMobile ? 60 : 100} />
                    </motion.div>
                    <div className="space-y-4 md:space-y-6">
                        <h3 className="text-3xl md:text-6xl font-display font-black text-white uppercase tracking-tight">Sovereignty Verified</h3>
                        <p className="text-zinc-400 text-lg md:text-2xl leading-relaxed font-light max-w-2xl mx-auto">System stabilized. Neural leaks eliminated.</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 md:gap-6 w-full max-w-xs md:max-w-none">
                        <div className="flex-1 px-4 py-2 md:px-10 md:py-3 bg-white/[0.05] border border-white/10 rounded-full font-mono text-[9px] md:text-xs text-zinc-300 uppercase tracking-widest font-black text-center">
                            INTEGRITY: 100%
                        </div>
                        <div className="flex-1 px-4 py-2 md:px-10 md:py-3 bg-white/[0.05] border border-white/10 rounded-full font-mono text-[9px] md:text-xs text-zinc-300 uppercase tracking-widest font-black text-center">
                            DOMINION: NOMINAL
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const desktopView = (
        <div className="relative bg-[#050505] rounded-[47px] overflow-hidden border border-white/5 min-h-[700px] flex flex-col">
            <AnimatePresence>
                {phase === "DREAMING" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-0">
                        <Image src={REFLECTION_CORE} alt="Reflection" fill className="object-cover transition-transform duration-[10s] scale-110" />
                    </motion.div>
                )}
                {(phase === "REFLECTING" || phase === "HEALING") && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 0.15, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-0">
                        <Image src={BRAIN_RESONANCE} alt="Resonance" fill className="object-contain p-20 opacity-40 mix-blend-screen" />
                    </motion.div>
                )}
            </AnimatePresence>
            {commonHeader}
            <div className="flex-1 p-12 relative overflow-hidden flex flex-col z-10">
                <div className="absolute inset-0 noise-overlay opacity-[0.02] pointer-events-none" />
                {canvasContent}
            </div>
            {commonFooter}
        </div>
    );

    const mobileView = (
        <div className="relative bg-[#050505] rounded-[32px] overflow-hidden border border-white/5 min-h-[600px] flex flex-col">
            <AnimatePresence>
                {phase === "DREAMING" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-0 px-10">
                        <Image src={REFLECTION_CORE} alt="Reflection" fill className="object-cover" />
                    </motion.div>
                )}
                {(phase === "REFLECTING" || phase === "HEALING") && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 0.15, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-0">
                        <Image src={BRAIN_RESONANCE} alt="Resonance" fill className="object-contain p-10 opacity-40 mix-blend-screen" />
                    </motion.div>
                )}
            </AnimatePresence>
            {commonHeader}
            <div className="flex-1 py-8 relative overflow-hidden flex flex-col z-10 h-full">
                <div className="absolute inset-0 noise-overlay opacity-[0.02] pointer-events-none" />
                {canvasContent}
            </div>
            {commonFooter}
        </div>
    );

    return (
        <div ref={containerRef} className={cn(
            "relative w-full max-w-6xl mx-auto rounded-[32px] md:rounded-[48px] bg-gradient-to-b from-white/10 to-transparent overflow-hidden shadow-2xl",
            isMobile ? "p-0.5" : "p-1"
        )}>
            <ResponsiveSwitcher mobile={mobileView} desktop={desktopView} />
        </div>
    );
}

