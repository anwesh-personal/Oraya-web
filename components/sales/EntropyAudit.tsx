"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Zap, Globe, Cpu, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const FAILURES = [
    {
        name: "ChatGPT",
        type: "The Public Proxy",
        failure: "Data Extraction",
        desc: "A web-wrapper for a model that doesn't know you exist. You are the product.",
        icon: Globe,
        color: "#8B5CF6"
    },
    {
        name: "Cursor",
        type: "The Electron Shell",
        failure: "Telemetry Leakage",
        desc: "An Electron wrapper that proxies your genius through 3rd party servers.",
        icon: Zap,
        color: "#10B981"
    },
    {
        name: "Claude",
        type: "The Web Snapshot",
        failure: "Model Training",
        desc: "Non-sovereign execution. Your logic is used to train your eventual replacement.",
        icon: ShieldAlert,
        color: "#FF3366"
    }
];

export default function EntropyAudit() {
    return (
        <section className="py-24 bg-surface-0 relative overflow-hidden" id="entropy-audit">
            {/* Visual Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,51,102,0.03)_0%,transparent_70%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-20 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-4 px-7 py-2.5 bg-red-500/5 border border-red-500/20 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-red-500/60"
                    >
                        <AlertTriangle size={12} className="animate-pulse" />
                        SYSTEM_FAIL_AUDIT_v1.2
                    </motion.div>

                    <h2 className="text-5xl md:text-[clamp(3rem,8vw,8rem)] font-display font-black text-white leading-[0.9] uppercase tracking-tight">
                        The Wrapper <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-red-500/40">Tax.</span>
                    </h2>

                    <p className="text-zinc-500 font-extralight text-xl max-w-2xl mx-auto uppercase tracking-tighter">
                        If you aren&apos;t paying for the hardware, <br />
                        <span className="text-white font-normal italic">you are the one being sharded.</span>
                    </p>
                </div>

                {/* Failure Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {FAILURES.map((f, i) => (
                        <motion.div
                            key={f.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.8 }}
                            className="group relative p-10 rounded-[48px] border border-white/5 bg-[#080808] hover:border-red-500/30 transition-all duration-700 overflow-hidden"
                        >
                            {/* Warning Indicator */}
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-1000">
                                <f.icon size={120} strokeWidth={0.5} />
                            </div>

                            <div className="relative z-10 space-y-8">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{f.type}</div>
                                    <h4 className="text-3xl font-black text-white uppercase">{f.name}</h4>
                                </div>

                                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex flex-col gap-2">
                                    <div className="text-[8px] font-mono text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
                                        <ShieldAlert size={10} /> CRITICAL_FAIL: {f.failure}
                                    </div>
                                    <p className="text-zinc-400 text-sm font-light leading-relaxed">
                                        {f.desc}
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <div className="text-[9px] font-mono text-zinc-800 uppercase tracking-[0.4em] group-hover:text-red-500/60 transition-colors">
                                        ANALYZE_FRICTION_LOG <ChevronRight size={12} className="inline ml-1" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* THE PERSUADER: ORAYA SOVEREIGNTY */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 p-12 md:p-16 rounded-[64px] bg-primary/[0.02] border border-primary/20 relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.01] via-transparent to-transparent" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="space-y-6 max-w-2xl text-center md:text-left">
                            <h3 className="text-4xl md:text-6xl font-black text-white uppercase leading-none">Stop Renting Lands.</h3>
                            <p className="text-zinc-500 font-extralight text-lg uppercase leading-snug">
                                Oraya is a binary kernel that treats your machine as a <span className="text-white italic">fortress</span>.
                                Absolute Hardware Dominion is the only way to win in a post-AI world.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <div className="w-24 h-24 rounded-3xl bg-black border border-primary/40 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                                <Cpu size={40} className="text-primary animate-pulse" />
                            </div>
                            <div className="text-[9px] font-mono text-primary font-black uppercase tracking-[0.5em]">L5_DOMINION_ACTIVE</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
