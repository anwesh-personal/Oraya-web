"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion";
import { BrainCog, Unplug, ShieldAlert, Activity, AlertTriangle, Cpu, Network, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProblemSection() {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { amount: 0.1 });
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    // Parallax intensities for "Corrupted Reality"
    const yFragments = useTransform(scrollYProgress, [0, 1], [0, -400]);
    const rotFragments = useTransform(scrollYProgress, [0, 1], [0, 45]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.4, 0.6], [1, 1, 0.3]);
    const scaleHero = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

    return (
        <section
            ref={sectionRef}
            id="problem"
            className="relative py-12 bg-transparent text-white overflow-hidden"
        >
            {/* The Abyssal Void Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.01)_0%,transparent_80%)] opacity-30" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-24 items-start">

                    {/* LEFT: THE MANIFESTO OF FAILURE */}
                    <div className="lg:col-span-12 text-center mb-20 space-y-16">
                        <motion.div
                            style={{ opacity: opacityHero, scale: scaleHero }}
                            className="space-y-10"
                        >
                            <div className="inline-flex items-center gap-4 px-7 py-2.5 bg-[#121212] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] mx-auto shadow-2xl">
                                <AlertTriangle size={14} className="text-primary/60 animate-pulse" />
                                <span className="text-white/40">ANALYZING_SYSTEM_FAILURE_V4.02</span>
                            </div>

                            <h2 className="text-[clamp(2.6rem,11.25vw,9rem)] font-display font-black leading-[0.9] uppercase">
                                <span className="block text-white/25 font-extralight tracking-[0.2em] mb-4">The Cloud</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-zinc-800 drop-shadow-[0_0_60px_rgba(255,255,255,0.05)]">
                                    Is Broken.
                                </span>
                            </h2>

                            <p className="text-xl md:text-3xl text-zinc-400 font-sans font-extralight max-w-5xl mx-auto leading-snug tracking-tight">
                                Most AI tools are <span className="text-white/60 font-normal">toys</span>—messy web-wrappers that leak your data and forget your context. You’re building the future on <span className="text-white font-black underline decoration-primary/30 decoration-4 underline-offset-8">&quot;Rented Land.&quot;</span>
                            </p>
                        </motion.div>
                    </div>

                    {/* THE INTERVENTION: SHATTERING THE STATUS QUO */}
                    <div className="lg:col-span-12 mb-16 relative group">
                        <div className="relative p-[1px] rounded-[48px] overflow-hidden">
                            {/* The Subtle Current Border */}
                            {isInView && (
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-[-100%] bg-[conic-gradient(transparent_0deg,transparent_300deg,rgba(217,119,6,0.3)_360deg)] pointer-events-none"
                                />
                            )}

                            <div className="relative bg-[#080808] rounded-[47px] p-12 md:p-24 border border-white/5 space-y-12">
                                <div className="max-w-5xl mx-auto text-center space-y-10">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                                        <h3 className="text-[10px] font-mono text-primary font-black uppercase tracking-[0.8em]">THE_GREAT_GASLIGHTING</h3>
                                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                                    </div>

                                    <h4 className="text-3xl md:text-5xl font-display font-black text-white leading-tight uppercase">
                                        We&apos;ve been conditioned to build the future on{" "}
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/40">Broken Infrastructure.</span>
                                    </h4>

                                    <p className="text-lg md:text-xl text-zinc-400 font-sans font-extralight leading-relaxed tracking-tight max-w-4xl mx-auto">
                                        The industry has tricked you into believing that <span className="text-white/60 font-normal">messy web-wrappers</span> are intelligence. That waiting for the <span className="text-white/60 font-normal">spinning wheel</span> is the cost of entry. That leaking your proprietary logic to a third-party server is a necessary tradeoff.
                                    </p>

                                    <div className="text-2xl md:text-3xl font-display font-black text-zinc-300 uppercase tracking-tight">
                                        &quot;It’s not just you. The system is fundamentally rotten.&quot;
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transition Metadata */}
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-40">
                            <div className="w-12 h-px bg-white/10" />
                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.5em]">SYSTEM_AXIS_RECALIBRATION</span>
                            <div className="w-12 h-px bg-white/10" />
                        </div>
                    </div>

                    {/* THE THREE FUNDAMENTAL DECAYS */}
                    <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 relative">

                        {/* DECAY 01: AMNESIA */}
                        <ProblemCard
                            icon={BrainCog}
                            title="Synthetic Amnesia"
                            narrative="LLM wrappers have the memory of a goldfish. They forget your architecture the moment you open a new tab."
                            counter="Oraya uses a Persistent Neural Graph to ensure your decisions from 6 months ago are part of the active context."
                            tag="CONTEXT_DECAY"
                            delay={0.1}
                        />

                        {/* DECAY 02: LATENCY */}
                        <ProblemCard
                            icon={Unplug}
                            title="The Ohio Tax"
                            narrative="Waiting 3 seconds for a cloud RPC call is an engineering failure. It breaks your flow. It breaks your brain."
                            counter="Local-native execution kernel bypasses the internet entirely. Latency reduced from 3s to 12ms."
                            tag="EXECUTION_DELAY"
                            delay={0.2}
                        />

                        {/* DECAY 03: EXPOSURE */}
                        <ProblemCard
                            icon={ShieldAlert}
                            title="IP Negligence"
                            narrative="Broadcasting your proprietary logic to a third-party server is corporate suicide. Your IP is being fed into training loops."
                            counter="Oraya keeps weights on-device. Your logic physically cannot leave your RAM. Isolation is the only security."
                            tag="DATA_EXFIL"
                            delay={0.3}
                        />

                        {/* Mind Blowing Fragments Visualization */}
                        <div className="absolute inset-0 -z-10 overflow-visible pointer-events-none hidden lg:block">
                            <FloatingFragment
                                style={{ y: yFragments, rotate: rotFragments }}
                                className="top-[10%] left-[-10%] w-64 h-64 bg-primary/5 blur-[120px]"
                            />
                        </div>
                    </div>

                    {/* FINAL IMPACT: THE TRANSITION PROTOCOL */}
                    <div className="lg:col-span-12 pt-16 text-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex flex-col items-center gap-8"
                        >
                            <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-red-900/40 to-transparent" />
                            <div className="flex items-center gap-12 font-mono text-[9px] text-zinc-600 uppercase tracking-[0.8em]">
                                <span className="animate-pulse">BOOTING_SOVEREIGN_RECOVERY</span>
                                <span>//</span>
                                <span className="text-white">DEPLOY_PERSISTENCE</span>
                            </div>
                            <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-red-900/40 to-transparent" />
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}

