"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BrainCog, Unplug, ShieldAlert, AlertCircle, ChevronRight } from "lucide-react";

export default function ProblemSection() {
    return (
        <section id="problem" className="relative py-24 md:py-32 bg-black text-white overflow-hidden noise-overlay">
            {/* Ambient Red Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-red-900/[0.03] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-10 relative z-10 text-center">

                {/* Agitation Header */}
                <div className="space-y-8 mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-4 px-6 py-2 bg-red-500/5 text-red-500 border border-red-500/20 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.5em] backdrop-blur-3xl"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        System_Redundancy_Warning
                    </motion.div>

                    <h2 className="text-5xl md:text-6xl font-sans font-black tracking-tight leading-[1.05] uppercase">
                        The Cloud <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-[length:200%_auto] animate-gradient-x">
                            Is Broken.
                        </span>
                    </h2>

                    <p className="text-2xl md:text-3xl text-zinc-500 font-sans font-light leading-relaxed max-w-4xl mx-auto tracking-wide">
                        Most AI tools are <span className="text-white italic">toys</span>—web wrappers that leak your data and forget your context every 20 minutes. You&apos;re building the future on <span className="text-white font-medium">&quot;Rented Land.&quot;</span> I built a fortress.
                    </p>
                </div>

                {/* Problems Grid - Simplified & Spacious */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <ProblemTile
                        icon={BrainCog}
                        title="Cognitive Amnesia"
                        desc="Current AI has the memory of a goldfish. Oraya uses a Neural Graph to ensure you never have to explain your architectural decisions twice."
                        delay={0.1}
                    />
                    <ProblemTile
                        icon={Unplug}
                        title="The Latency Tax"
                        desc="Waiting 3 seconds for a server in Ohio to think is a choice. Oraya&apos;s local-native speed makes it feel like an extension of your own nervous system."
                        delay={0.2}
                    />
                    <ProblemTile
                        icon={ShieldAlert}
                        title="Privacy Roulette"
                        desc="Sending your proprietary logic to a cloud void is negligence. We don&apos;t just &quot;secure&quot; your data; we keep it physically isolated in your RAM."
                        delay={0.3}
                    />
                </div>

                {/* Call to Transition */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1 }}
                    className="mt-40 flex items-center justify-center gap-6 group cursor-pointer"
                >
                    <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-red-500/30" />
                    <span className="font-mono text-[11px] text-red-500/40 uppercase tracking-[0.6em] group-hover:text-red-500 transition-colors">Initiate protocol transformation</span>
                    <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-red-500/30" />
                </motion.div>
            </div>
        </section>
    );
}

function ProblemTile({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="p-12 rounded-[50px] bg-white/[0.01] border border-white/[0.05] hover:border-red-500/20 hover:bg-red-500/[0.01] transition-all duration-700 text-left group"
        >
            <div className="w-20 h-20 rounded-[30px] bg-white/5 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-black transition-all duration-700 mb-10">
                <Icon size={32} strokeWidth={1} />
            </div>
            <h3 className="text-3xl font-sans font-black text-white mb-6 uppercase tracking-tighter transition-colors group-hover:text-red-500">
                {title}
            </h3>
            <p className="text-lg text-zinc-500 font-sans font-light leading-relaxed group-hover:text-zinc-400 transition-colors">
                {desc}
            </p>
        </motion.div>
    );
}
