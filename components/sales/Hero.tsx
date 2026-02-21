"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Download, ChevronDown, Shield, Cpu, Activity, Box, Globe, Zap, Network, Lock, Command } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SalesHero() {
    const ref = useRef(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const productY = useTransform(scrollYProgress, [0, 1], [0, 250]);
    const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

    // Spring-loaded mouse tracking for 3D tilt
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

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    // Secret Revelation Discovery (Hold 'CMD' or 'CTRL')
    const [isRevealed, setIsRevealed] = useState(false);
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) setIsRevealed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.metaKey && !e.ctrlKey) setIsRevealed(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    return (
        <section
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative min-h-[90vh] md:min-h-[100vh] flex flex-col items-center overflow-hidden bg-black noise-overlay"
        >
            {/* 1. ATMOSPHERIC BACKGROUND */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div
                    animate={{
                        opacity: isRevealed ? 0.2 : 0.05,
                        scale: isRevealed ? 1.4 : 1
                    }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_40%,var(--secondary-glow)_0%,transparent_70%)] transition-all duration-1000"
                />
                {/* Enhanced Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] md:bg-[size:160px_160px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
            </div>

            {/* 2. REVELATION OVERLAY (The "Magic") */}
            <AnimatePresence>
                {isRevealed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 bg-black/80 backdrop-blur-[20px] flex items-center justify-center pointer-events-none"
                    >
                        {/* Telemetry Strings & Shards */}
                        <div className="absolute inset-0 overflow-hidden opacity-20">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: "-100%", opacity: 0 }}
                                    animate={{ x: "100%", opacity: [0, 0.3, 0] }}
                                    transition={{ duration: 12 + i * 3, repeat: Infinity, ease: "linear", delay: i * 2 }}
                                    className="absolute font-mono text-[8px] text-secondary whitespace-nowrap uppercase tracking-[1.2em]"
                                    style={{ top: `${15 + i * 15}%` }}
                                >
                                    {`DECRYPTING_SLICE_${i} // NODE_CLUSTER_${(i * 44).toString(16)} // PARALLEL_NEURAL_RECONSTRUCTION //`}
                                </motion.div>
                            ))}
                        </div>

                        <div className="text-center space-y-10 relative z-10 px-6">
                            <motion.div
                                animate={{ scale: [0.99, 1.01, 0.99], opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 5, repeat: Infinity }}
                                className="font-display text-[15vw] md:text-[10vw] font-black text-primary tracking-tight uppercase leading-none"
                            >
                                KERNEL_LIVE
                            </motion.div>
                            <div className="flex flex-col items-center gap-6">
                                <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                                    <div className="text-[10px] font-mono text-primary/60 uppercase tracking-[1em] font-black">STREAMING_WEIGHTS</div>
                                    <div className="text-[10px] font-mono text-secondary/60 uppercase tracking-[1em] font-black">BYPASSING_RESTRICTIONS</div>
                                </div>
                                <div className="h-[1px] w-48 md:w-80 bg-white/5" />
                                <div className="text-[9px] font-mono text-white/20 uppercase tracking-[1.2em]">SYSTEM_VERSION_3.0.2</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. HEADLINE SECTION */}
            <motion.div
                style={{ opacity }}
                className="relative z-10 pt-32 md:pt-56 pb-16 md:pb-24 text-center max-w-7xl mx-auto px-6 flex flex-col items-center"
            >
                {/* Status Badge */}
                <motion.button
                    onClick={() => setIsRevealed(!isRevealed)}
                    className="inline-flex items-center gap-4 px-7 py-3.5 mb-12 md:mb-20 bg-white/[0.02] border border-white/[0.06] rounded-full glass group cursor-pointer active:scale-95 transition-all"
                >
                    <div className="relative">
                        <div className={cn("w-2 h-2 rounded-full transition-colors duration-500", isRevealed ? "bg-secondary shadow-[0_0_15px_var(--secondary-glow)]" : "bg-primary shadow-[0_0_15px_var(--primary-glow)]")} />
                        <div className={cn("absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-40 transition-colors duration-500", isRevealed ? "bg-secondary" : "bg-primary")} />
                    </div>
                    <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.6em] flex items-center gap-2">
                        {isRevealed ? "PROTOCOL: REVEALED // 15.4MB" : "L5 Sovereign Kernel // Active"}
                        <Command size={10} className="md:hidden opacity-40" />
                    </span>
                </motion.button>

                {/* The Responsive Headline */}
                <h1 className="text-[clamp(2rem,6vw,6rem)] font-display font-black leading-[0.95] text-white uppercase relative">
                    <motion.span
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 mb-3"
                    >
                        THE PRIVATE
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary via-[70%] to-secondary drop-shadow-[0_0_60px_var(--primary-glow)]"
                    >
                        OPERATING SYSTEM <br />
                        <span className="text-[0.6em] tracking-tight opacity-30">FOR THE 1%.</span>
                    </motion.span>
                </h1>

                {/* Subtitle & Scanning Line Bridge */}
                <div className="mt-16 md:mt-24 space-y-16">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="text-lg md:text-2xl text-zinc-600 font-sans font-extralight max-w-4xl mx-auto leading-relaxed tracking-wider px-4"
                    >
                        Stop renting your intelligence from the cloud.
                        <br className="hidden md:block" />
                        <span className="text-white/80 font-normal mt-6 block text-base md:text-lg">Oraya is a native neural interface that lives on your hardware, remembers every line of your history, and executes at the speed of thought. You aren&apos;t just coding; <span className="text-primary font-black uppercase">you&apos;re orchestrating.</span></span>
                    </motion.p>

                    {/* THE LINE: Clearly visible with depth effect */}
                    <div className="h-[1px] w-80 mx-auto relative overflow-hidden bg-white/5">
                        <motion.div
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent shadow-[0_0_20px_var(--primary)]"
                        />
                    </div>
                </div>

                {/* Responsive CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12 mt-12 md:mt-16 w-full sm:w-auto px-6">
                    <Link
                        href="/download"
                        className="w-full sm:w-auto group relative px-10 md:px-16 py-5 md:py-7 bg-primary text-black font-black rounded-[24px] md:rounded-[32px] text-lg md:text-xl hover:scale-105 transition-all duration-500 shadow-[0_20px_100px_-20px_var(--primary-glow)] overflow-hidden"
                    >
                        <div className="flex items-center justify-center gap-4 relative z-10 uppercase tracking-widest">
                            <Download size={20} strokeWidth={3} />
                            Deploy
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </Link>
                    <Link
                        href="/manifesto"
                        className="w-full sm:w-auto px-10 md:px-12 py-5 md:py-7 bg-black border border-white/10 text-white font-black rounded-[24px] md:rounded-[32px] text-lg md:text-xl hover:border-white/30 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-4 glass group"
                    >
                        <span className="uppercase tracking-widest">Read Vision</span>
                        <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
                    </Link>
                </div>
            </motion.div>

            {/* 4. THE INTERACTIVE CENTERPIECE - Responsive Scaling Focus */}
            <motion.div
                ref={containerRef}
                style={{
                    y: productY,
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d"
                }}
                className="relative w-full max-w-[1500px] mx-auto mt-20 md:mt-40 px-4 md:px-10 z-20 perspective-3000"
            >
                <div className="relative group rounded-[32px] md:rounded-[60px] overflow-hidden bg-[#050505] border border-white/[0.08] shadow-[0_80px_200px_-50px_rgba(0,0,0,0.8)]">

                    {/* Minimalist Dashboard Interface */}
                    <div className="h-10 md:h-16 bg-white/[0.02] border-b border-white/[0.04] flex items-center px-6 md:px-10 justify-between">
                        <div className="flex gap-2 md:gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        </div>
                        <div className="hidden sm:flex bg-white/[0.04] border border-white/5 rounded-2xl px-8 md:px-20 py-1.5 items-center gap-3">
                            <Lock size={10} className="text-white/20" />
                            <span className="text-[9px] md:text-[11px] font-mono text-white/30 lowercase tracking-[0.2em]">oraya://private-access</span>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="flex items-center gap-2">
                                <Activity size={10} className="text-emerald-500/40 animate-pulse" />
                                <span className="text-[8px] md:text-[9px] font-mono text-emerald-500/40 uppercase">LIVE</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative aspect-[16/10] md:aspect-[16/8] overflow-hidden">
                        <Image
                            src="/assets/screenshots/ss2.png"
                            alt="Oraya Neural Core Dashboard"
                            fill
                            className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100"
                            priority
                        />

                        <motion.div
                            className="absolute top-10 left-10 md:top-16 md:left-16 glass-card p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/10 space-y-4 md:space-y-6 hidden sm:block shadow-2xl overflow-hidden"
                            style={{ backgroundColor: 'var(--surface-50)', translateZ: 80 }}
                        >
                            {/* Scanning Border Animation */}
                            <motion.div
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-40"
                            />

                            <div className="flex items-center gap-3 md:gap-4 relative z-10">
                                <Cpu className="text-primary" size={20} />
                                <span className="text-[10px] md:text-[12px] font-mono font-black text-white/70 uppercase tracking-[0.4em]">NEURAL_BANDWIDTH</span>
                            </div>
                            <div className="w-48 md:w-64 h-1 bg-white/5 rounded-full overflow-hidden relative z-10">
                                <motion.div
                                    animate={{ width: ["20%", "70%", "45%", "90%", "30%"] }}
                                    transition={{ duration: 15, repeat: Infinity }}
                                    className="h-full bg-gradient-to-r from-primary to-secondary"
                                />
                            </div>
                        </motion.div>

                        {/* EPIC 3D BRAIN - Now scaling for all screens */}
                        <motion.div
                            style={{ translateZ: 140 }}
                            className="absolute -right-20 -top-20 md:-right-40 md:-top-40 z-30 opacity-60 md:opacity-100"
                        >
                            <motion.div
                                animate={{
                                    y: [0, -30, 0],
                                    rotateY: [-4, 4, -4],
                                    scale: [0.95, 1.05, 0.95]
                                }}
                                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Image
                                    src="/assets/Assets/brain_tactical.png"
                                    alt="Synaptic Interface"
                                    width={700}
                                    height={700}
                                    className="w-[350px] md:w-[700px] object-contain drop-shadow-[0_0_150px_rgba(0,240,255,0.3)] filter contrast-125"
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* Floating Node Labels - Positioned for Air */}
                <FloatingLabel label="LOCAL_NEURAL" delay={1} position="top-[-15%] left-[-10%]" />
                <FloatingLabel label="E2EE_RELAY" delay={1.2} position="bottom-[-5%] left-[-15%]" />
                <FloatingLabel label="ZERO_TELEMETRY" delay={1.4} position="top-[30%] right-[-15%]" />
            </motion.div>

            {/* Instruction Footer - Improved for Mobile */}
            <div className="absolute bottom-12 md:bottom-20 flex flex-col items-center gap-4 md:gap-6 z-30 text-center px-8">
                <p className="text-[8px] md:text-[10px] font-mono text-white/30 uppercase tracking-[0.5em] md:tracking-[0.8em] animate-pulse">
                    Hold <span className="text-[#00F0FF] font-black border-b border-[#00F0FF]/30 pb-0.5">CMD</span> {` / `} Tap Pulse to reveal System Telementry
                </p>
                <div className="h-12 md:h-20 w-[1px] bg-gradient-to-b from-white/30 via-white/5 to-transparent shadow-[0_0_10px_white]" />
            </div>
        </section>
    );
}

function FloatingLabel({ label, delay, position }: { label: string; delay: number; position: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute ${position} z-20 hidden lg:flex`}
        >
            <motion.div
                whileHover={{ scale: 1.05, x: 5 }}
                className="px-6 py-4 bg-white/[0.02] border border-white/[0.1] rounded-[24px] backdrop-blur-3xl glass flex items-center gap-4 group hover:border-[#00F0FF]/40 transition-all duration-700 shadow-2xl"
            >
                <div className="w-2 h-2 rounded-full bg-[#00F0FF] group-hover:animate-ping" />
                <span className="text-[11px] font-mono font-black text-white/40 group-hover:text-white uppercase tracking-[0.4em] transition-colors">{label}</span>
            </motion.div>
        </motion.div>
    );
}
