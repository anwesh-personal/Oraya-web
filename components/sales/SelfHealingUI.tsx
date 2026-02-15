"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Brain, CheckCircle2, AlertCircle, Terminal, FileCode, Wand2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const GAPS = [
    { id: 1, type: "Logic", file: "auth/callback.ts", issue: "Circular dependency in oauth relay", severity: "High" },
    { id: 2, type: "Context", file: "services/neural_bridge.tsx", issue: "Memory shard mismatch in Act III", severity: "Critical" },
    { id: 3, type: "Security", file: "lib/vault/keys.go", issue: "Exposure in ephemeral session cleanup", severity: "Medium" }
];

export default function SelfHealingUI() {
    const [phase, setPhase] = useState(0); // 0: Idle, 1: Scanning, 2: Gaps Found, 3: Reflecting, 4: Healing, 5: Verified

    useEffect(() => {
        if (phase === 0) return;

        const timers = [1500, 2000, 3000, 2000, 1500];
        const nextPhase = () => {
            if (phase < 5) {
                setTimeout(() => setPhase(prev => prev + 1), timers[phase - 1]);
            } else {
                setTimeout(() => setPhase(0), 5000);
            }
        };
        nextPhase();
    }, [phase]);

    return (
        <div className="relative w-full max-w-5xl mx-auto p-1 rounded-[40px] bg-gradient-to-b from-white/10 to-transparent overflow-hidden">
            <div className="relative bg-[#050505] rounded-[39px] overflow-hidden border border-white/5 min-h-[500px] flex flex-col">

                {/* INTERFACE HEADER */}
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Status: {phase === 0 ? "IDLE" : "AUTONOMIC_HEALING_ACTIVE"}</span>
                            <span className="text-xs font-black text-white uppercase tracking-tighter">Ora // Self_Healing_Engine_V4</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => phase === 0 && setPhase(1)}
                            className={cn(
                                "px-6 py-2 rounded-full font-mono text-[9px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2",
                                phase === 0
                                    ? "bg-primary text-black hover:bg-white shadow-2xl"
                                    : "bg-white/5 text-zinc-500 border border-white/5 cursor-not-allowed"
                            )}
                        >
                            <span className="relative z-10">{phase === 0 ? "Initiate_Scan" : "Processing..."}</span>
                        </button>
                    </div>
                </div>

                {/* THE MAGIC CANVAS */}
                <div className="flex-1 p-8 relative overflow-hidden flex flex-col">
                    <div className="absolute inset-0 noise-overlay opacity-[0.03] pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {/* PHASE 0 & 1: SCANNING */}
                        {(phase === 0 || phase === 1) && (
                            <motion.div
                                key="scanning"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center text-center space-y-8"
                            >
                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="w-32 h-32 rounded-full border-2 border-dashed border-primary/20"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                                            <Search size={32} className={cn("text-primary", phase === 1 && "animate-pulse")} />
                                        </div>
                                    </div>
                                    {phase === 1 && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1.5, opacity: 0 }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="absolute inset-0 rounded-full border-2 border-primary"
                                        />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="text-2xl font-display font-black text-white uppercase tracking-tighter">
                                        {phase === 0 ? "Ready for Autonomic Analysis" : "Scanning Filesystem Architecture..."}
                                    </div>
                                    <div className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
                                        {phase === 0 ? "Wait for manual override" : "Checking for sharded logic leaks // nodes: 0x44A"}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE 2: GAPS FOUND */}
                        {phase === 2 && (
                            <motion.div
                                key="gaps"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-3xl font-display font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                        <AlertCircle className="text-red-500" size={28} />
                                        Knowledge Gaps Identified
                                    </h3>
                                    <div className="text-[10px] font-mono text-red-500/50 uppercase tracking-widest font-black">CRITICAL_LEAKS_FOUND: 03</div>
                                </div>

                                <div className="grid gap-3">
                                    {GAPS.map((gap, i) => (
                                        <motion.div
                                            key={gap.id}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: i * 0.2 }}
                                            className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:bg-white/[0.04] transition-colors"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="p-3 rounded-xl bg-black border border-white/5 text-zinc-500 group-hover:text-primary transition-colors">
                                                    <FileCode size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">{gap.file}</div>
                                                    <div className="text-base font-bold text-white uppercase tracking-tighter">{gap.issue}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-[8px] font-black rounded-full uppercase tracking-widest">
                                                    {gap.severity}_SEVERITY
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE 3: REFLECTING */}
                        {phase === 3 && (
                            <motion.div
                                key="reflecting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center space-y-10"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse" />
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.1, 0.9, 1.05, 1],
                                            rotate: [0, 5, -5, 2, 0]
                                        }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="w-32 h-32 rounded-[40px] border-2 border-primary/50 flex items-center justify-center bg-black relative z-10"
                                    >
                                        <Brain size={48} className="text-primary drop-shadow-[0_0_20px_#F0B429]" />
                                    </motion.div>
                                </div>
                                <div className="space-y-4 max-w-xl text-center">
                                    <h3 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Sovereign Reflection</h3>
                                    <p className="text-zinc-500 font-sans font-light text-lg italic leading-relaxed uppercase tracking-tight">
                                        "Synthesizing connective tissue between project sharding and local hardware vault... deriving optimal fix for circular dependency in auth relay."
                                    </p>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                                                className="w-1.5 h-1.5 rounded-full bg-primary"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE 4: HEALING */}
                        {phase === 4 && (
                            <motion.div
                                key="healing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex flex-col"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                                        <Wand2 size={20} />
                                    </div>
                                    <h3 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Executing Autonomic Fix</h3>
                                </div>

                                <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-8 font-mono text-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
                                        <Sparkles size={100} className="text-primary" />
                                    </div>
                                    <div className="space-y-2 relative z-10">
                                        <div className="text-zinc-700">// Applying patch: auth_relay_v2.patch</div>
                                        <div className="text-emerald-500">+ Rewriting oauth_bridge.ts // context preserved</div>
                                        <div className="text-zinc-400">Successfully unlinked Node_88 and Node_12</div>
                                        <div className="text-emerald-500">+ Re-initializing sharded memory graph</div>
                                        <div className="text-zinc-400">HEALING_COMPLETE: 100% logic integrity restored.</div>

                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: 1 }}
                                            transition={{ duration: 2 }}
                                            className="h-1 bg-primary w-full origin-left mt-6"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE 5: VERIFIED */}
                        {phase === 5 && (
                            <motion.div
                                key="verified"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center text-center space-y-8"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                    className="w-32 h-32 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500"
                                >
                                    <CheckCircle2 size={64} />
                                </motion.div>
                                <div className="space-y-2">
                                    <h3 className="text-4xl font-display font-black text-white uppercase tracking-tighter">Integrity Verified</h3>
                                    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">System stabilized. Circular leaks eliminated. Context expanded.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="px-6 py-2 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-black">
                                        LATENCY_SAVED: 120ms
                                    </div>
                                    <div className="px-6 py-2 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-black">
                                        DOMINION: NOMINAL
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* TELEMETRY FOOTER */}
                <div className="px-8 py-6 border-t border-white/5 flex items-center justify-between text-zinc-700 font-mono text-[8px] uppercase tracking-[0.4em]">
                    <div className="flex items-center gap-8">
                        <div className="flex gap-2">
                            <span>UPTIME:</span>
                            <span className="text-zinc-400">99.9%</span>
                        </div>
                        <div className="flex gap-2 text-zinc-500">
                            <Terminal size={10} />
                            <span>v5.2.0_AUTONOMIC</span>
                        </div>
                    </div>
                    <div className="group flex items-center gap-2 cursor-pointer transition-colors hover:text-white">
                        <span>VIEW_FULL_AUDIT_LOG</span>
                        <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            →
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
