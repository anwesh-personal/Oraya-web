"use client";

import { useEffect, useState, useRef } from "react";
import { Check, X, Shield, Zap, Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

const TRANSFORMATION_DATA = [
    {
        dimension: "Cognitive Context",
        before: "Manual copy-pasting segments into chatbots. Context amnesia every 20 minutes.",
        after: "2M+ Token Memory Palace. If you thought it, wrote it, or researched it—Oraya knows it. Permanently.",
        icon: BrainIcon
    },
    {
        dimension: "Engineering Hook",
        before: "Broadcasting proprietary logic and API keys to cloud black-boxes on rented land.",
        after: "Native Kernel Dominion. A Rust-native engine that hooks directly into your machine's motor cortex.",
        icon: ShieldIcon
    },
    {
        dimension: "Execution Buffer",
        before: "Waiting 5 seconds for cloud-to-browser handshakes on legacy web wrappers.",
        after: "Sovereign Security. 100% hardware isolation. Your data literally cannot leave your physical RAM.",
        icon: ZapIcon
    }
];

export default function TransformationSection() {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    return (
        <section ref={sectionRef} className="py-24 md:py-48 bg-black relative overflow-hidden noise-overlay">
            {/* Ambient Background UI elements */}
            <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-[#00F0FF]/[0.03] rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-[#FF00AA]/[0.03] rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-32 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-[#00F0FF]"
                    >
                        <Activity size={12} className="animate-pulse" />
                        Efficiency_Delta_Report
                    </motion.div>

                    <h2 className="text-5xl md:text-8xl font-sans font-black text-white tracking-tighter leading-[0.9] uppercase">
                        Stop Compromising. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/60 to-white/20">Start Dominating.</span>
                    </h2>
                </div>

                <div className="space-y-12">
                    {TRANSFORMATION_DATA.map((item, i) => (
                        <TransformationRow
                            key={i}
                            {...item}
                            index={i}
                        />
                    ))}
                </div>

                {/* The "Social Proof" Quote - Refined */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-40 max-w-4xl mx-auto text-center p-12 rounded-[40px] border border-white/5 bg-white/[0.01] backdrop-blur-3xl relative group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 via-transparent to-[#FF00AA]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="relative z-10 space-y-10">
                        <blockquote className="text-2xl md:text-4xl font-sans font-black text-white leading-tight italic tracking-tight uppercase">
                            &quot;I used to spend 2 hours a day just re-indexing context. <br className="hidden md:block" />
                            <span className="text-[#00F0FF]">Oraya gave me my life back.</span>&quot;
                        </blockquote>

                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#111] to-[#000] border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-[#0090FF]/50 transition-colors">
                                <span className="text-2xl font-black text-white">AS</span>
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-black text-white tracking-widest uppercase">Alex S.</div>
                                <div className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-[0.3em] font-normal">Principal Architecture // AI Lab</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function TransformationRow({ dimension, before, after, index, icon: Icon }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center group"
        >
            <div className="lg:col-span-3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-600 group-hover:text-[#00F0FF] transition-colors">
                    <Icon size={24} />
                </div>
                <h3 className="text-xl font-sans font-black text-white uppercase tracking-tighter">{dimension}</h3>
            </div>

            <div className="lg:col-span-4 p-8 rounded-3xl border border-white/5 bg-white/[0.01] grayscale group-hover:grayscale-0 transition-all duration-700 opacity-40 group-hover:opacity-100">
                <div className="flex items-center gap-2 text-[10px] font-mono font-black text-red-900/40 uppercase mb-4">
                    <X size={12} /> Legacy_Friction
                </div>
                <p className="text-sm text-zinc-500 font-sans leading-relaxed">
                    {before}
                </p>
            </div>

            <div className="lg:col-span-1 hidden lg:flex items-center justify-center">
                <ChevronRight className="text-white/10 group-hover:text-[#00F0FF] animate-pulse" />
            </div>

            <div className="lg:col-span-4 p-8 rounded-3xl border border-[#00F0FF]/10 bg-[#00F0FF]/5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transform lg:group-hover:translate-x-4 transition-all duration-700">
                <div className="flex items-center gap-2 text-[10px] font-mono font-black text-[#00F0FF] uppercase mb-4">
                    <Check size={12} /> Oraya_Efficiency
                </div>
                <p className="text-base text-white font-sans font-medium leading-relaxed">
                    {after}
                </p>
            </div>
        </motion.div>
    );
}

function BrainIcon(props: any) { return <Cpu {...props} /> }
function ShieldIcon(props: any) { return <Shield {...props} /> }
function ZapIcon(props: any) { return <Zap {...props} /> }
function ChevronRight(props: any) { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 18 15 12 9 6"></polyline></svg> }
