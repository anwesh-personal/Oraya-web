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
        label: "Sovereign Nodes",
        icon: Users,
        color: "var(--primary)",
        detail: "Deployed across high-intensity engineering fleets",
    },
    {
        value: 2,
        suffix: "M+",
        label: "Neural Context",
        icon: Database,
        color: "var(--secondary)",
        detail: "Zero context amnesia—every project history is locked",
    },
    {
        value: 12,
        prefix: "<",
        suffix: "ms",
        label: "Execution Latency",
        icon: Zap,
        color: "var(--primary)",
        detail: "Biological reflexes via direct kernel hooks",
    },
    {
        value: 99.99,
        suffix: "%",
        label: "Local Reliability",
        icon: Clock,
        color: "var(--secondary)",
        detail: "Local-first means zero dependency on cloud availability",
        isDecimal: true,
    },
    {
        value: 0,
        suffix: "",
        displayValue: "ZERO",
        label: "Telemetry Leaks",
        icon: CloudOff,
        color: "var(--primary)",
        detail: "Fortress security—your data literally stays in RAM",
    },
    {
        value: 84,
        suffix: "%",
        label: "Entropy Reduction",
        icon: TrendingDown,
        color: "var(--secondary)",
        detail: "Neural defrag turning chaos into deployable logic",
    },
];

export default function StatsCounter() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="py-12 bg-transparent relative overflow-hidden" id="stats">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.01)_0%,transparent_80%)] opacity-30" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 space-y-8"
                >
                    <div className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40 shadow-2xl">
                        <Cpu size={12} className="text-primary/40" />
                        ENGINEERING_METRICS_V5
                    </div>
                    <h2 className="text-[clamp(2.25rem,6vw,6rem)] font-display font-black text-white leading-[0.95] uppercase">
                        The Physics <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/40 to-white/10">of Dominion.</span>
                    </h2>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 1 }}
                                className="group relative p-10 rounded-[48px] border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all duration-1000 overflow-hidden shadow-2xl"
                            >
                                {/* Hover glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 50% 50%, ${stat.color}05, transparent 70%)` }} />

                                {/* Top row: Icon + category */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-50 border border-white/5 group-hover:border-primary/20 transition-all duration-700">
                                        <Icon size={24} strokeWidth={1} className="text-zinc-600 group-hover:text-primary" />
                                    </div>
                                    {/* Decorative bar */}
                                    <div className="h-[1px] flex-1 mx-6 rounded-full overflow-hidden bg-white/5">
                                        <motion.div
                                            initial={{ width: "0%" }}
                                            whileInView={{ width: "100%" }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.5 + i * 0.15, duration: 2, ease: [0.16, 1, 0.3, 1] }}
                                            className="h-full"
                                            style={{ background: `linear-gradient(90deg, ${stat.color}40, transparent)` }}
                                        />
                                    </div>
                                </div>

                                {/* Number */}
                                <div className="mb-4">
                                    <StatNumber stat={stat} isInView={isInView} />
                                </div>

                                {/* Label */}
                                <div className="text-[11px] font-mono text-zinc-600 uppercase tracking-[0.4em] font-black mb-3">
                                    {stat.label}
                                </div>

                                {/* Detail */}
                                <div className="text-xs text-zinc-500 leading-relaxed font-sans font-extralight uppercase tracking-wider">
                                    {stat.detail}
                                </div>

                                {/* Bottom accent */}
                                <div className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                                    style={{ background: `linear-gradient(90deg, transparent, ${stat.color}20, transparent)` }} />
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
