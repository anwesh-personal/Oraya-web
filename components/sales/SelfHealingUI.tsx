"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Brain, CheckCircle2, AlertCircle, Terminal, FileCode, Wand2, Sparkles, Activity, Target, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: SELF HEALING UI
// ─────────────────────────────────────────────────────────────────────────────
export default function SelfHealingUI() {
    const [phase, setPhase] = useState<SystemPhase>("DREAMING");
    const [sysLoad, setSysLoad] = useState(24);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.2 });

    // AUTONOMIC CYCLE LOGIC
    useEffect(() => {
        if (!isInView) return;

        let mounted = true;
        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const runCycle = async () => {
            while (mounted) {
                // 1. DREAMING (Idle / Reflection)
                setPhase("DREAMING");
                setSysLoad(22 + Math.random() * 5);
                await wait(6000 + Math.random() * 3000);

                // 2. DETECTION (Scanning for Gaps)
                setPhase("DETECTION");
                setSysLoad(45 + Math.random() * 10);
                await wait(4000);

                // 3. REFLECTING (Gaps identified, thinking of solution)
                setPhase("REFLECTING");
                setSysLoad(82 + Math.random() * 8);
                await wait(5000);

                // 4. HEALING (Executing Autonomic Fix)
                setPhase("HEALING");
                setSysLoad(94 + Math.random() * 5);
                await wait(6000);

                // 5. VERIFIED (Nominal State)
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

    return (
        <div ref={containerRef} className="relative w-full max-w-6xl mx-auto p-1 rounded-[48px] bg-gradient-to-b from-white/10 to-transparent overflow-hidden shadow-2xl">
            <div className="relative bg-[#050505] rounded-[47px] overflow-hidden border border-white/5 min-h-[600px] flex flex-col">

                {/* Background Resonance Layers */}
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

                {/* INTERFACE HEADER */}
                <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl z-20">
                    <div className="flex items-center gap-5">
                        <div className="relative w-4 h-4 rounded-full bg-red-500/10 flex items-center justify-center">
                            <div className={cn("w-1.5 h-1.5 rounded-full", phase === "HEALING" ? "bg-red-500 animate-ping" : "bg-emerald-500")} />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] leading-none">Status: {phase}</span>
                                <div className="h-px w-8 bg-white/10" />
                                <span className="text-[10px] font-mono font-black text-primary/80 uppercase">LOAD: {Math.round(sysLoad)}%</span>
                            </div>
                            <span className="text-sm font-black text-white uppercase tracking-tight mt-1">Ora // Autonomic_Healing_Engine_V5</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.03] border border-white/10">
                            <Activity size={14} className="text-primary animate-pulse" />
                            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-black">Dominion: Nominal</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <RefreshCw size={18} className={cn("text-primary", phase !== "DREAMING" && "animate-spin")} />
                        </div>
                    </div>
                </div>

                {/* THE MAGIC CANVAS */}
                <div className="flex-1 p-12 relative overflow-hidden flex flex-col z-10">
                    <div className="absolute inset-0 noise-overlay opacity-[0.02] pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {/* PHASE: DREAMING */}
                        {phase === "DREAMING" && (
                            <motion.div key="dreaming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full flex flex-col items-center justify-center text-center space-y-10">
                                <div className="relative">
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-48 h-48 rounded-full border border-dashed border-primary/20" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20 backdrop-blur-xl">
                                            <Brain size={48} className="text-primary/40" />
                                        </div>
                                    </div>
                                    <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-display font-black text-white uppercase tracking-tight">Ready for Autonomic Analysis</h2>
                                    <p className="text-zinc-600 font-mono text-[11px] uppercase tracking-[0.3em]">Neural Core: Reflecting on long-term memory shards</p>
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE: DETECTION */}
                        {phase === "DETECTION" && (
                            <motion.div key="detection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col items-center justify-center text-center space-y-12">
                                <div className="relative w-full max-w-4xl h-[300px] rounded-[40px] overflow-hidden border border-red-500/20 shadow-2xl">
                                    <Image src={KNOWLEDGE_GAP} alt="Knowledge Gap" fill className="object-cover opacity-90 mix-blend-screen" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.1, repeat: 10 }} className="absolute inset-0 bg-red-500/5 mix-blend-overlay" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="px-8 py-3 bg-red-500/20 border border-red-500/40 rounded-full backdrop-blur-2xl flex items-center gap-4">
                                            <Target className="text-red-500 animate-pulse" size={20} />
                                            <span className="text-sm font-mono font-black text-red-500 uppercase tracking-widest">Knowledge_Void_Detected // 0xCC44</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-display font-black text-white uppercase tracking-tight">Knowledge Gaps Identified</h3>
                                    <div className="flex gap-3 justify-center">
                                        {GAPS.map((gap, i) => (
                                            <motion.div key={gap.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                                                className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-400 flex items-center gap-3">
                                                <FileCode size={14} className="text-primary" /> {gap.file}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE: REFLECTING */}
                        {phase === "REFLECTING" && (
                            <motion.div key="reflecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center space-y-12">
                                <div className="relative w-48 h-48">
                                    <div className="absolute inset-0 bg-primary/30 blur-[80px] animate-pulse" />
                                    <motion.div animate={{ scale: [1, 1.1, 0.95, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}
                                        className="w-full h-full rounded-[60px] border-2 border-primary/40 flex items-center justify-center bg-black/80 backdrop-blur-xl relative z-10 shadow-[0_0_50px_rgba(240,180,41,0.2)]">
                                        <Brain size={80} className="text-primary drop-shadow-[0_0_20px_#F0B429]" />
                                    </motion.div>
                                </div>
                                <div className="space-y-6 max-w-2xl text-center">
                                    <h3 className="text-5xl font-display font-black text-white uppercase tracking-tight">Sovereign Reflection</h3>
                                    <p className="text-zinc-400 font-sans font-light text-xl leading-relaxed tracking-tight">
                                        &quot;Synthesizing connective tissue between project sharding and local hardware vault... deriving optimal fix for neural mismatched clusters.&quot;
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#F0B429]" />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE: HEALING */}
                        {phase === "HEALING" && (
                            <motion.div key="healing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col space-y-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                        <Wand2 size={32} className="animate-pulse" />
                                    </div>
                                    <h3 className="text-5xl font-display font-black text-white uppercase tracking-tight">Executing Autonomic Fix</h3>
                                </div>

                                <div className="flex-1 bg-black/60 border border-white/10 rounded-[40px] p-12 font-mono text-lg relative overflow-hidden shadow-inner">
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.08]">
                                        <Sparkles size={180} className="text-primary" />
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <div className="text-zinc-700">// Applying patch: neural_bridge_v5.patch</div>
                                        <div className="text-emerald-500 flex items-center gap-4">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            + Rewriting neural_bridge.tsx // context sharding preserved
                                        </div>
                                        <div className="text-zinc-500 opacity-60">Successfully unlinked Cluster_0x4 and Node_99</div>
                                        <div className="text-emerald-500 flex items-center gap-4">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            + Re-initializing sharded memory graph...
                                        </div>
                                        <div className="text-emerald-400 font-black mt-8 text-xl">HEALING_COMPLETE: 100% integrity restored.</div>

                                        <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden mt-10">
                                            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "easeInOut" }} className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_20px_#F0B429]" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE: VERIFIED */}
                        {phase === "VERIFIED" && (
                            <motion.div key="verified" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center space-y-12">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-48 h-48 rounded-full bg-emerald-500/10 border-4 border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                                    <CheckCircle2 size={100} />
                                </motion.div>
                                <div className="space-y-6">
                                    <h3 className="text-6xl font-display font-black text-white uppercase tracking-tight">Sovereignty Verified</h3>
                                    <p className="text-zinc-400 text-2xl leading-relaxed font-light max-w-2xl mx-auto">System stabilized. Neural leaks eliminated. Dominion remains absolute.</p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="px-10 py-3 bg-white/[0.05] border border-white/10 rounded-full font-mono text-xs text-zinc-300 uppercase tracking-widest font-black">
                                        INTEGRITY: 100%
                                    </div>
                                    <div className="px-10 py-3 bg-white/[0.05] border border-white/10 rounded-full font-mono text-xs text-zinc-300 uppercase tracking-widest font-black">
                                        DOMINION: NOMINAL
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* TELEMETRY FOOTER */}
                <div className="px-10 py-8 border-t border-white/5 flex items-center justify-between text-zinc-600 font-mono text-[10px] uppercase tracking-[0.5em] bg-black/20">
                    <div className="flex items-center gap-12">
                        <div className="flex gap-3 items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>UPTIME: <span className="text-white">99.998%</span></span>
                        </div>
                        <div className="flex gap-3 text-zinc-500">
                            <Terminal size={14} />
                            <span>v5.5.0_SOVEREIGN_AUTONOMIC</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
