"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Code, Shield, Clock, ChevronRight, Activity } from "lucide-react";
import { useState, useEffect } from "react";

const SWARM_EVENTS = [
    {
        time: "09:00",
        agent: "Ora",
        action: "INITIATE_SWARM",
        desc: "Spawning specialized sub-agents for project 'Sovereign_Alpha'.",
        token: "0x8F01",
        color: "#F0B429"
    },
    {
        time: "09:02",
        agent: "Mara",
        action: "CODE_AUDIT",
        desc: "Identifying 4 security leaks in legacy payment gateway.",
        token: "0x33A2",
        color: "#ffffff"
    },
    {
        time: "09:05",
        agent: "Ova",
        action: "NEURAL_SYNTHESIS",
        desc: "Merging 6 months of Stripe API changes with local architecture context.",
        token: "0x11B4",
        color: "#00F0FF"
    },
    {
        time: "09:12",
        agent: "Mara",
        action: "PATCH_DEPLOY",
        desc: "Generating local patch artifacts for CVE-2024-X risk mitigation.",
        token: "0x55E9",
        color: "#ffffff"
    },
    {
        time: "09:15",
        agent: "Ora",
        action: "ARCHITECT_REVIEW",
        desc: "Dispatching summary to Master Architect. Deployment ready.",
        token: "0x0001",
        color: "#F0B429"
    }
];

export default function SwarmLogs() {
    const [visibleEvents, setVisibleEvents] = useState<number[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisibleEvents(prev => {
                if (prev.length >= SWARM_EVENTS.length) return [0];
                return [...prev, prev.length];
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 bg-black relative" id="swarm-logs">
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">

                    {/* LEFT: NARRATIVE */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
                                <Activity size={12} className="text-primary" />
                                SWARM_EXECUTION_LOG
                            </div>

                            <h2 className="text-5xl md:text-7xl font-display font-black text-white uppercase tracking-tighter leading-none">
                                The Swarm <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/20">in Motion.</span>
                            </h2>

                            <p className="text-xl text-zinc-500 font-sans font-light leading-relaxed">
                                While they are fighting context-amnesia, you are orchestrating an empire. See how Oraya delegates complexity across parallel neural paths.
                            </p>
                        </div>

                        <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <Clock size={20} className="text-primary" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Total_Execution_Time</div>
                                    <div className="text-2xl font-black text-white">15_MINUTES</div>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-600 font-light uppercase tracking-tight leading-relaxed">
                                A high-intensity engineering cycle that would take a human 4 hours, compressed into 15 minutes of sovereign oversight.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: LIVE LOG FEED */}
                    <div className="lg:col-span-3 space-y-4 h-[500px] lg:h-[800px] overflow-hidden">
                        <AnimatePresence mode="popLayout">
                            {visibleEvents.map((idx) => {
                                const event = SWARM_EVENTS[idx];
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                        className="relative p-8 rounded-[32px] border border-white/5 bg-[#050505] flex items-center gap-8 group overflow-hidden"
                                    >
                                        <div className="absolute inset-y-0 left-0 w-1 opacity-40" style={{ background: event.color }} />

                                        <div className="text-zinc-800 font-mono text-2xl font-black shrink-0">
                                            {event.time}
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                                                        {event.agent}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em]" style={{ color: event.color }}>
                                                        {event.action}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-mono text-zinc-800 tracking-tighter uppercase">Token_{event.token}</span>
                                            </div>
                                            <p className="text-white font-bold tracking-tight uppercase leading-snug">
                                                {event.desc}
                                            </p>
                                        </div>

                                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight size={14} className="text-white" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {visibleEvents.length < SWARM_EVENTS.length && (
                            <div className="flex items-center gap-3 p-8 text-primary/40 animate-pulse">
                                <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                                    <div className="w-1 h-1 bg-current rounded-full" />
                                </div>
                                <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em]">Synapse_Processing...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
