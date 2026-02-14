
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Activity } from "lucide-react";

function useCountUp(end: number, duration: number = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const hasStarted = useRef(false);

    useEffect(() => {
        if (!isInView || hasStarted.current) return;
        hasStarted.current = true;

        let startTime: number;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [isInView, end, duration]);

    return { count, ref };
}

const stats = [
    { value: 10000, suffix: "+", label: "Active Developers", prefix: "", color: "#00F0FF", desc: "Building with Oraya daily" },
    { value: 2, suffix: "M+", label: "Token Context", prefix: "", color: "#B794F6", desc: "The largest context window" },
    { value: 50, suffix: "ms", label: "Context Rehydration", prefix: "<", color: "#00FF99", desc: "Instant session restoration" },
    { value: 99, suffix: ".99%", label: "Uptime SLA", prefix: "", color: "#FFBB00", desc: "Enterprise-grade reliability" },
    { value: 40, suffix: "%", label: "API Cost Savings", prefix: "-", color: "#FF00AA", desc: "Through semantic caching" },
    { value: 0, suffix: "", label: "Data Sent to Cloud", prefix: "", special: "ZERO", color: "#00F0FF", desc: "Everything stays local" },
];

export default function StatsCounter() {
    return (
        <section className="py-32 bg-black relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#00F0FF]/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-20 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest text-[#00F0FF]">
                        <Activity size={12} className="animate-pulse" />
                        Live Metrics
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[0.9]">
                        Numbers Don&apos;t Lie.
                    </h2>
                    <p className="text-xl text-zinc-400 font-normal max-w-2xl mx-auto">
                        Real performance data from production deployments across the globe.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {stats.map((stat, i) => (
                        <StatBox key={i} {...stat} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function StatBox({ value, suffix, label, prefix, special, index, color, desc }: {
    value: number, suffix: string, label: string, prefix: string, special?: string, index: number, color: string, desc: string
}) {
    const { count, ref } = useCountUp(value, 2000);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
            className="relative group"
        >
            <div className="flex flex-col items-center text-center gap-3 p-8 md:p-10 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm hover:border-white/15 hover:bg-white/[0.04] transition-all duration-500">
                {/* Accent line top */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-12 rounded-full opacity-40 group-hover:w-24 group-hover:opacity-100 transition-all duration-500"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                />

                {/* Number */}
                <div className="text-4xl md:text-6xl font-bold tabular-nums transition-colors duration-300" style={{ color }}>
                    {special ? (
                        <span>{special}</span>
                    ) : (
                        <>{prefix}{count.toLocaleString()}<span className="opacity-60">{suffix}</span></>
                    )}
                </div>

                {/* Label */}
                <div className="text-[11px] text-white font-bold uppercase tracking-[0.2em] font-mono leading-tight">
                    {label}
                </div>

                {/* Description */}
                <div className="text-[11px] text-zinc-600 font-normal leading-tight group-hover:text-zinc-400 transition-colors">
                    {desc}
                </div>
            </div>
        </motion.div>
    );
}
