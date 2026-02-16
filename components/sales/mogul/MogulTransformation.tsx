"use client";

import { useRef } from "react";
import { Check, Shield, Zap, TrendingUp, Users, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useScroll } from "framer-motion";

const MOGUL_DATA = [
    {
        dimension: "Market Context",
        before: "Spending 3 hours daily 'reminding' chatbots about your business goals and marketing strategy.",
        after: "Instant Neural Recall. Oraya masters your entire business logic and applies it to every word it writes. Permanently.",
        icon: Users
    },
    {
        dimension: "Output Speed",
        before: "Waiting on spinning wheels and cloud servers to generate high-stakes marketing content.",
        after: "Zero-Latency Sovereignty. 100% hardware-powered execution that responds faster than you can think.",
        icon: Zap
    },
    {
        dimension: "Safety & Privacy",
        before: "Sharing your most aggressive, proprietary growth strategies with a third-party server in the cloud.",
        after: "Isolaton Enclave. Your strategies, leads, and logic physically cannot leave your machine's RAM.",
        icon: Shield
    }
];

export default function MogulTransformation() {
    const sectionRef = useRef(null);

    return (
        <section ref={sectionRef} className="py-24 bg-surface-0 relative overflow-hidden noise-overlay">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24 space-y-6">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40 shadow-2xl">
                        <TrendingUp size={12} className="text-primary/40" />
                        REVENUE_ACCELERATION_PROTOCOL
                    </motion.div>
                    <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-display font-black text-white leading-[0.95] uppercase">
                        Level Up Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-white/10 text-secondary italic">Output Empire.</span>
                    </h2>
                </div>

                <div className="space-y-16">
                    {MOGUL_DATA.map((item, i) => (
                        <MogulRow key={i} {...item} index={i} />
                    ))}
                </div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} className="mt-48 p-16 rounded-[64px] bg-gradient-to-br from-[#0C0C0C] to-black border border-white/5 text-center space-y-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <blockquote className="text-2xl md:text-5xl font-display font-black text-white leading-[0.95] uppercase relative z-10 italic">
                        &quot;Oraya didn&apos;t just replace my tools. <br className="hidden md:block" />
                        <span className="text-primary tracking-widest">It replaced my fatigue.&quot;</span>
                    </blockquote>
                    <div className="flex flex-col items-center gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40"><Target className="text-primary" size={32} /></div>
                        <div className="text-center">
                            <div className="text-lg font-black text-white uppercase tracking-widest">James V.</div>
                            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em]">Founder // $20M+ Direct Response Agency</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function MogulRow({ dimension, before, after, index, icon: Icon }: any) {
    return (
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center cursor-default group">
            <div className="lg:col-span-3 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-800 group-hover:text-primary transition-colors"><Icon size={24} strokeWidth={1} /></div>
                <h3 className="text-xl font-display font-black text-white uppercase">{dimension}</h3>
            </div>
            <div className="lg:col-span-4 p-8 rounded-[32px] border border-white/5 bg-white/[0.005] opacity-40 group-hover:opacity-100 transition-opacity">
                <p className="text-sm text-zinc-500 font-sans italic">&quot;{before}&quot;</p>
            </div>
            <div className="lg:col-span-1 hidden lg:flex justify-center text-white/5"><Zap size={20} /></div>
            <div className="lg:col-span-4 p-8 rounded-[40px] border border-primary/20 bg-primary/[0.02] shadow-[0_0_50px_-20px_rgba(240,180,41,0.2)] group-hover:border-primary/40 transition-all">
                <div className="flex items-center gap-3 text-[9px] font-mono text-primary font-black uppercase mb-4 tracking-widest"><Check size={12} /> THE_SOVEREIGN_ADVANTAGE</div>
                <p className="text-base text-white font-sans font-light leading-relaxed">{after}</p>
            </div>
        </motion.div>
    );
}
