"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Users, Crown, Sparkles, Plus, Settings, Activity, Fingerprint, Network } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { agents } from "@/lib/agents";

import { ResponsiveSwitcher } from "./responsive/ResponsiveSwitcher";
import { MobileAccordion } from "./responsive/MobileAccordion";

export default function AgentEcosystem() {
    const [activeAgent, setActiveAgent] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.2 });

    useEffect(() => {
        if (!isInView || isHovered) return;

        const interval = setInterval(() => {
            setActiveAgent((prev) => (prev + 1) % agents.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isInView, isHovered]);

    const desktopView = (
        <div className="grid grid-cols-5 gap-12 items-start">
            {/* LEFT: AGENT STATUS LIST */}
            <div className="col-span-2 space-y-4">
                <div className="flex justify-between items-center px-4 mb-6">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Active_Synapse_Nodes</span>
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">v2.04</span>
                </div>

                {agents.map((agent, i) => (
                    <motion.button
                        key={agent.name}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={() => setActiveAgent(i)}
                        className={cn(
                            "w-full p-8 rounded-[40px] border text-left transition-all duration-700 group relative overflow-hidden",
                            activeAgent === i
                                ? "bg-white/[0.04] border-white/20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
                                : "bg-white/[0.01] border-white/5 hover:border-white/10"
                        )}
                    >
                        {activeAgent === i && (
                            <motion.div
                                className="absolute bottom-0 left-0 h-1 bg-primary z-20"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                            />
                        )}
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-[24px] overflow-hidden border border-white/10 bg-black group-hover:border-[currentColor] transition-all duration-700" style={{ color: agent.color }}>
                                    <Image
                                        src={agent.avatar}
                                        alt={agent.name}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-1000"
                                        unoptimized
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black"
                                    style={{ background: agent.status === "Active" ? "#10B981" : "#3F3F46" }} />
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tight">{agent.name}</h4>
                                    {agent.role === "Sovereign" && <Crown size={14} className="text-[#F0B429]" />}
                                </div>
                                <div className="flex gap-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                    <span style={{ color: agent.color }}>{agent.role}</span>
                                    <span>// CLEARANCE_{agent.clearance}</span>
                                </div>
                            </div>
                        </div>
                        {activeAgent === i && (
                            <motion.div
                                layoutId="agent-selector-glow"
                                className="absolute inset-x-0 bottom-0 h-[2px]"
                                style={{ background: agent.color }}
                            />
                        )}
                    </motion.button>
                ))}

                <button className="w-full p-6 rounded-[32px] border border-dashed border-white/10 flex items-center justify-center gap-4 text-zinc-600 hover:text-white hover:border-white/20 transition-all group">
                    <Plus size={20} />
                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.5em]">SPAWN_NEW_SPECIALIST</span>
                </button>
            </div>

            {/* RIGHT: AGENT COMMAND CONSOLE */}
            <div className="col-span-3">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeAgent}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-16 rounded-[48px] border border-white/5 bg-[#050505] relative overflow-hidden shadow-2xl min-h-[600px] flex flex-col justify-between"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Image src={agents[activeAgent].avatar} alt="" width={400} height={400} className="grayscale" unoptimized />
                        </div>

                        <div className="space-y-12 relative z-10">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: agents[activeAgent].color }}>
                                    <Fingerprint size={12} />
                                    IDENTITY_VERIFIED // 0x{activeAgent}F3
                                </div>
                                <h3 className="text-7xl font-display font-black text-white uppercase tracking-tight leading-none">{agents[activeAgent].name}</h3>
                                <p className="text-2xl text-zinc-500 font-sans font-light leading-snug tracking-tight max-w-2xl">
                                    &quot;{agents[activeAgent].desc}&quot;
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {agents[activeAgent].capabilities.map((cap, i) => (
                                    <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-colors">
                                        <Sparkles size={14} style={{ color: agents[activeAgent].color }} />
                                        <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">{cap}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Telemetry Footer */}
                        <div className="pt-12 mt-12 border-t border-white/5 grid grid-cols-3 gap-8 relative z-10">
                            <div className="space-y-2">
                                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.4em]">Synapse_Memory</div>
                                <div className="text-2xl font-black text-white">∞ <span className="text-[10px] text-zinc-600 font-mono ml-1">NODES</span></div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.4em]">Clearance_Lv</div>
                                <div className="text-2xl font-black text-white">{agents[activeAgent].clearance} <span className="text-[10px] text-zinc-600 font-mono ml-1">SOVEREIGN</span></div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.4em]">Execution_Mode</div>
                                <div className="text-2xl font-black uppercase tracking-tight" style={{ color: agents[activeAgent].color }}>{agents[activeAgent].mode}</div>
                            </div>
                        </div>

                        <div className="absolute bottom-10 right-10 flex gap-4 opacity-20">
                            <Settings size={16} />
                            <Activity size={16} />
                            <Network size={16} />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );

    const mobileView = (
        <div className="space-y-6">
            <MobileAccordion
                activeId={activeAgent}
                onChange={(id) => setActiveAgent(id as number)}
                items={agents.map((agent, i) => ({
                    id: i,
                    trigger: (
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-[16px] overflow-hidden border border-white/10 bg-black" style={{ color: agent.color }}>
                                    <Image
                                        src={agent.avatar}
                                        alt={agent.name}
                                        width={48}
                                        height={48}
                                        className={cn("w-full h-full object-cover object-top transition-all duration-700", activeAgent === i ? "grayscale-0" : "grayscale")}
                                        unoptimized
                                    />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black"
                                    style={{ background: agent.status === "Active" ? "#10B981" : "#3F3F46" }} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight">{agent.name}</h4>
                                    {agent.role === "Sovereign" && <Crown size={12} className="text-[#F0B429]" />}
                                </div>
                                <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                                    <span style={{ color: agent.color }}>{agent.role}</span> // LV_{agent.clearance}
                                </div>
                            </div>
                        </div>
                    ),
                    content: (
                        <div className="space-y-8 pt-4">
                            <p className="text-lg text-zinc-500 font-sans font-light leading-snug tracking-tight italic">
                                &quot;{agent.desc}&quot;
                            </p>

                            <div className="grid grid-cols-1 gap-3">
                                {agent.capabilities.map((cap, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <Sparkles size={12} style={{ color: agent.color }} />
                                        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{cap}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em]">Memory</div>
                                    <div className="text-xl font-black text-white">∞</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em]">Execution</div>
                                    <div className="text-lg font-black uppercase tracking-tight" style={{ color: agent.color }}>{agent.mode}</div>
                                </div>
                            </div>
                        </div>
                    )
                }))}
            />

            <button className="w-full p-4 rounded-[24px] border border-dashed border-white/10 flex items-center justify-center gap-4 text-zinc-600">
                <Plus size={16} />
                <span className="font-mono text-[9px] font-black uppercase tracking-[0.4em]">SPAWN_SPECIALIST</span>
            </button>
        </div>
    );

    return (
        <section ref={containerRef} className="py-16 md:py-24 bg-black relative overflow-hidden noise-overlay border-t border-white/5" id="agents">
            <div className="scanline" />

            {/* Architectural Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                {/* ACT HEADER: Agent Swarm Orchestration */}
                <div className="mb-12 md:mb-16 space-y-6 md:space-y-10">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-5 py-2 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-primary"
                        >
                            <Users size={14} className="animate-pulse" />
                            MULTI_AGENT_ORCHESTRATION_L5
                        </motion.div>

                        <h2 className="text-5xl md:text-[8rem] font-display font-black text-white tracking-tight leading-[0.8] uppercase">
                            Multiply <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white/10">Your Genius.</span>
                        </h2>

                        <p className="text-zinc-500 font-light text-lg md:text-2xl max-w-4xl uppercase tracking-tight">
                            You are the Architect. Oraya gives you a <span className="text-white italic">Sovereign Swarm</span>—a team of specialized agents that execute your vision while you focus on the $18M ideas.
                        </p>
                    </div>
                </div>

                <ResponsiveSwitcher mobile={mobileView} desktop={desktopView} />
            </div>
        </section>
    );
}
