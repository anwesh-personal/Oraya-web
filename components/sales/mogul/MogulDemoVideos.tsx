"use client";

import { motion } from "framer-motion";
import { Play, Layers, SwatchBook, Zap, Expand } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SalesLightbox } from "../ui/SalesLightbox";

const DEMOS = [
    {
        title: "The context mastering engine",
        subtitle: "Watch Oraya ingest 6 months of disparate threads and create a unified strategy in 12ms.",
        label: "NEURAL_SYNC_DEMO",
        icon: SwatchBook,
        id: "context_mastering"
    },
    {
        title: "swarm orchestration in action",
        subtitle: "Observe 12 specialized agents parallel-processing a complex technical refactor while you take a call.",
        label: "MULTI_AGENT_WORKFLOW",
        icon: Layers,
        id: "swarm_orchestration"
    }
];

export default function MogulDemoVideos() {
    const [selectedDemo, setSelectedDemo] = useState<typeof DEMOS[0] | null>(null);

    return (
        <section className="py-24 bg-black relative overflow-hidden noise-overlay">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24 space-y-8">
                    <div className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40 shadow-2xl">
                        <Zap size={14} className="text-primary/40 animate-pulse" />
                        DOMINION_IN_MOTION_v1
                    </div>
                    <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-display font-black text-white leading-[0.95] uppercase">
                        See the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white/10 italic">Dominion Engine.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-32">
                    {DEMOS.map((demo, i) => {
                        const Icon = demo.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.2 }}
                                className="space-y-10 group relative"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="relative aspect-video rounded-[40px] md:rounded-[60px] overflow-hidden border border-white/10 bg-zinc-900 group-hover:border-primary/40 transition-all duration-700 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] cursor-pointer"
                                    onClick={() => setSelectedDemo(demo)}
                                >
                                    {/* Scanning Border Effect */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30">
                                        <div className="absolute inset-0 border-[2px] border-primary/20 rounded-[40px] md:rounded-[60px]" />
                                        <motion.div
                                            animate={{ top: ["0%", "100%", "0%"] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-0 right-0 h-px bg-primary/40 shadow-[0_0_20px_var(--primary)]"
                                        />
                                    </div>

                                    <Image
                                        src={`/assets/screenshots/ss${i + 1}.png`}
                                        alt={demo.title}
                                        fill
                                        className="object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-1000 scale-110 group-hover:scale-100"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-primary/20"
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.1, backgroundColor: "var(--primary)", color: "black" }}
                                                whileTap={{ scale: 0.9 }}
                                                className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-primary transition-all duration-500 shadow-2xl relative z-10"
                                            >
                                                <Play size={32} fill="currentColor" className="ml-2" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div className="absolute top-8 md:top-12 left-8 md:left-12 flex flex-col gap-2">
                                        <div className="px-5 py-2 bg-black/80 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[10px] font-mono text-white/80 uppercase tracking-widest font-black">{demo.label}</span>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-8 md:bottom-12 right-8 md:right-12">
                                        <Expand size={20} className="text-white/20 group-hover:text-primary transition-colors duration-500" />
                                    </div>
                                </motion.div>

                                <div className="space-y-6 px-10 md:px-4">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors duration-700">
                                            <Icon size={24} strokeWidth={1} />
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none group-hover:text-primary transition-colors">{demo.title}</h3>
                                    </div>
                                    <p className="text-xl text-zinc-500 font-extralight leading-relaxed max-w-xl italic opacity-60 group-hover:opacity-100 transition-opacity">
                                        &quot;{demo.subtitle}&quot;
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <SalesLightbox
                isOpen={!!selectedDemo}
                onClose={() => setSelectedDemo(null)}
                title={selectedDemo?.title || ""}
            />
        </section>
    );
}
