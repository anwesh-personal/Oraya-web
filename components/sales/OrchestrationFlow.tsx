"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Cpu, Zap, Trash2, ArrowRight, Network, Sparkles, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NODES = [
    { id: "ora", label: "ORA_CORE", icon: Brain, color: "#F0B429", pos: { x: 50, y: 50 } },
    { id: "task", label: "MISSION_LOG", icon: Terminal, pos: { x: 20, y: 50 } },
];

function Terminal({ size, className }: { size: number, className?: string }) {
    return <Database size={size} className={className} />;
}

export default function OrchestrationFlow() {
    const [step, setStep] = useState(0);
    const [agents, setAgents] = useState<{ id: string; type: string; status: string }[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((s) => (s + 1) % 5);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (step === 1) {
            setAgents([{ id: "alpha", type: "Recon", status: "Spawning" }]);
        } else if (step === 2) {
            setAgents([{ id: "alpha", type: "Recon", status: "Executing" }]);
        } else if (step === 3) {
            setAgents([{ id: "alpha", type: "Recon", status: "Merging" }]);
        } else if (step === 4) {
            setAgents([]);
        } else {
            setAgents([]);
        }
    }, [step]);

    return (
        <div className="relative w-full h-[500px] bg-[#030303] rounded-[48px] border border-white/5 overflow-hidden group">
            <div className="absolute inset-0 noise-overlay opacity-20" />

            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="absolute top-8 left-10 flex items-center gap-4 z-20">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[8px] text-zinc-500 uppercase tracking-widest">
                    <Network size={10} />
                    Live_Swarm_Visualizer
                </div>
            </div>

            {/* THE FLOW CHART CANVAS */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full max-w-4xl h-full flex items-center justify-around px-20">

                    {/* ORA CORE NODE */}
                    <div className="relative z-30">
                        <motion.div
                            animate={{
                                boxShadow: step === 0 ? "0 0 40px rgba(240, 180, 41, 0.2)" : "0 0 20px rgba(240, 180, 41, 0.1)",
                                scale: step === 3 ? 1.1 : 1
                            }}
                            className="w-24 h-24 rounded-3xl bg-black border-2 border-[#F0B429]/40 flex items-center justify-center relative overflow-hidden group/ora"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[#F0B429]/10 to-transparent" />
                            <Brain size={40} className="text-[#F0B429] drop-shadow-[0_0_15px_#F0B429]" />

                            {/* Orbital Ring */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-2 border border-dashed border-[#F0B429]/20 rounded-2xl"
                            />
                        </motion.div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#F0B429] font-black uppercase tracking-widest whitespace-nowrap">ORA_CORE</div>
                    </div>

                    {/* PATHWAY LINES */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        {/* Ora to Agent Path */}
                        <motion.path
                            d="M 50% 50% L 75% 50%"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="2"
                            fill="transparent"
                            strokeDasharray="4 4"
                        />
                        {/* Data Particles */}
                        <AnimatePresence>
                            {step === 1 && (
                                <motion.circle
                                    initial={{ offsetDistance: "0%" }}
                                    animate={{ offsetDistance: "100%" }}
                                    r="3"
                                    fill="#F0B429"
                                    className="shadow-[0_0_10px_#F0B429]"
                                    style={{ offsetPath: "path('M 480 250 L 720 250')" }}
                                />
                            )}
                            {step === 3 && (
                                <motion.circle
                                    initial={{ offsetDistance: "100%" }}
                                    animate={{ offsetDistance: "0%" }}
                                    r="4"
                                    fill="#00F0FF"
                                    className="shadow-[0_0_10px_#00F0FF]"
                                    style={{ offsetPath: "path('M 480 250 L 720 250')" }}
                                />
                            )}
                        </AnimatePresence>
                    </svg>

                    {/* EPHEMERAL AGENT NODE */}
                    <AnimatePresence>
                        {agents.map((agent) => (
                            <motion.div
                                key={agent.id}
                                initial={{ opacity: 0, scale: 0.5, x: 100 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{
                                    opacity: 0,
                                    scale: 1.2,
                                    filter: "blur(20px)",
                                    boxShadow: "0 0 100px rgba(255, 0, 170, 0.5)"
                                }}
                                className="relative z-30"
                            >
                                <div className={cn(
                                    "w-20 h-20 rounded-[24px] bg-[#050505] border flex flex-col items-center justify-center gap-2 transition-all duration-700",
                                    step === 2 ? "border-[#FF00AA]/60 shadow-[0_0_30px_#FF00AA20]" : "border-white/10"
                                )}>
                                    {step === 2 && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="absolute inset-0 rounded-[24px] border border-[#FF00AA] opacity-20"
                                        />
                                    )}
                                    <Cpu size={24} className={cn(step === 2 ? "text-[#FF00AA]" : "text-zinc-500")} />
                                    <span className="text-[7px] font-mono text-zinc-600 font-bold uppercase tracking-widest">{agent.type}_UNIT</span>
                                </div>

                                {/* Status Badge */}
                                <motion.div
                                    className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black border border-white/5 rounded-full whitespace-nowrap"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-1 h-1 rounded-full animate-pulse",
                                            step === 1 ? "bg-amber-500" : step === 2 ? "bg-red-500" : "bg-emerald-500"
                                        )} />
                                        <span className="text-[8px] font-mono text-white/40 uppercase tracking-tighter">{agent.status}</span>
                                    </div>
                                </motion.div>

                                {/* Self-Destruct Timer UI */}
                                {step === 3 && (
                                    <motion.div
                                        initial={{ width: "100%" }}
                                        animate={{ width: "0%" }}
                                        className="absolute -bottom-4 left-0 h-0.5 bg-red-500/40"
                                    />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty State / Ghost Placeholder */}
                    {agents.length === 0 && step === 0 && (
                        <div className="w-20 h-20 rounded-[24px] border border-white/[0.03] border-dashed flex items-center justify-center">
                            <Plus className="text-zinc-800" size={20} />
                        </div>
                    )}
                </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="absolute bottom-8 inset-x-10 flex justify-between items-end z-20">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="space-y-1">
                            <div className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">Active_Mission</div>
                            <div className="text-xs font-black text-white uppercase tracking-tighter">
                                {step === 0 && "IDLE_STANDBY"}
                                {step === 1 && "ORCHESTRATING_SQUAD"}
                                {step === 2 && "EXECUTING_DEEP_RECON"}
                                {step === 3 && "HARVESTING_INTELLIGENCE"}
                                {step === 4 && "SYNAPSE_CONSOLIDATED"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={cn(
                            "w-8 h-1 rounded-full transition-all duration-700",
                            step === i ? "bg-primary w-12" : "bg-white/5"
                        )} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function Plus({ className, size }: { className?: string, size?: number }) {
    return <Zap size={size} className={className} />;
}
