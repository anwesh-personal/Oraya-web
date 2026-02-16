"use client";

import { motion } from "framer-motion";
import { Check, X, Shield, Zap, Search, Activity } from "lucide-react";
import { useRef } from "react";

const COMPARISON_DATA = [
    {
        feature: "Memory Retention",
        oraya: "Infinite Neural Graph (Local)",
        competitors: "Short-term Token Buffer (Cloud)",
        status: true
    },
    {
        feature: "Data Privacy",
        oraya: "Total Isolation (Ring-0)",
        competitors: "Cloud Training Loops",
        status: true
    },
    {
        feature: "Subscription Cost",
        oraya: "One-Time Investment (Lifetime)",
        competitors: "$2,400+ / Year / Seat",
        status: true
    },
    {
        feature: "Latency",
        oraya: "0.12ms (Native)",
        competitors: "2s - 5s (Cloud RPC)",
        status: true
    },
    {
        feature: "Custom Agent Swarms",
        oraya: "Native Orchestration",
        competitors: "Manual Scripting Required",
        status: true
    },
    {
        feature: "Working Environment",
        oraya: "Sovereign Desktop (Offline-First)",
        competitors: "Web Browser (Cloud-Dependent)",
        status: true
    }
];

export default function MogulComparison() {
    const tableRef = useRef(null);

    return (
        <section className="py-24 md:py-40 bg-black relative overflow-hidden noise-overlay">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-32 space-y-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="inline-flex items-center gap-4 px-7 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] text-white/40 shadow-2xl"
                    >
                        <Activity size={14} className="text-primary/60 animate-pulse" />
                        INFRASTRUCTURE_AUDIT_PROTOCOL_v4
                    </motion.div>

                    <h2 className="text-[clamp(2.5rem,8vw,7rem)] font-display font-black text-white leading-[0.9] uppercase">
                        The end of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary/80 to-white/10 italic">Rental Dependency.</span>
                    </h2>
                </div>

                <div className="relative group p-[1px] rounded-[60px] bg-gradient-to-b from-white/10 to-transparent">
                    <div className="bg-[#050505] rounded-[59px] overflow-hidden relative">

                        {/* THE SCAN BEAM */}
                        <motion.div
                            animate={{ top: ["-10%", "110%"] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-[30%] bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent pointer-events-none z-20"
                        />

                        <table className="w-full text-left border-collapse relative z-10">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="py-12 px-10 text-[10px] font-mono text-zinc-600 uppercase tracking-[0.8em]">Audit_Dimension</th>
                                    <th className="py-12 px-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary"><Shield size={16} /></div>
                                            <span className="text-2xl font-black text-white uppercase italic tracking-tight">Oraya Sovereign</span>
                                        </div>
                                    </th>
                                    <th className="py-12 px-10 text-base font-black text-zinc-700 uppercase tracking-tight">Cloud Legacy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {COMPARISON_DATA.map((row, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="group hover:bg-white/[0.01] transition-colors relative"
                                    >
                                        <td className="py-12 px-10">
                                            <div className="text-xl font-bold text-white/40 uppercase tracking-tight group-hover:text-white transition-all duration-700">{row.feature}</div>
                                        </td>
                                        <td className="py-12 px-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-500 scale-90 group-hover:scale-110 shadow-[0_0_20px_rgba(240,180,41,0.1)] group-hover:shadow-[0_0_40px_var(--primary-glow)]">
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                                <div className="text-xl text-white font-medium italic group-hover:translate-x-2 transition-transform duration-700">{row.oraya}</div>
                                            </div>
                                        </td>
                                        <td className="py-12 px-10">
                                            <div className="flex items-center gap-6 opacity-30 group-hover:opacity-10 transition-opacity duration-700">
                                                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500/60">
                                                    <X size={16} strokeWidth={3} />
                                                </div>
                                                <div className="text-lg text-zinc-500 font-light">{row.competitors}</div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Final Verdict - Re-polished */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="mt-32 p-12 rounded-[50px] bg-white/[0.02] border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-20 h-20 rounded-[32px] bg-primary flex items-center justify-center text-black shadow-[0_0_60px_var(--primary-glow)] transition-transform group-hover:scale-110 duration-700">
                            <Shield size={40} />
                        </div>
                        <div className="text-left space-y-2">
                            <div className="text-[10px] font-mono text-primary font-black uppercase tracking-[0.5em]">Audit_Conclusion_v4</div>
                            <h4 className="text-3xl font-black text-white uppercase italic leading-none">Status: Uncontested Dominion</h4>
                        </div>
                    </div>

                    <p className="text-zinc-500 text-lg font-light italic max-w-xl text-center lg:text-right leading-relaxed border-l border-white/5 pl-12">
                        &quot;While legacy providers build for the 99% using generic LLM wrappers, Oraya is the sovereign architecture for the Architect who demands total control of their business logic.&quot;
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
