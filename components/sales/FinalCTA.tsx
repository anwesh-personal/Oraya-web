"use client";

import { motion } from "framer-motion";
import { Download, ArrowRight, Activity, Terminal, Shield } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FinalCTA() {
    return (
        <section className="py-24 md:py-48 bg-black relative overflow-hidden noise-overlay border-t border-white/5">
            <div className="scanline" />

            {/* Massive Convergence Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[#00F0FF]/[0.05] rounded-full blur-[200px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF00AA]/[0.05] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10 text-center space-y-24">

                <div className="space-y-10 flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-5 py-2 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.05)]"
                    >
                        <Activity size={14} className="animate-pulse" />
                        TERMINAL_RESONANCE_COMPLETE
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-6xl md:text-[10rem] font-sans font-black text-white tracking-tighter leading-[0.8] uppercase"
                    >
                        Absolute <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#FF00AA] to-[#F0B429]">Authority.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl md:text-3xl text-zinc-500 font-light leading-relaxed max-w-4xl mx-auto uppercase tracking-tighter"
                    >
                        Stop using wrappers. Stop giving your context away. <br />
                        Deploy the <span className="text-white italic">Sovereign Kernel</span> today.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-12"
                >
                    <Link
                        href="/download"
                        className="group relative px-20 py-8 bg-white text-black font-mono font-black rounded-2xl text-xl uppercase tracking-[0.3em] overflow-hidden shadow-[0_20px_80px_-20px_rgba(0,240,255,0.4)] hover:bg-[#00F0FF] transition-all duration-700"
                    >
                        <span className="relative z-10 flex items-center gap-6">
                            <Download size={24} strokeWidth={3} />
                            Initialize_Deploy
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </Link>

                    {/* Technical Asset Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-zinc-600 font-mono text-[9px] uppercase tracking-[0.5em]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="text-zinc-800">VERSION_V4.02</div>
                            <div className="w-12 h-[1px] bg-white/5" />
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="text-zinc-800">SIZE_15.4MB</div>
                            <div className="w-12 h-[1px] bg-white/5" />
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="text-zinc-800">ENCLAVE_READY</div>
                            <div className="w-12 h-[1px] bg-white/5" />
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="text-zinc-800">BINARY_STABLE</div>
                            <div className="w-12 h-[1px] bg-white/5" />
                        </div>
                    </div>
                </motion.div>

                <div className="pt-24 flex items-center justify-center gap-16 opacity-20">
                    <Shield size={32} />
                    <Terminal size={32} />
                    <Activity size={32} />
                </div>
            </div>
        </section>
    );
}
