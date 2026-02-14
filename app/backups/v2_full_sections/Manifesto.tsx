"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Sparkles, Zap, ShieldCheck, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Manifesto() {
    return (
        <section className="py-32 bg-black relative overflow-hidden" id="manifesto">
            {/* Founder Image — Full Backdrop */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/assets/Assets/journey-5.webp"
                    alt="Anwesh Rath"
                    fill
                    className="object-cover object-top opacity-[0.2] grayscale scale-110"
                    priority
                />
                {/* Gradient Overlays for Readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
            </div>

            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-32"
                >
                    {/* Founder Section — Single Column Over Backdrop */}
                    <div className="max-w-3xl space-y-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.08] border border-white/20 rounded-full font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-sm">
                            <Target size={12} />
                            Origin Theory
                        </div>

                        <h3 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.9] tracking-tight">
                            Built to solve. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600 font-medium italic">Forged to dominate.</span>
                        </h3>

                        <div className="space-y-8 text-lg md:text-xl text-zinc-300 font-normal leading-relaxed max-w-2xl">
                            <p>
                                Oraya wasn&apos;t born in a lab. It was born out of <span className="text-white font-medium">frictional exhaustion</span>.
                                I spent years building systems where the tools were always the bottleneck.
                            </p>
                            <p className="text-white font-medium border-l-4 border-white/40 pl-6 py-2 italic bg-white/[0.05] rounded-r-2xl backdrop-blur-sm">
                                The landscape is broken. Tools require permission. I built Oraya as a beast
                                that demands total sovereignty over your local kernel.
                            </p>
                            <p>
                                This is a new layer of digital intelligence designed to give power
                                back to the individual engineer.
                            </p>
                        </div>

                        <div className="flex items-center gap-6 pt-8">
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 bg-zinc-900 relative p-3">
                                <Image
                                    src="/logos/oraya-dark.png"
                                    alt="Oraya"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white tracking-tight">Anwesh Rath</h4>
                                <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">Architect of Oraya</p>
                            </div>
                        </div>
                    </div>

                    {/* Pillars */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 border-t border-white/5">
                        <ValueItem
                            icon={Zap}
                            title="Absolute Dominance"
                            desc="We don't compete with other AIs. We operate on a different frequency. Native hardware access. Raw speed. Pure power."
                            delay={0.1}
                        />
                        <ValueItem
                            icon={ShieldCheck}
                            title="Ironclad Sovereignty"
                            desc="Your data, your rules. Local performance with global-scale ambition. No permission required for excellence."
                            delay={0.2}
                        />
                        <ValueItem
                            icon={Sparkles}
                            title="Refined Elegance"
                            desc="Response speeds and interface precision that makes you forget latency ever existed. A surgical instrument for builders."
                            delay={0.3}
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function ValueItem({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay || 0, duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="group relative p-8 rounded-3xl bg-[#0A0A0A] border border-white/10 hover:border-white/40 transition-all duration-500 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-white/50 transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <Icon size={24} className="text-zinc-500 group-hover:text-white transition-colors duration-500" />
                </div>

                <div>
                    <h5 className="font-display font-black uppercase tracking-wider text-xl text-white mb-3 group-hover:text-white transition-colors duration-300">{title}</h5>
                    <p className="text-zinc-400 leading-relaxed text-sm font-medium">
                        {desc}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
