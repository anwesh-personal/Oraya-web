"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Quote, Heart, Hourglass, ShieldCheck, Zap } from "lucide-react";

export default function MogulStory() {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"]
    });

    const opacity1 = useTransform(scrollYProgress, [0, 0.25, 0.35], [1, 1, 0]);
    const scale1 = useTransform(scrollYProgress, [0, 0.35], [1, 1.05]);

    const opacity2 = useTransform(scrollYProgress, [0.3, 0.4, 0.6, 0.7], [0, 1, 1, 0]);
    const y2 = useTransform(scrollYProgress, [0.3, 0.4, 0.6, 0.7], [30, 0, 0, -30]);

    const opacity3 = useTransform(scrollYProgress, [0.65, 0.75, 1], [0, 1, 1]);

    return (
        <section ref={sectionRef} className="relative h-[300vh] bg-black overflow-visible noise-overlay">
            {/* STICKY CONTAINER */}
            <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">

                {/* Background Ambient Glows */}
                <motion.div
                    style={{ opacity: scrollYProgress }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--primary-glow)_0%,transparent_70%)] pointer-events-none opacity-20"
                />

                {/* SCENE 01: THE BURDEN */}
                <motion.div
                    style={{ opacity: opacity1, scale: scale1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-8"
                >
                    <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02]">
                        <Heart size={24} className="text-primary animate-pulse" />
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-[clamp(2.5rem,8vw,6rem)] font-display font-black text-white leading-none uppercase">
                            You didn&apos;t build <br />
                            <span className="text-zinc-700 italic">your business</span>
                        </h2>
                        <p className="text-2xl md:text-4xl font-sans font-extralight text-zinc-500 max-w-4xl tracking-tight">
                            to become a digital sharecropper in someone else&apos;s cloud.
                        </p>
                    </div>
                </motion.div>

                {/* SCENE 02: THE AWAKENING */}
                <motion.div
                    style={{ opacity: opacity2, y: y2 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-16"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
                        <div className="text-left space-y-8">
                            <h3 className="text-4xl md:text-7xl font-display font-black text-white leading-none uppercase">
                                The <br /> <span className="text-primary tracking-widest leading-none">Amnesia</span> <br /> Cycle.
                            </h3>
                            <p className="text-xl text-zinc-400 font-light leading-relaxed">
                                Every morning, you wake up and teach the same AI the same context. You are paying a subscription for a memory you already own.
                            </p>
                        </div>
                        <div className="relative aspect-square md:aspect-video rounded-[40px] border border-white/5 bg-zinc-900 overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center p-12">
                                <Quote size={80} className="text-white/5 group-hover:text-primary/10 transition-colors" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* SCENE 03: THE DOMINION */}
                <motion.div
                    style={{ opacity: opacity3 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-24"
                >
                    <div className="text-center space-y-8">
                        <h3 className="text-[clamp(2.5rem,8vw,7rem)] font-display font-black text-white leading-[0.9] uppercase">
                            Reclaim your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary drop-shadow-[0_0_40px_var(--primary-glow)]">Sovereignty.</span>
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
                        {[
                            { icon: Hourglass, title: "Recover Lost Time", desc: "Oraya masters your past threads to automate your future decisions." },
                            { icon: ShieldCheck, title: "Eliminate IP Risk", desc: "Your genius physically cannot leave your machine's RAM." },
                            { icon: Zap, title: "Asset Ownership", desc: "One investment. Lifetime Dominion. No more rental taxes." }
                        ].map((item, i) => (
                            <div key={i} className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-6 hover:border-primary/20 transition-all group">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <item.icon size={24} />
                                </div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">{item.title}</h4>
                                <p className="text-sm text-zinc-500 font-light leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
