
"use client";

import { motion } from "framer-motion";
import { Download, ArrowRight, Shield, Zap, Globe } from "lucide-react";
import Link from "next/link";

export default function FinalCTA() {
    return (
        <section className="py-40 bg-black relative overflow-hidden">
            {/* Massive Layered Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-[#00F0FF]/[0.06] rounded-full blur-[200px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#FF00AA]/[0.04] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-white/[0.03] rounded-full blur-[60px] pointer-events-none" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:60px_60px]" />

            <div className="max-w-5xl mx-auto px-6 relative z-10 text-center space-y-16">

                {/* Urgency Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center gap-2 px-5 py-2 bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest text-[#00F0FF]">
                        <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
                        Free for Individual Engineers — Forever
                    </div>
                </motion.div>

                {/* Main Headline */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-6xl md:text-8xl lg:text-9xl font-bold text-white tracking-tight leading-[0.85]"
                >
                    Stop Thinking. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#FF00AA]">
                        Start Building.
                    </span>
                </motion.h2>

                {/* Sub-copy */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-xl md:text-2xl text-zinc-400 font-normal leading-relaxed max-w-3xl mx-auto"
                >
                    Join <span className="text-white font-bold">10,000+</span> developers who replaced their entire AI toolchain with one sovereign OS.
                    <br className="hidden md:block" />
                    No credit card. No tracking. No strings.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Link
                        href="/download"
                        className="group relative px-12 py-6 bg-white text-black font-black rounded-2xl text-xl hover:scale-105 transition-all duration-300 shadow-[0_0_60px_rgba(255,255,255,0.15)] hover:shadow-[0_0_80px_rgba(0,240,255,0.25)] flex items-center gap-3 overflow-hidden"
                    >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <Download size={24} strokeWidth={3} className="relative z-10" />
                        <span className="relative z-10">Download Oraya Free</span>
                        <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="/manifesto"
                        className="px-10 py-5 bg-transparent border-2 border-white/10 text-white font-bold rounded-2xl text-lg hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2"
                    >
                        Read the Manifesto
                    </Link>
                </motion.div>

                {/* Trust Signals */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="pt-8 space-y-8"
                >
                    {/* Platform Tags */}
                    <div className="flex items-center justify-center gap-8 text-sm text-zinc-500 font-mono">
                        <span>macOS</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span>Windows</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span>Linux</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span>~15MB</span>
                    </div>

                    {/* Trust Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-full text-[11px] text-zinc-400 font-mono">
                            <Shield size={12} className="text-emerald-400" />
                            Zero data collection
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-full text-[11px] text-zinc-400 font-mono">
                            <Zap size={12} className="text-amber-400" />
                            50ms context rehydration
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-full text-[11px] text-zinc-400 font-mono">
                            <Globe size={12} className="text-blue-400" />
                            Works fully offline
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
