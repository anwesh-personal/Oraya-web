"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Terminal, Shield, Cpu, Zap, Activity } from "lucide-react";
import { useRef } from "react";

export default function Manifesto() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const yPortrait = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const opacityText = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section
            ref={containerRef}
            className="py-12 bg-transparent relative overflow-hidden"
        >
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(217,119,6,0.01)_0%,transparent_50%)] opacity-30" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-start">

                    {/* LEFT: THE ARCHITECT PORTRAIT (PERSONAL PRESENCE) */}
                    <div className="lg:col-span-12 xl:col-span-5 relative group">
                        <motion.div
                            style={{ y: yPortrait }}
                            className="relative aspect-[4/5] rounded-[60px] overflow-hidden border border-white/5 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)]"
                        >
                            <Image
                                src="/architect_authentic_likeness.png"
                                alt="The Architect of Oraya"
                                fill
                                className="object-cover grayscale brightness-75 hover:brightness-100 hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-transparent to-transparent opacity-80" />

                            {/* Personal Meta Badge */}
                            <div className="absolute bottom-10 left-10 p-7 backdrop-blur-3xl bg-black/40 border border-white/10 rounded-[32px] space-y-3">
                                <div className="text-[10px] font-mono text-primary/60 font-black uppercase tracking-[0.5em]">ARCHITECT_IDENT_092</div>
                                <div className="text-2xl font-display font-black text-white uppercase tracking-tight">Anwesh R.</div>
                                <div className="h-[1px] w-full bg-white/10" />
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Sovereign_Kernel_Lead</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating Architectural Data Shards */}
                        <div className="absolute top-[10%] right-[-10%] p-5 bg-white/[0.01] border border-white/5 backdrop-blur-3xl rounded-[24px] hidden xl:block animate-pulse shadow-2xl">
                            <Activity size={12} className="text-zinc-500 mb-3" />
                            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">
                                OBSESSION_LEVEL: 100 <br />
                                PRIVACY_STANCE: ABSOLUTE <br />
                                KERNEL_HEALTH: STABLE
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: THE GENESIS NARRATIVE (THE STORY) */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-20">

                        <div className="space-y-12">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] shadow-2xl"
                            >
                                <Terminal size={14} className="text-primary/40" />
                                <span className="text-white/40">ORIGIN_GENESIS_REPORT</span>
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                style={{ opacity: opacityText }}
                                className="text-4xl md:text-6xl font-display font-black text-white leading-[0.95] uppercase"
                            >
                                I didn&apos;t build <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">a tool.</span> <br />
                                I forged a <br />
                                <span className="underline decoration-primary/20 decoration-8 underline-offset-[-15px]">New Frequency.</span>
                            </motion.h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-10">
                                <p className="text-lg md:text-xl text-zinc-500 font-sans font-extralight leading-relaxed tracking-tight">
                                    Oraya wasn&apos;t born in a boardroom. It didn&apos;t come from a market research deck or a venture capital pitch. It was born in the dark, out of a personal obsession to solve a problem that was driving me insane.
                                </p>
                                <p className="text-lg md:text-xl text-zinc-300 font-sans font-light leading-relaxed tracking-tight">
                                    I was tired of renting my intelligence. I needed a mirror for my mind—not a generic wrapper.
                                </p>
                            </div>
                            <div className="space-y-10 lg:pt-16">
                                <div className="p-10 rounded-[48px] bg-white/[0.01] border border-white/[0.05] backdrop-blur-3xl relative overflow-hidden group hover:border-primary/20 transition-all duration-700 shadow-2xl">
                                    <blockquote className="text-xl md:text-2xl font-display font-black text-white leading-tight uppercase tracking-tight relative z-10">
                                        &quot;Absolute hardware dominion is the only way to win in a post-AI world.&quot;
                                    </blockquote>
                                    <div className="absolute top-0 right-0 p-6 opacity-5">
                                        <Shield size={60} className="text-primary" />
                                    </div>
                                </div>
                                <p className="text-lg text-zinc-500 font-sans font-extralight leading-relaxed tracking-tight">
                                    I built Oraya for myself first. I needed match-speed, memory-history, and absolute privacy. I couldn&apos;t find it in the cloud. So I forged it.
                                </p>
                            </div>
                        </div>

                        {/* The Architect's Proof (Signature/Stamp) */}
                        <div className="pt-24 flex flex-col md:flex-row items-center gap-16 border-t border-white/[0.03]">
                            <div className="flex items-center gap-10">
                                <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center p-2 relative bg-surface-50">
                                    <div className="absolute inset-0 rounded-full border border-primary/10 animate-spin-slow" />
                                    <div className="w-full h-full rounded-full bg-primary/[0.02] flex items-center justify-center font-display font-black text-white/40 text-3xl">
                                        AR
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.5em]">SYSTEM_ARCHITECT_STAMP</div>
                                    <div className="text-white font-display font-black text-2xl uppercase tracking-tight whitespace-nowrap">AUTHENTIC_SOVEREIGNTY_V5</div>
                                </div>
                            </div>


                            <div className="hidden md:block h-12 w-[1px] bg-white/10" />

                            <div className="flex-1 text-center md:text-left">
                                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest leading-loose">
                                    // DEPLOYED_BY_OBSESSION <br />
                                    // NO_VENTURE_CAPITAL_INFLUENCE <br />
                                    // 100%_NATIVE_ENGINEERING
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
