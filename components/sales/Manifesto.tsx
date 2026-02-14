"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Terminal } from "lucide-react";

export default function Manifesto() {
    return (
        <section className="py-20 md:py-32 bg-black relative overflow-hidden noise-overlay">
            {/* 1. THE FOUNDATION: Cinematic Monolith Visual */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/assets/Assets/the_frequency.png"
                    alt="The Oraya Frequency Monolith"
                    fill
                    className="object-cover opacity-30 mix-blend-screen scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/30" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_95%)]" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                    {/* LEFT: THE STORYTELLING CORE - Standardized Scaling */}
                    <div className="lg:col-span-12 mb-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full font-mono text-[9px] font-black uppercase tracking-[0.4em] text-[#00F0FF] backdrop-blur-3xl"
                        >
                            <Terminal size={12} className="animate-pulse" />
                            Origin_Frequency // Log_01
                        </motion.div>
                    </div>

                    <div className="lg:col-span-7 space-y-8 text-left">
                        <motion.h3
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-7xl font-sans font-black text-white leading-[1.1] tracking-tight uppercase"
                        >
                            &quot;I didn&apos;t build a tool. <br />
                            I forged a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#FF00AA] animate-gradient-x bg-[length:200%_auto]">New frequency.</span>&quot;
                        </motion.h3>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <p className="text-lg md:text-xl text-zinc-400 font-sans font-light leading-relaxed max-w-xl">
                                Oraya was born from a personal obsession — a drive to unify the chaos of high-performance engineering into a sovereign hardware layer.
                            </p>

                            <div className="relative pl-8 py-4 border-l-2 border-[#00F0FF]/30 space-y-2">
                                <p className="text-xl md:text-2xl text-white font-sans font-black tracking-tight leading-tight italic">
                                    &quot;Absolute hardware dominion for the architects who refuse to compromise.&quot;
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT: THE AGENT INTERFACE - Scaled Down for Elegance */}
                    <div className="lg:col-span-5 flex justify-end">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative group p-8 rounded-[32px] border border-white/10 bg-[#080808]/60 backdrop-blur-3xl shadow-2xl overflow-hidden max-w-md w-full"
                        >
                            <div className="relative z-10 space-y-8">
                                {/* Agent Identity */}
                                <div className="flex items-center gap-6">
                                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10">
                                        <Image
                                            src="/assets/agents/ora-avatar.png"
                                            alt="Ora"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="space-y-0.5 text-left">
                                        <h4 className="text-2xl font-sans font-black text-white tracking-tighter uppercase">ORA</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                                            <span className="text-[8px] font-mono font-bold text-[#00F0FF] uppercase tracking-[0.3em]">ADMIN_KERNEL</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Core Directives - Tighter Spacing */}
                                <div className="space-y-4">
                                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em] mb-2 text-left">// CORE_DIRECTIVES</div>
                                    {[
                                        { id: "01", label: "ABSOLUTE_PRIVACY", detail: "Bios-level isolation" },
                                        { id: "02", label: "INFINITE_CONTEXT", detail: "Neural persistence" },
                                        { id: "03", label: "HARDWARE_DOMINION", detail: "Direct GPU hooks" }
                                    ].map((shard, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#00F0FF]/25 transition-all cursor-default"
                                        >
                                            <span className="text-[#00F0FF] font-mono text-xs font-black">{shard.id}.</span>
                                            <div className="text-left">
                                                <div className="text-sm font-sans font-black text-white tracking-tight uppercase">{shard.label}</div>
                                                <div className="text-[9px] font-mono text-zinc-500 uppercase">{shard.detail}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Call to Engagement */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3.5 bg-[#00F0FF] rounded-xl text-black font-sans font-black tracking-[0.2em] uppercase text-[10px] shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                                >
                                    Access_Kernel
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
