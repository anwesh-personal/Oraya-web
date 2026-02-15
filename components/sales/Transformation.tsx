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
        dimension: "Hardware Dominion",
        before: "Broadcasting proprietary logic and API keys to cloud black-boxes on rented land.",
        after: "Native Kernel Access. A Rust-native engine that hooks directly into your machine's motor cortex.",
        icon: ShieldIcon
    },
    {
        dimension: "Execution Buffer",
        before: "Waiting 5 seconds for cloud-to-browser handshakes on legacy web wrappers.",
        after: "Zero-Latency Sovereignty. 100% hardware isolation. Data literally cannot leave your physical RAM.",
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
        <section ref={sectionRef} className="py-12 bg-surface-0 relative overflow-hidden noise-overlay">
            {/* Ambient Background UI elements */}
            <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary/[0.01] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40 shadow-2xl"
                    >
                        <Activity size={12} className="text-primary/40 animate-pulse" />
                        EFFICIENCY_DELTA_RECONSTRUCTION
                    </motion.div>

                    <h2 className="text-[clamp(2.6rem,6vw,6rem)] font-display font-black text-white leading-[0.95] uppercase">
                        Stop Compromising. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-white/10">Start Dominating.</span>
                    </h2>
                </div>

                <div className="space-y-16">
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
                    className="mt-56 max-w-5xl mx-auto text-center p-16 rounded-[60px] border border-white/[0.04] bg-[#0C0C0C] relative group overflow-hidden shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02]" />

                    <div className="relative z-10 space-y-12">
                        <blockquote className="text-2xl md:text-5xl font-display font-black text-white leading-[0.95] italic uppercase">
                            &quot;I used to spend 2 hours a day just re-indexing context. <br className="hidden md:block" />
                            <span className="text-primary/80 italic underline decoration-primary/20 decoration-8 underline-offset-[-10px]">Oraya gave me my life back.</span>&quot;
                        </blockquote>

                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center bg-surface-50 shadow-2xl">
                                <span className="text-2xl font-black text-white/40 font-display">AS</span>
                            </div>
                            <div className="text-center space-y-2">
                                <div className="text-base font-black text-white tracking-[0.2em] uppercase">Alex S.</div>
                                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em]">Principal Architecture // AI Lab</div>
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
            transition={{ delay: index * 0.1, duration: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center group cursor-default"
        >
            <div className="lg:col-span-3 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-zinc-700 group-hover:text-primary group-hover:bg-primary/[0.05] transition-all duration-700">
                    <Icon size={28} strokeWidth={1} />
                </div>
                <h3 className="text-2xl font-display font-black text-white uppercase transition-all group-hover:translate-x-2">{dimension}</h3>
            </div>

            <div className="lg:col-span-4 p-10 rounded-[40px] border border-white/[0.02] bg-white/[0.005] transition-all duration-1000 opacity-50 group-hover:opacity-100 group-hover:border-white/[0.05]">
                <div className="flex items-center gap-3 text-[10px] font-mono font-black text-zinc-700 uppercase mb-6 tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" /> Legacy_Friction
                </div>
                <p className="text-base text-zinc-400 font-sans font-extralight leading-relaxed italic">
                    {before}
                </p>
            </div>

            <div className="lg:col-span-1 hidden lg:flex items-center justify-center">
                <ChevronRight className="text-white/[0.02] group-hover:text-primary/20 transition-all duration-700 scale-150" />
            </div>

            <div className="lg:col-span-4 p-10 rounded-[40px] border border-primary/[0.05] bg-primary/[0.01] shadow-2xl transition-all duration-1000 group-hover:bg-primary/[0.03] group-hover:border-primary/[0.1] group-hover:translate-x-4">
                <div className="flex items-center gap-3 text-[10px] font-mono font-black text-primary/60 uppercase mb-6 tracking-[0.2em]">
                    <Check size={14} strokeWidth={3} /> Oraya_Efficiency
                </div>
                <p className="text-lg text-white font-sans font-light leading-relaxed">
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
