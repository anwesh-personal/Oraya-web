
"use client";

import { useEffect, useState, useRef } from "react";
import { AlertTriangle, X, Terminal, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";

export default function AmplifySection() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Parallax for floating elements
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

    return (
        <section ref={ref} id="problem" className="relative py-32 bg-[#050505] overflow-hidden text-white border-none">
            {/* Subtle Grid */}
            <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:32px_32px]" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">

                    {/* Left: The Pain */}
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 text-red-500 font-mono text-xs font-bold uppercase tracking-widest animate-pulse">
                                <AlertTriangle size={14} />
                                System Critical
                            </div>

                            <h2 className="text-5xl md:text-7xl font-display font-black leading-[0.9] tracking-tighter">
                                Intelligence <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                                    Disconnected.
                                </span>
                            </h2>

                            <p className="text-xl md:text-2xl text-gray-400 font-light leading-relaxed">
                                You lose <span className="text-white font-bold">20 minutes</span> of flow every time you switch contexts. Your best ideas are dying in scattered tabs.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <PainPoint
                                title="The Context Tax"
                                desc="40% of your day is lost just finding the right file or conversation."
                                delay={0.2}
                            />
                            <PainPoint
                                title="Siloed Knowledge"
                                desc="Your code doesn't know about your docs. Your docs don't know about Jira."
                                delay={0.4}
                            />
                            <PainPoint
                                title="Security Leaks"
                                desc="Copy-pasting sensitive keys into web LLMs is a compliance nightmare."
                                delay={0.6}
                            />
                        </div>
                    </div>

                    {/* Right: Visualizing Fragmentation */}
                    <div className="relative h-[600px] w-full flex items-center justify-center">
                        {/* Central Void */}
                        <div className="absolute w-64 h-64 rounded-full border border-white/5 bg-black flex items-center justify-center z-10 shadow-2xl">
                            <div className="w-48 h-48 rounded-full border border-dashed border-white/10 animate-[spin_10s_linear_infinite]" />
                            <div className="absolute text-center">
                                <div className="text-4xl font-black text-white/10 font-display">404</div>
                                <div className="text-xs font-mono text-white/20 mt-1">CONTEXT LOST</div>
                            </div>
                        </div>

                        {/* Floating Fragments */}
                        <FloatingFragment icon={Terminal} label="Backend" x="-20%" y="-30%" delay={0} yAnim={y1} />
                        <FloatingFragment icon={GitBranch} label="PR #402" x="30%" y="-40%" delay={0.2} yAnim={y2} />
                        <FloatingFragment icon={X} label="Error Logs" x="-30%" y="20%" delay={0.4} yAnim={y1} />

                        {/* Connection Lines (Fading) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                            <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="white" strokeWidth="1" strokeDasharray="4" />
                            <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="white" strokeWidth="1" strokeDasharray="4" />
                            <line x1="50%" y1="50%" x2="20%" y2="80%" stroke="white" strokeWidth="1" strokeDasharray="4" />
                            <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="white" strokeWidth="1" strokeDasharray="4" />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
}

function PainPoint({ title, desc, delay }: { title: string, desc: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="group flex gap-6 items-start p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors cursor-default"
        >
            <div className="w-1 h-12 bg-white/10 rounded-full group-hover:bg-red-500 transition-colors" />
            <div>
                <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">{title}</h3>
                <p className="text-gray-500 mt-2 text-base leading-relaxed group-hover:text-gray-300 transition-colors">{desc}</p>
            </div>
        </motion.div>
    );
}

function FloatingFragment({ icon: Icon, label, x, y, delay, yAnim }: { icon: any, label: string, x: string, y: string, delay: number, yAnim: any }) {
    return (
        <motion.div
            style={{
                left: `calc(50% + ${x})`,
                top: `calc(50% + ${y})`,
                y: yAnim
            }}
            className="absolute p-4 rounded-xl bg-[#111] border border-white/10 shadow-2xl flex items-center gap-3 backdrop-blur-md z-20"
        >
            <Icon size={20} className="text-gray-400" />
            <span className="font-mono text-xs text-gray-300 font-bold">{label}</span>
        </motion.div>
    );
}
