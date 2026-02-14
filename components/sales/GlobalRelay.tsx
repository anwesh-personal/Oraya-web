"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Zap, Shield, Activity, Globe, Cpu, Server, Network } from "lucide-react";
import { useState } from "react";

const nodes = [
    { city: "San Francisco", status: "Nominal", color: "#00F0FF", top: "35%", left: "12%", latency: "12ms" },
    { city: "London", status: "Secure", color: "#00F0FF", top: "25%", left: "44%", latency: "28ms" },
    { city: "Tokyo", status: "Active", color: "#00F0FF", top: "32%", left: "84%", latency: "42ms" },
    { city: "Berlin", status: "Optimal", color: "#FF00AA", top: "28%", left: "49%", latency: "31ms" },
    { city: "Bangalore", status: "Active", color: "#FF00AA", top: "52%", left: "68%", latency: "48ms" },
    { city: "Sydney", status: "Nominal", color: "#00F0FF", top: "72%", left: "85%", latency: "56ms" },
    { city: "São Paulo", status: "Secure", color: "#FF00AA", top: "65%", left: "28%", latency: "39ms" },
    { city: "Singapore", status: "Syncing", color: "#00F0FF", top: "58%", left: "75%", latency: "15ms" },
];

export default function GlobalRelay() {
    const [hoveredNode, setHoveredNode] = useState<number | null>(null);

    return (
        <section className="py-24 md:py-40 bg-black relative overflow-hidden noise-overlay">
            {/* Deep Atmospheric Backdrop */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[100%] bg-[radial-gradient(circle_at_center,#00F0FF05_0%,transparent_60%)]" />
                <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-10 relative z-10 text-center">
                {/* Header Section with breathing space */}
                <div className="space-y-8 mb-20 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-4 px-6 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-[#00F0FF] glass shadow-2xl"
                    >
                        <Radio size={14} className="animate-pulse" />
                        Intelligence_Sovereignty_Relay
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-6xl font-sans font-black text-white tracking-tight leading-[1.05] uppercase"
                    >
                        Global. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/40 to-white/10">Infrastructures.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl text-zinc-500 font-sans font-light leading-relaxed max-w-3xl mx-auto tracking-wide"
                    >
                        Distribute your cognition across 8 global nodes without sacrificing owner control.
                        Oraya scales with you, locally and globally.
                    </motion.p>
                </div>

                {/* THE TACTICAL MAP CENTERPIECE */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5 }}
                    className="relative w-full max-w-[1400px] mx-auto rounded-[60px] overflow-hidden border border-white/[0.06] bg-[#050505] shadow-[0_100px_250px_-50px_rgba(0,0,0,1)]"
                >
                    <div className="relative aspect-[16/9] overflow-hidden group">
                        <Image
                            src="/assets/Assets/global_map_tactical.png"
                            alt="Oraya Global Tactical Network"
                            fill
                            className="object-cover opacity-60 group-hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-[2s] ease-out scale-105 group-hover:scale-100"
                            priority
                        />

                        {/* Animated Interactivity */}
                        <div className="absolute inset-0 bg-black/40 mix-blend-multiply transition-opacity group-hover:opacity-20" />

                        {/* City Nodes */}
                        {nodes.map((node, i) => (
                            <motion.div
                                key={i}
                                onMouseEnter={() => setHoveredNode(i)}
                                onMouseLeave={() => setHoveredNode(null)}
                                className="absolute z-20 cursor-pointer group/node"
                                style={{ top: node.top, left: node.left }}
                            >
                                {/* Shockwave Ring */}
                                <motion.div
                                    animate={{ scale: [1, 4], opacity: [0.4, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                                    className="absolute -inset-6 rounded-full border border-[#00F0FF]/30"
                                />

                                {/* Core Dot */}
                                <div className="relative">
                                    <div
                                        className="w-3 h-3 rounded-full bg-[#00F0FF] shadow-[0_0_20px_#00F0FF] group-hover/node:scale-150 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#00F0FF] animate-ping opacity-40" />
                                </div>

                                {/* Premium Tactical Tooltip */}
                                <AnimatePresence>
                                    {hoveredNode === i && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute -top-24 left-1/2 -translate-x-1/2 pointer-events-none z-50 min-w-[180px]"
                                        >
                                            <div className="bg-black/80 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-3xl">
                                                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                                    <span className="text-[10px] font-mono font-black text-[#00F0FF] uppercase tracking-widest">{node.city}</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[9px] font-mono text-white/40">
                                                        <span>LATENCY</span>
                                                        <span className="text-white">{node.latency}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[9px] font-mono text-white/40">
                                                        <span>PROTOCOL</span>
                                                        <span className="text-white">SOV_REH_0.1</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}

                        {/* Live Log Widget (Industrial HUD) */}
                        <div className="absolute bottom-12 left-12 p-8 glass rounded-[32px] border border-white/5 space-y-4 max-w-[300px] hidden lg:block">
                            <div className="flex items-center gap-3">
                                <Activity className="text-[#BF00FF]" size={16} />
                                <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em]">Live_Stream</span>
                            </div>
                            <div className="space-y-1.5 text-[9px] font-mono text-white/20 uppercase tracking-widest leading-loose">
                                <p className="text-emerald-500/60">[08:44:12] Handshake complete sf_1</p>
                                <p>[08:44:13] Context shard sync: 14%</p>
                                <p>[08:44:15] Global relay resonance active</p>
                                <p className="text-[#00F0FF]">[ALERT] Tokyo node throughput peak</p>
                            </div>
                        </div>

                        {/* Top Stats HUD */}
                        <div className="absolute top-12 right-12 flex items-center gap-12 font-mono text-[10px] text-zinc-500 tracking-[0.5em] hidden md:flex">
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-white font-black">12.1 PB/S</span>
                                <span>THROUGHPUT</span>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[#00F0FF] font-black">99.999%</span>
                                <span>SOVEREIGN_UPTIME</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* CAPABILITY TILES - Simplified for Breathing room */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mt-40 text-left">
                    <CapabilityItem
                        icon={Server}
                        title="Decentralized Shards"
                        desc="Project context is fragmented and distributed across your own nodes."
                    />
                    <CapabilityItem
                        icon={Shield}
                        title="Quantum Shield"
                        desc="Hardware-level verification for every byte and packet transmitted."
                    />
                    <CapabilityItem
                        icon={Zap}
                        title="Lightweight Sync"
                        desc="Incremental differential sync ensures sub-10ms cognitive recovery."
                    />
                    <CapabilityItem
                        icon={Network}
                        title="Resistant Mesh"
                        desc="Peer-to-peer relay that works even when the public internet is down."
                    />
                </div>
            </div>
        </section>
    );
}

function CapabilityItem({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="p-10 rounded-[40px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-[#00F0FF]/30 transition-all duration-500 group"
        >
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-[#00F0FF] group-hover:bg-[#00F0FF] group-hover:text-black transition-all duration-500 mb-8">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            <h4 className="text-white font-black text-xl mb-4 tracking-tight uppercase">{title}</h4>
            <p className="text-zinc-500 font-sans font-light text-base leading-relaxed group-hover:text-zinc-400 transition-colors">
                {desc}
            </p>
        </motion.div>
    );
}
