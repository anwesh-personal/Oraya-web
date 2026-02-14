"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Shield, Cpu, Zap, CloudOff, TrendingDown, Users, Clock, Database } from "lucide-react";

function useCountUp(end: number, duration: number = 2000, startCounting: boolean = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!startCounting) return;
        let startTime: number;
        let animationFrame: number;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
            setCount(Math.floor(eased * end));
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration, startCounting]);
    return count;
}

const stats = [
    {
        value: 10000,
        suffix: "+",
        label: "Active Developers",
        icon: Users,
        color: "#00F0FF",
        detail: "Using Oraya daily across 40+ countries",
    },
    {
        value: 2,
        suffix: "M+",
        label: "Token Context",
        icon: Database,
        color: "#FF00AA",
        detail: "War Room mode — zero context amnesia",
    },
    {
        value: 50,
        prefix: "<",
        suffix: "ms",
        label: "Context Rehydration",
        icon: Zap,
        color: "#F0B429",
        detail: "Full mental state restored instantly",
    },
    {
        value: 99.99,
        suffix: "%",
        label: "Uptime Guaranteed",
        icon: Clock,
        color: "#10B981",
        detail: "Local-first means no server downtime",
        isDecimal: true,
    },
    {
        value: 40,
        prefix: "-",
        suffix: "%",
        label: "API Cost Savings",
        icon: TrendingDown,
        color: "#8B5CF6",
        detail: "Semantic caching reduces redundant calls",
    },
    {
        value: 0,
        suffix: "",
        displayValue: "ZERO",
        label: "Data Sent to Cloud",
        icon: CloudOff,
        color: "#00F0FF",
        detail: "Fort Knox security — everything stays local",
    },
];

export default function StatsCounter() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="py-32 relative overflow-hidden" id="stats">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050510] to-black" />

            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#00F0FF]/[0.03] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20 space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full font-mono text-xs font-bold uppercase tracking-widest text-gray-400">
                        <Cpu size={12} />
                        System Metrics
                    </div>
                    <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-none">
                        Numbers Don&apos;t Lie.
                    </h2>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="group relative p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 overflow-hidden"
                            >
                                {/* Hover glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 50% 50%, ${stat.color}08, transparent 70%)` }} />

                                {/* Top row: Icon + category */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}25` }}>
                                        <Icon size={20} style={{ color: stat.color }} />
                                    </div>
                                    {/* Decorative bar */}
                                    <div className="h-[2px] flex-1 mx-4 rounded-full overflow-hidden bg-white/5">
                                        <motion.div
                                            initial={{ width: "0%" }}
                                            whileInView={{ width: "100%" }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.5 + i * 0.15, duration: 1.5, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{ background: `linear-gradient(90deg, ${stat.color}, transparent)` }}
                                        />
                                    </div>
                                </div>

                                {/* Number */}
                                <div className="mb-3">
                                    <StatNumber stat={stat} isInView={isInView} />
                                </div>

                                {/* Label */}
                                <div className="text-sm font-mono text-gray-400 uppercase tracking-wider font-bold mb-2">
                                    {stat.label}
                                </div>

                                {/* Detail */}
                                <div className="text-xs text-gray-600 leading-relaxed">
                                    {stat.detail}
                                </div>

                                {/* Bottom accent */}
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: `linear-gradient(90deg, transparent, ${stat.color}60, transparent)` }} />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function StatNumber({ stat, isInView }: { stat: typeof stats[number], isInView: boolean }) {
    const count = useCountUp(
        stat.isDecimal ? Math.floor(stat.value) : stat.value,
        stat.value > 1000 ? 2500 : 1500,
        isInView
    );

    if (stat.displayValue) {
        return (
            <span className="text-5xl md:text-6xl font-display font-black tracking-tight" style={{ color: stat.color }}>
                {stat.displayValue}
            </span>
        );
    }

    return (
        <span className="text-5xl md:text-6xl font-display font-black tracking-tight" style={{ color: stat.color }}>
            {stat.prefix || ""}
            {stat.isDecimal ? `${count}.99` : count.toLocaleString()}
            <span className="text-3xl ml-1 opacity-70">{stat.suffix}</span>
        </span>
    );
}