function ProblemCard({ icon: Icon, title, narrative, counter, tag, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="group relative p-8 md:p-12 rounded-[40px] bg-[#0A0A0A] border border-white/5 hover:border-primary/20 transition-all duration-700 overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                <Icon size={120} strokeWidth={0.5} className="text-primary" />
            </div>

            <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-xl">
                        <Icon size={28} strokeWidth={1} />
                    </div>
                    <span className="font-mono text-[8px] text-primary/40 font-black tracking-widest uppercase">{tag}</span>
                </div>

                <div className="space-y-4">
                    <h3 className="text-3xl font-display font-black text-white uppercase group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-base text-zinc-400 font-sans font-light leading-relaxed">
                        {narrative}
                    </p>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-mono font-black text-white/40 uppercase tracking-widest">
                        <Zap size={10} className="text-primary" />
                        Oraya_Solution
                    </div>
                    <p className="text-sm text-zinc-300 font-sans leading-relaxed">
                        &quot;{counter}&quot;
                    </p>
                </div>
            </div>

            {/* Scanning Line Animation */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-1/2 w-full -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite] opacity-0 group-hover:opacity-100 pointer-events-none" />
        </motion.div>
    );
}

function FloatingFragment({ className, style }: any) {
    return (
        <motion.div
            style={style}
            className={cn("absolute rounded-full", className)}
        />
    );
}
