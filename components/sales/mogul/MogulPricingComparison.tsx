"use client";

import { motion } from "framer-motion";
import { TrendingUp, Cloud, Home, ArrowRight, DollarSign, Calendar } from "lucide-react";

export default function MogulPricingComparison() {
    return (
        <section className="py-24 bg-surface-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20 space-y-6">
                    <h2 className="text-[clamp(2.5rem,8vw,5.5rem)] font-display font-black text-white leading-[0.95] uppercase">
                        The End of <br />
                        <span className="text-secondary italic">Subscription Slavery.</span>
                    </h2>
                    <p className="max-w-3xl mx-auto text-zinc-500 font-extralight text-xl">
                        A typical agency spends <span className="text-white font-medium">$2,400 per year, per seat</span> on AI tools they will never own. Oraya is a one-time investment in a permanent asset.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">

                    {/* THE OLD WAY: PERPETUAL TAX */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="flex flex-col p-12 md:p-16 rounded-[60px] bg-white/[0.01] border border-white/5 space-y-12 opacity-50 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-5"><TrendingUp className="text-red-500 rotate-180" size={120} /></div>

                        <div className="space-y-6 relative z-10">
                            <div className="inline-flex items-center gap-3 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                <Cloud size={14} /> The_Cloud_Legacy
                            </div>
                            <h3 className="text-4xl font-black text-white uppercase tracking-tight">The Perpetual Tax</h3>
                        </div>

                        <div className="space-y-8 relative z-10">
                            {[
                                { label: "Cursor Pro x5 Seats", cost: "$1,200/yr" },
                                { label: "ChatGPT Team", cost: "$1,500/yr" },
                                { label: "Cloud Vector DB", cost: "$600/yr" },
                                { label: "API Overages", cost: "???" }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-zinc-500 border-b border-white/5 pb-4 last:border-0 italic">
                                    <span className="text-lg">{item.label}</span>
                                    <span className="font-mono text-white/40">{item.cost}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-12 space-y-4 relative z-10">
                            <div className="text-[10px] font-mono text-red-500/50 uppercase tracking-[0.4em]">3_Year_Cumulative_Loss</div>
                            <div className="text-6xl font-black text-white/20">$9,000+</div>
                            <p className="text-sm text-zinc-700 italic">...and you still own absolutely nothing.</p>
                        </div>
                    </motion.div>

                    {/* THE ORAYA WAY: ASSET OWNERSHIP */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="flex flex-col p-12 md:p-16 rounded-[60px] bg-primary/[0.03] border border-primary/20 space-y-12 relative overflow-hidden group shadow-[0_40px_100px_-20px_rgba(240,180,41,0.1)]"
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary-glow)_0%,transparent_70%)] opacity-10" />
                        <div className="absolute top-0 right-0 p-12 opacity-10"><TrendingUp size={120} /></div>

                        <div className="space-y-6 relative z-10">
                            <div className="inline-flex items-center gap-3 text-[10px] font-mono text-primary font-black uppercase tracking-widest">
                                <Home size={14} /> The_Citadel_Protocol
                            </div>
                            <h3 className="text-4xl font-black text-white uppercase tracking-tight">One-Time Sovereignty</h3>
                        </div>

                        <div className="space-y-8 relative z-10">
                            {[
                                { label: "Lifetime Kernel License", status: "INCLUDED" },
                                { label: "21 Neural Shards", status: "INCLUDED" },
                                { label: "Local Weights Hosting", status: "FREE" },
                                { label: "Future Node Updates", status: "GUARANTEED" }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-white border-b border-white/10 pb-4 last:border-0 italic">
                                    <span className="text-xl font-bold">{item.label}</span>
                                    <span className="font-mono text-primary font-black">{item.status}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-12 space-y-6 relative z-10">
                            <div className="text-[10px] font-mono text-primary font-black uppercase tracking-[0.4em]">Investment_ROI_Threshold</div>
                            <div className="flex flex-col md:flex-row items-baseline gap-4">
                                <div className="text-6xl md:text-8xl font-black text-white italic">$XXX</div>
                                <div className="text-xl font-mono text-zinc-600 line-through tracking-widest">$4,997.00</div>
                            </div>
                            <div className="flex items-center gap-4 text-emerald-500 font-mono text-xs uppercase tracking-[0.2em]">
                                <ArrowRight size={14} /> BREAK-EVEN METRIC: 4.2 MONTHS
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* The "Financial Freedom" Bar */}
                <div className="mt-20 flex flex-wrap justify-center gap-12 md:gap-24 opacity-60">
                    <div className="flex items-center gap-4">
                        <DollarSign className="text-primary" size={24} />
                        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Fixed_Asset_Value</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Calendar className="text-secondary" size={24} />
                        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Lifetime_Duration</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
