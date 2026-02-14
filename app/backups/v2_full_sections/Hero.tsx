"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Download, ChevronDown, Play } from "lucide-react";
import Link from "next/link";

export default function SalesHero() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.98]);

    return (
        <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-32">

            {/* Ambient Background */}
            <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#00F0FF]/[0.02] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-[#FF00AA]/[0.02] rounded-full blur-[100px] pointer-events-none" />

            <motion.div style={{ opacity, scale }} className="relative z-10 text-center max-w-5xl mx-auto px-6 space-y-12">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-full backdrop-blur-xl text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest hover:border-white/20 transition-all cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                        Now Available on macOS, Windows &amp; Linux
                    </div>
                </motion.div>

                {/* Headline */}
                <div className="space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-[100px] font-bold tracking-tight leading-[0.95]"
                    >
                        <span className="text-white">The OS for</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#FF00AA]">
                            Artificial Intelligence.
                        </span>
                    </motion.h1>
                </div>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-xl md:text-2xl text-zinc-200 font-normal leading-relaxed max-w-2xl mx-auto"
                >
                    Unify your code, documentation, and context into a single self-healing neural interface.
                    <span className="text-white font-medium"> Local-first. Private. Free.</span>
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Link
                        href="/download"
                        className="group relative px-12 py-5 bg-white text-black font-black rounded-2xl text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:shadow-[0_0_80px_rgba(0,240,255,0.25)] flex items-center gap-3 overflow-hidden"
                    >
                        {/* Shine Sweep */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <Download size={20} strokeWidth={3} className="relative z-10" />
                        <span className="relative z-10">Download Oraya</span>
                    </Link>
                    <Link
                        href="/manifesto"
                        className="px-10 py-5 bg-transparent border-2 border-white/10 text-white font-bold rounded-2xl text-lg hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2"
                    >
                        Read manifesto
                    </Link>
                </motion.div>
            </motion.div>

            {/* Video Placeholder */}
            <motion.div
                style={{ y }}
                initial={{ opacity: 0, y: 60, rotateX: 5 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 1.2, delay: 1 }}
                className="relative w-full max-w-6xl mx-auto mt-24 px-6 z-10"
            >
                <div className="group relative rounded-3xl overflow-hidden bg-[#080808] border border-white/[0.08] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] aspect-video flex items-center justify-center cursor-pointer hover:border-white/20 transition-all duration-500">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0a0a0a_0%,#000000_100%)]" />

                    {/* Subtle Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />

                    {/* Play Button */}
                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-white/20 bg-white/[0.05] backdrop-blur-xl flex items-center justify-center group-hover:border-[#00F0FF]/50 group-hover:bg-[#00F0FF]/10 group-hover:shadow-[0_0_40px_rgba(0,240,255,0.2)] transition-all duration-500"
                        >
                            <Play size={32} className="text-white/70 group-hover:text-[#00F0FF] transition-colors ml-1" fill="currentColor" />
                        </motion.div>
                        <span className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                            Watch Demo
                        </span>
                    </div>

                    {/* Corner Decorations */}
                    <div className="absolute top-6 left-6 font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                        Oraya_Demo // v2.0
                    </div>
                    <div className="absolute top-6 right-6 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                        <span className="font-mono text-[10px] text-zinc-600">REC</span>
                    </div>
                    <div className="absolute bottom-6 left-6 font-mono text-[10px] text-zinc-700">
                        00:00 / 03:42
                    </div>
                    <div className="absolute bottom-6 right-6 font-mono text-[10px] text-zinc-700">
                        1080p
                    </div>
                </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20"
            >
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.4em] animate-pulse">Engage</span>
                <ChevronDown size={20} className="text-zinc-400" />
            </motion.div>
        </section>
    );
}
