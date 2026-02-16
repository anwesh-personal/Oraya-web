"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { TrendingUp, Users, Clock, Zap, Shield, Search } from "lucide-react";

function useCountUp(end: number, duration: number = 2000, startCounting: boolean = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!startCounting) return;
        let startTime: number;
        let animationFrame: number;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(eased * end));
            if (progress < 1) animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration, startCounting]);
    return count;
}

const mogulStats = [
    {
        value: 10,
        suffix: "X",
        label: "Output Velocity",
        icon: Zap,
        color: "var(--primary)",
        detail: "Execute complex campaigns in minutes, not weeks.",
    },
    {
        value: 100,
        suffix: "%",
        label: "IP Sovereignty",
        icon: Shield,
        color: "var(--secondary)",
        detail: "Zero data leaks. Your proprietary strategies stay yours.",
    },
    {
        value: 85,
        suffix: "%",
        label: "Time Reclaimed",
        icon: Clock,
        color: "var(--primary)",
        detail: "Automate the grunt work and focus on the $10M vision.",
    },
    {
        value: 0,
        displayValue: "ZERO",
        label: "Context Loss",
        icon: Search,
        color: "var(--secondary)",
        detail: "The engine remembers every breakthrough you've ever had.",
    },
    {
        value: 400,
        suffix: "+",
        label: "Success Hours",
        icon: TrendingUp,
        color: "var(--primary)",
        detail: "Average hours saved per user in the first 30 days.",
    },
    {
        value: 1,
        suffix: "/ 1",
        label: "Founder Ratio",
        icon: Users,
        color: "var(--secondary)",
        detail: "One human, one Oraya node—the power of an entire agency.",
    },
];

export default function MogulStats() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="py-24 bg-transparent relative overflow-hidden" id="stats">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24 space-y-8">
                    <div className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40 shadow-2xl">
                        <TrendingUp size={12} className="text-primary/40" />
                        EQUITY_GROWTH_DYNAMICS
                    </div>
                    <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-display font-black text-white leading-[0.95] uppercase">
                        The Physics <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-white/10 text-secondary">of Leverage.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {mogulStats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div key={stat.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group relative p-10 rounded-[48px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-1000 overflow-hidden shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-50 border border-white/5 group-hover:border-primary/20 transition-all duration-700">
                                        <Icon size={24} strokeWidth={1} className="text-zinc-600 group-hover:text-primary" />
                                    </div>
                                    <div className="h-[1px] flex-1 mx-6 rounded-full overflow-hidden bg-white/5">
                                        <motion.div initial={{ width: "0%" }} whileInView={{ width: "100%" }} transition={{ delay: 0.5 + i * 0.15, duration: 2 }} className="h-full" style={{ background: `linear-gradient(90deg, ${stat.color}40, transparent)` }} />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <MogulStatNumber stat={stat} isInView={isInView} />
                                </div>
                                <div className="text-[11px] font-mono text-zinc-600 uppercase tracking-[0.4em] font-black mb-3">{stat.label}</div>
                                <div className="text-xs text-zinc-500 leading-relaxed font-sans font-extralight uppercase tracking-wider">{stat.detail}</div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function MogulStatNumber({ stat, isInView }: { stat: typeof mogulStats[number], isInView: boolean }) {
    const count = useCountUp(stat.value, 1500, isInView);
    if (stat.displayValue) return <span className="text-5xl md:text-6xl font-display font-black tracking-tight" style={{ color: stat.color }}>{stat.displayValue}</span>;
    return (
        <span className="text-5xl md:text-6xl font-display font-black tracking-tight" style={{ color: stat.color }}>
            {count.toLocaleString()}
            <span className="text-3xl ml-1 opacity-70">{stat.suffix}</span>
        </span>
    );
}
