
"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Zap } from "lucide-react";

export default function TheCore() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

    return (
        <section ref={ref} className="bg-black py-40 overflow-hidden relative">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] -translate-x-1/2 -translate-y-1/2 bg-[#FF00AA]/30 blur-[200px] rounded-full pointer-events-none" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
                <motion.div
                    style={{ scale, opacity }}
                    className="mb-12 relative w-full max-w-4xl h-[400px] md:h-[600px]"
                >
                    {/* Brain Image - The ONE time it's used */}
                    <Image
                        src="/assets/Assets/brain.png"
                        alt="Oraya Neural Core"
                        fill
                        className="object-contain animate-pulse-slow drop-shadow-[0_0_50px_rgba(255,0,170,0.5)]"
                    />
                </motion.div>

                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    className="max-w-3xl space-y-6"
                >
                    <div className="flex items-center justify-center gap-2 text-[#FF00AA] font-mono text-xs font-bold uppercase tracking-widest mb-4">
                        <Zap size={14} className="animate-pulse" />
                        Neural Architecture v3.0
                    </div>

                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white leading-none tracking-tight">
                        The Engine That <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF00AA] via-white to-[#FF00AA] bg-[length:200%_auto] animate-gradient-x">
                            Never Sleeps.
                        </span>
                    </h2>

                    <p className="text-xl md:text-2xl text-zinc-400 font-light leading-relaxed">
                        While you rest, Oraya's "Dream State" re-indexes your codebase,
                        optimizing context paths and pre-fetching dependencies.
                        It wakes up smarter than you left it.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
