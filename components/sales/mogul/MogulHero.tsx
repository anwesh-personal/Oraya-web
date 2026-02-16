"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Download, ChevronDown, Shield, Cpu, Activity, Lock, Command, Zap, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MogulHero() {
    const ref = useRef(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const productY = useTransform(scrollYProgress, [0, 1], [0, 250]);
    const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 30, stiffness: 120 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    };

    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <section
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
            className="relative min-h-[90vh] md:min-h-[100vh] flex flex-col items-center overflow-hidden bg-black noise-overlay"
        >
            {/* ATMOSPHERIC BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div
                    animate={{
                        opacity: isRevealed ? [0.1, 0.4, 0.1] : 0.1,
                        scale: isRevealed ? [1, 1.2, 1] : 1
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--primary-glow)_0%,transparent_70%)]"
                />
                <div className="absolute inset-0 bg-[url('/assets/Assets/neural_mesh.png')] opacity-10 mix-blend-overlay bg-fixed bg-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:160px_160px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
            </div>

            {/* REVELATION OVERLAY (Profit Visualization) */}
            <AnimatePresence>
                {isRevealed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 bg-black/90 backdrop-blur-[40px] flex items-center justify-center pointer-events-none"
                    >
                        <div className="absolute inset-0 overflow-hidden">
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: "-100%", opacity: 0 }}
                                    animate={{ x: "100%", opacity: [0, 0.4, 0] }}
                                    transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                                    className="absolute font-mono text-[8px] text-primary whitespace-nowrap uppercase tracking-[1.5em] font-black"
                                    style={{ top: `${8 + i * 8}%` }}
                                >
                                    {`OPTIMIZING_ROI // SWARM_AD_SPEND_REDUCTION_${(i * 12).toString()}% // REVENUE_MULTIPLIER_ACTIVE // SCALING_OPERATIONS // DOMINION_ESTABLISHED //`}
                                </motion.div>
                            ))}
                        </div>

                        <div className="text-center relative z-10 px-6 space-y-12">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", damping: 20 }}
                                className="font-display text-[12vw] md:text-[8vw] font-black text-white tracking-tighter uppercase leading-none"
                            >
                                <span className="text-primary italic">TOTAL</span> <br /> DOMINION.
                            </motion.div>
                            <div className="h-[2px] w-64 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent" />
                            <div className="text-[10px] font-mono text-white/40 uppercase tracking-[1.2em]">ORAYA_MOGUL_ENCLAVE_v4.02</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADLINE SECTION */}
            <motion.div
                style={{ opacity }}
                className="relative z-10 pt-32 md:pt-56 pb-16 md:pb-24 text-center max-w-7xl mx-auto px-6 flex flex-col items-center"
            >
                <motion.button
                    onClick={() => setIsRevealed(true)}
                    onMouseEnter={() => setIsRevealed(true)}
                    onMouseLeave={() => setIsRevealed(false)}
                    className="inline-flex items-center gap-4 px-10 py-4 mb-12 md:mb-20 bg-white/[0.02] border border-white/[0.1] rounded-full glass group cursor-pointer active:scale-95 transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                >
                    <div className="relative">
                        <div className={cn("w-3 h-3 rounded-full transition-colors duration-500", isRevealed ? "bg-primary shadow-[0_0_20px_var(--primary-glow)]" : "bg-white/20")} />
                        <div className={cn("absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-40 transition-colors duration-500", isRevealed ? "bg-primary" : "bg-white/20")} />
                    </div>
                    <span className="text-[10px] font-mono font-black text-white/60 uppercase tracking-[0.8em] group-hover:text-primary transition-colors">
                        {isRevealed ? "ACTIVE: REVENUE_PROTOCOL" : "Trigger_Growth_Reveal"}
                    </span>
                </motion.button>

                <h1 className="text-[clamp(2.5rem,7vw,7rem)] font-display font-black leading-[0.95] text-white uppercase relative">
                    <motion.span
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-3"
                    >
                        THE $100M
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary via-[70%] to-secondary drop-shadow-[0_0_60px_var(--primary-glow)]"
                    >
                        OUTPUT ENGINE <br />
                        <span className="text-[0.6em] tracking-tight opacity-30">OWN YOUR GENIUS.</span>
                    </motion.span>
                </h1>

                <div className="mt-16 md:mt-24 space-y-16">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="text-lg md:text-2xl text-zinc-600 font-sans font-extralight max-w-4xl mx-auto leading-relaxed tracking-wider px-4"
                    >
                        Stop renting your productivity from cloud proxies.
                        <br className="hidden md:block" />
                        <span className="text-white/80 font-normal mt-6 block text-base md:text-lg">Oraya is a private AI citadel that lives on your hardware, masters your unique business logic, and creates work at the speed of thought. You aren&apos;t just using AI; <span className="text-primary font-black uppercase">you&apos;re scale-testing your future.</span></span>
                    </motion.p>

                    <div className="h-[1px] w-80 mx-auto relative overflow-hidden bg-white/5">
                        <motion.div
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent shadow-[0_0_20px_var(--primary)]"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12 mt-12 md:mt-16 w-full sm:w-auto px-6">
                    <Link
                        href="/download"
                        className="w-full sm:w-auto group relative px-10 md:px-16 py-5 md:py-7 bg-primary text-black font-black rounded-[24px] md:rounded-[32px] text-lg md:text-xl hover:scale-105 transition-all duration-500 shadow-[0_20px_100px_-20px_var(--primary-glow)] overflow-hidden"
                    >
                        <div className="flex items-center justify-center gap-4 relative z-10 uppercase tracking-widest">
                            <Zap size={20} fill="currentColor" />
                            Claim_Dominion
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </Link>
                    <Link
                        href="/manifesto"
                        className="w-full sm:w-auto px-10 md:px-12 py-5 md:py-7 bg-black border border-white/10 text-white font-black rounded-[24px] md:rounded-[32px] text-lg md:text-xl hover:border-white/30 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-4 glass group"
                    >
                        <span className="uppercase tracking-widest">View Profit Manual</span>
                        <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
                    </Link>
                </div>
            </motion.div>

            {/* INTERACTIVE CENTERPIECE - Simplified for Moguls */}
            <motion.div
                ref={containerRef}
                style={{ y: productY, rotateX, rotateY, transformStyle: "preserve-3d" }}
                className="relative w-full max-w-[1500px] mx-auto mt-20 md:mt-40 px-4 md:px-10 z-20 perspective-3000"
            >
                <div className="relative group rounded-[32px] md:rounded-[60px] overflow-hidden bg-[#050505] border border-white/[0.08] shadow-[0_80px_200px_-50px_rgba(0,0,0,0.8)]">
                    <div className="h-10 md:h-16 bg-white/[0.02] border-b border-white/[0.04] flex items-center px-6 md:px-10 justify-between">
                        <div className="flex gap-2 md:gap-3"><div className="w-2.5 h-2.5 rounded-full bg-white/10" /><div className="w-2.5 h-2.5 rounded-full bg-white/10" /><div className="w-2.5 h-2.5 rounded-full bg-white/10" /></div>
                        <div className="hidden sm:flex bg-white/[0.04] border border-white/5 rounded-2xl px-8 md:px-20 py-1.5 items-center gap-3">
                            <Lock size={10} className="text-white/20" />
                            <span className="text-[9px] md:text-[11px] font-mono text-white/30 lowercase tracking-[0.2em]">oraya://sovereign-profits</span>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6"><div className="flex items-center gap-2"><TrendingUp size={10} className="text-emerald-500/40 animate-pulse" /><span className="text-[8px] md:text-[9px] font-mono text-emerald-500/40 uppercase">ACCELERATING</span></div></div>
                    </div>

                    <div className="relative aspect-[16/10] md:aspect-[16/8] overflow-hidden">
                        <Image src="/assets/screenshots/ss2.png" alt="Oraya Dashboard" fill className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100" priority />

                        <motion.div style={{ translateZ: 80 }} className="absolute top-10 left-10 md:top-16 md:left-16 glass-card p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/10 space-y-4 md:space-y-6 hidden sm:block shadow-2xl">
                            <div className="flex items-center gap-3 md:gap-4 relative z-10">
                                <TrendingUp className="text-primary" size={20} />
                                <span className="text-[10px] md:text-[12px] font-mono font-black text-white/70 uppercase tracking-[0.4em]">OUTPUT_MULTIPLIER</span>
                            </div>
                            <div className="w-48 md:w-64 h-1 bg-white/5 rounded-full overflow-hidden relative z-10"><motion.div animate={{ width: ["40%", "95%", "75%", "100%", "85%"] }} transition={{ duration: 15, repeat: Infinity }} className="h-full bg-gradient-to-r from-primary to-secondary" /></div>
                        </motion.div>

                        <motion.div style={{ translateZ: 140 }} className="absolute -right-20 -top-20 md:-right-40 md:-top-40 z-30 opacity-60 md:opacity-100">
                            <Image src="/assets/Assets/brain_tactical.png" alt="Sovereign Core" width={700} height={700} className="w-[350px] md:w-[700px] object-contain drop-shadow-[0_0_150px_rgba(240,180,41,0.3)] filter contrast-125 saturate-150" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            <div className="absolute bottom-12 md:bottom-20 flex flex-col items-center gap-4 md:gap-6 z-30 text-center px-8">
                <p className="text-[8px] md:text-[10px] font-mono text-white/30 uppercase tracking-[0.5em] md:tracking-[0.8em] animate-pulse">
                    The new standard for high-intensity output
                </p>
                <div className="h-12 md:h-20 w-[1px] bg-gradient-to-b from-white/30 via-white/5 to-transparent shadow-[0_0_10px_white]" />
            </div>
        </section>
    );
}
