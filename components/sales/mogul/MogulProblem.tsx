"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Trash2, Lock, EyeOff, AlertCircle, TrendingDown, DollarSign, Clock, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MogulProblem() {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { amount: 0.1 });
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

    const yFragments = useTransform(scrollYProgress, [0, 1], [0, -300]);
    const rotFragments = useTransform(scrollYProgress, [0, 1], [0, 30]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.4, 0.6], [1, 1, 0.3]);
    const scaleHero = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

    return (
        <section ref={sectionRef} id="problem" className="relative py-24 bg-transparent text-white overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="text-center mb-20 space-y-16">
                    <motion.div style={{ opacity: opacityHero, scale: scaleHero }} className="space-y-10">
                        <div className="inline-flex items-center gap-4 px-7 py-2.5 bg-[#121212] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.6em] mx-auto shadow-2xl">
                            <AlertCircle size={14} className="text-primary/60 animate-pulse" />
                            <span className="text-white/40">SYSTEM_ERROR: RENTED_LAND_DETECTED</span>
                        </div>

                        <h2 className="text-[clamp(2.5rem,10vw,8rem)] font-display font-black leading-[0.9] uppercase">
                            <span className="block text-white/20 font-extralight tracking-[0.15em] mb-4">You are living on</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-zinc-800">
                                Rented Land.
                            </span>
                        </h2>

                        <p className="text-xl md:text-3xl text-zinc-500 font-sans font-extralight max-w-5xl mx-auto leading-snug">
                            Every time you prompt ChatGPT, you are <span className="text-white/60 font-normal">donating your trade secrets</span> to a training loop designed to replace you. You aren&apos;t a user; you&apos;re an <span className="text-white font-black underline decoration-primary/30 underline-offset-8">unpaid data trainer.</span>
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 relative">
                    <MogulProblemCard
                        icon={ShieldX}
                        title="Data Cannibalism"
                        narrative="The cloud 'learns' your business logic and sells it back to your competitors in the next update."
                        counter="Oraya stays on-device. Your logic physically cannot leave your machine."
                        tag="IP_BLEED"
                        delay={0.1}
                    />
                    <MogulProblemCard
                        icon={Clock}
                        title="Synthetic Amnesia"
                        narrative="Wrappers forget your context the second you switch projects. You waste 40% of your day 'reminding' the AI."
                        counter="Infinite local memory ensures every project, ever, is part of your permanent context."
                        tag="RECALL_FAILURE"
                        delay={0.2}
                    />
                    <MogulProblemCard
                        icon={DollarSign}
                        title="The Subscription Trap"
                        narrative="Paying per-user, per-month for tools you don't own is a legacy mindset. It's a tax on your growth."
                        counter="Own the engine. One investment. Lifetime sovereignty across all your nodes."
                        tag="RENT_TRAP"
                        delay={0.3}
                    />
                </div>

                <div className="mt-24 p-[1px] rounded-[48px] overflow-hidden bg-gradient-to-r from-primary/20 to-transparent">
                    <div className="bg-[#080808] rounded-[47px] p-12 md:p-20 border border-white/5 text-center space-y-8">
                        <h4 className="text-2xl md:text-4xl font-display font-black text-white uppercase italic">
                            &quot;The industry has tricked you into building your castle in the cloud. We built a citadel on your desk.&quot;
                        </h4>
                        <div className="flex justify-center gap-12 opacity-30">
                            {[1, 2, 3].map(i => <div key={i} className="h-1 w-24 bg-white/10 rounded-full" />)}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MogulProblemCard({ icon: Icon, title, narrative, counter, tag, delay }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.8 }} className="group relative p-10 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all duration-700">
            <div className="space-y-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Icon size={32} strokeWidth={1} /></div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h3>
                <p className="text-zinc-500 font-light leading-relaxed italic">&quot;{narrative}&quot;</p>
                <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="text-[10px] font-mono text-primary font-black uppercase tracking-[0.4em]">ORAYA_FIX</div>
                    <p className="text-sm text-zinc-300 font-normal">{counter}</p>
                </div>
            </div>
        </motion.div>
    );
}
