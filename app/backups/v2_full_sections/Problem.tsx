"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AlertCircle, Ban, Skull } from "lucide-react";

export default function ProblemSection() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section ref={ref} id="problem" className="relative py-32 bg-black text-white overflow-hidden">
            {/* Ambient Red Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-red-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />

            <div className="max-w-6xl mx-auto px-6 relative z-10 text-center space-y-20">

                {/* Header */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/[0.08] text-red-400 border border-red-500/20 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest"
                    >
                        <AlertCircle size={12} />
                        System Critical
                    </motion.div>

                    <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[0.95]">
                        Your Intelligence is <br />
                        <span className="text-red-500">Fragmented.</span>
                    </h2>

                    <p className="text-xl md:text-2xl text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto">
                        Every tab switch kills your flow. Every lost context window
                        <span className="text-white font-bold"> erases hours of focus.</span>
                    </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ProblemCard
                        icon={Ban}
                        title="Context Amnesia"
                        desc="Your AI forgets everything after 30 messages. You re-explain arch decisions and re-paste code. Every. Single. Time."
                        index={0}
                    />
                    <ProblemCard
                        icon={AlertCircle}
                        title="Siloed Knowledge"
                        desc="Docs in Notion. Code in VS Code. Logic in Slack. Nothing connects. Your brain is the only integration layer."
                        index={1}
                    />
                    <ProblemCard
                        icon={Skull}
                        title="Security Roulette"
                        desc="Pasting API keys into ChatGPT? Sending proprietary code to cloud models? That's not convenience. That's negligence."
                        index={2}
                    />
                </div>
            </div>
        </section>
    );
}

function ProblemCard({ icon: Icon, title, desc, index }: { icon: any, title: string, desc: string, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
            className="group relative p-8 bg-[#0A0A0A] border border-white/[0.06] hover:border-red-500/30 hover:shadow-2xl hover:shadow-red-500/[0.05] transition-all duration-500 rounded-2xl text-left"
        >
            <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-red-500/[0.08] flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                    <Icon size={24} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-zinc-500 leading-relaxed text-sm group-hover:text-zinc-400 transition-colors">
                    {desc}
                </p>
            </div>
        </motion.div>
    );
}
