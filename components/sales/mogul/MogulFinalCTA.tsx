"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Crown, Globe } from "lucide-react";
import Link from "next/link";

export default function MogulFinalCTA() {
    return (
        <section className="py-32 md:py-56 bg-surface-0 relative overflow-hidden">
            {/* Background Dynamics */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,var(--primary-glow)_0%,transparent_70%)]" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 relative z-10 text-center flex flex-col items-center">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="space-y-12">
                    <div className="inline-flex items-center gap-4 px-6 py-2 bg-primary/10 border border-primary/20 rounded-full font-mono text-[10px] font-black text-primary uppercase tracking-[0.5em] mx-auto shadow-2xl">
                        <Crown size={14} /> INITIALIZE_DOMINION_PROTOCOL
                    </div>

                    <h2 className="text-[clamp(2.5rem,8vw,8rem)] font-display font-black text-white leading-[0.9] uppercase">
                        The Future Belongs to <br />
                        <span className="text-secondary italic">The Sovereign.</span>
                    </h2>

                    <p className="text-xl md:text-3xl text-zinc-500 font-extralight max-w-4xl mx-auto leading-relaxed">
                        Stop renting your mind. Claim your private AI citadel and start building the empire your genius deserves.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-16 pt-16 border-t border-white/5">
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Shield size={20} /></div>
                            <div className="text-left">
                                <div className="text-xs font-black text-white uppercase tracking-widest">100% Privacy</div>
                                <div className="text-[9px] font-mono text-zinc-600 uppercase">On-Device Weights</div>
                            </div>
                        </div>
                        <div className="hidden sm:block h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Zap size={20} /></div>
                            <div className="text-left">
                                <div className="text-xs font-black text-white uppercase tracking-widest">Zero Latency</div>
                                <div className="text-[9px] font-mono text-zinc-600 uppercase">Instant Output</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-16 py-8 bg-primary text-black font-mono font-black text-xl uppercase tracking-[0.4em] rounded-[32px] shadow-[0_40px_100px_-20px_rgba(240,180,41,0.5)] group relative overflow-hidden">
                            <span className="relative z-10 flex items-center gap-6">CLAIM_MY_NODES <Globe size={20} /></span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </motion.button>
                        <p className="mt-8 text-[10px] font-mono text-zinc-600 uppercase tracking-[0.5em]">Lifetime Access // No Subscriptions // One Time Investment</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
