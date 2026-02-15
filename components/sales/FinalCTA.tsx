"use client";

import { motion } from "framer-motion";
import { Download, ArrowRight, Activity, Terminal, Shield } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FinalCTA() {
    return (
        <section className="py-16 bg-transparent relative overflow-hidden" id="final-cta">
            {/* Massive Convergence Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary/[0.02] rounded-full blur-[200px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/[0.01] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10 text-center space-y-16">

                <div className="space-y-12 flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40 shadow-2xl"
                    >
                        <Activity size={14} className="text-primary/40" />
                        TERMINAL_RESONANCE_ESTABLISHED
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-[clamp(3rem,7.5vw,9rem)] font-display font-black text-white leading-[0.95] uppercase"
                    >
                        Reclaim <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-white/10">Your Context.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl md:text-3xl text-zinc-500 font-sans font-extralight leading-relaxed max-w-4xl mx-auto uppercase"
                    >
                        Your logic on your machine. <br />
                        Deploy the <span className="text-white/60 italic font-normal">Architect&apos;s Second Brain</span> today.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-16"
                >
                    <Link
                        href="/download"
                        className="group relative px-20 py-8 bg-primary text-black font-mono font-black rounded-[24px] text-xl uppercase tracking-[0.4em] overflow-hidden shadow-2xl hover:bg-white transition-all duration-1000"
                    >
                        <span className="relative z-10 flex items-center gap-8">
                            <Download size={28} strokeWidth={2} />
                            Initialize_Deploy
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </Link>

                    {/* Technical Asset Metadata */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 text-zinc-700 font-mono text-[10px] uppercase tracking-[0.5em]">
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-zinc-800">VERSION_V5.01</div>
                            <div className="w-16 h-[1px] bg-white/[0.05]" />
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-zinc-800">SIZE_18.9MB</div>
                            <div className="w-16 h-[1px] bg-white/[0.05]" />
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-zinc-800">ENCLAVE_ACTIVE</div>
                            <div className="w-16 h-[1px] bg-white/[0.05]" />
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-zinc-800">OS_STABLE</div>
                            <div className="w-16 h-[1px] bg-white/[0.05]" />
                        </div>
                    </div>
                </motion.div>

                <div className="pt-32 flex flex-col items-center gap-16 opacity-10 group transition-all duration-1000 hover:opacity-40">
                    <div className="flex items-center gap-24">
                        <Shield size={36} strokeWidth={1} />
                        <Terminal size={36} strokeWidth={1} />
                        <Activity size={36} strokeWidth={1} />
                    </div>
                    <div className="text-[11px] font-mono text-zinc-600 uppercase tracking-[1.2em] group-hover:text-primary transition-colors duration-1000">
                        Sovereignty_Is_Yours
                    </div>
                </div>
            </div>
        </section>
    );
}
