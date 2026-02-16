"use client";

import { motion } from "framer-motion";
import { Gift, FileText, Bot, ShieldCheck, Sparkles, Command, ArrowRight } from "lucide-react";

const BONUSES = [
    {
        title: "The Sovereign Blueprint Library",
        value: "$997",
        desc: "25+ pre-configured swarm directives for high-stakes marketing, agency scaling, and architecture auditing. Instantly deployable logic patterns.",
        icon: FileText,
        pill: "LIFETIME_ACCESS",
        color: "var(--primary)"
    },
    {
        title: "Swarm Node: Mara v4.0",
        value: "$1,497",
        desc: "Exclusive access to the most aggressive auditing node we've ever built. It scans your logic for 144+ failure points in milliseconds.",
        icon: Bot,
        pill: "Sovereign_Exclusive",
        color: "var(--secondary)"
    },
    {
        title: "The Private Enclave Protocol",
        value: "$497",
        desc: "The step-by-step masterclass on isolating your proprietary logic and securing your machine's motor cortex for total local dominion.",
        icon: ShieldCheck,
        pill: "Tactical_Manual",
        color: "var(--primary)"
    }
];

export default function MogulBonuses() {
    return (
        <section className="py-32 md:py-56 bg-black relative overflow-hidden noise-overlay">
            {/* Background Dynamics */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(240,180,41,0.05)_0%,transparent_70%)]" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center mb-32 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-4 px-8 py-3 bg-primary/10 border border-primary/20 rounded-full font-mono text-[10px] font-black text-primary uppercase tracking-[0.6em] shadow-[0_0_30px_rgba(240,180,41,0.1)]"
                    >
                        <Gift size={16} /> EXCLUSIVE_SOVEREIGN_REWARDS
                    </motion.div>

                    <h2 className="text-[clamp(2.5rem,8vw,6.5rem)] font-display font-black text-white leading-[0.9] uppercase">
                        The Master <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white/20 italic tracking-widest">Bonus Stack.</span>
                    </h2>

                    <div className="h-2 w-48 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
                    {BONUSES.map((bonus, i) => {
                        const Icon = bonus.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="group relative p-12 rounded-[60px] bg-white/[0.01] border border-white/[0.04] hover:border-primary/40 transition-all duration-1000 overflow-hidden shadow-2xl flex flex-col items-center text-center px-14"
                            >
                                {/* Bonus Background Glow */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 50% 30%, ${bonus.color}08, transparent 70%)` }}
                                />

                                <div className="space-y-10 relative z-10 flex flex-col items-center">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-[32px] bg-black border border-white/10 flex items-center justify-center text-zinc-600 group-hover:text-primary group-hover:bg-primary/[0.05] group-hover:border-primary/20 transition-all duration-700 shadow-2xl">
                                            <Icon size={40} strokeWidth={1} />
                                        </div>
                                        {/* Floating Sparkles */}
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="absolute -top-4 -right-4 text-primary"
                                        >
                                            <Sparkles size={24} />
                                        </motion.div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] group-hover:text-primary transition-colors">{bonus.pill}</div>
                                        <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none italic">{bonus.title}</h3>
                                        <p className="text-zinc-500 font-light leading-relaxed text-lg">
                                            {bonus.desc}
                                        </p>
                                    </div>

                                    <div className="pt-10 border-t border-white/5 w-full space-y-4">
                                        <div className="text-4xl font-black text-white/5 group-hover:text-white/20 transition-all line-through italic">{bonus.value}</div>
                                        <div className="flex items-center justify-center gap-3 text-primary font-mono text-[11px] font-black uppercase tracking-[0.4em]">
                                            Included_Free <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </div>

                                {/* Animated scan pulse */}
                                <motion.div
                                    animate={{ height: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 top-0 w-full opacity-[0.02] bg-gradient-to-b from-primary via-primary to-transparent pointer-events-none"
                                />
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-32 text-center"
                >
                    <div className="inline-flex items-center gap-6 px-10 py-5 bg-zinc-900/50 border border-white/5 rounded-full text-zinc-500 font-mono text-xs font-black uppercase tracking-[0.6em] glass shadow-2xl">
                        <Command size={16} /> Total_Value_Added: $2,991.00 // ACCESS_KEY: GRANTED
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
