
"use client";

import { useEffect, useState, useRef } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";

export default function TransformationSection() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    return (
        <section ref={ref} className="relative py-40 bg-black text-white overflow-hidden">
            {/* Gradient Blob */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-[#00F0FF]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24 space-y-6">
                    <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-none">
                        The Workflow <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#FF00AA]">Revolution.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-3xl mx-auto leading-relaxed">
                        Stop tolerating the friction. See how Oraya transforms your daily engineering reality.
                    </p>
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-white/5 border-b border-white/10 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">
                        <div>Dimension</div>
                        <div>Without Oraya</div>
                        <div className="text-[#00F0FF]">With Oraya</div>
                    </div>

                    <div className="divide-y divide-white/5">
                        <ComparisonRow
                            label="Context Retention"
                            before="Manual copy-pasting snippets across 5 windows."
                            after="2 Million+ token 'War Room' recalls full project history."
                            delay={0.1}
                        />
                        <ComparisonRow
                            label="Data Privacy"
                            before="Sending keys to cloud LLMs with zero guarantees."
                            after="Local-first encryption. Keys never leave your machine."
                            delay={0.2}
                        />
                        <ComparisonRow
                            label="Knowledge Access"
                            before="Searching Slack, Notion, GitHub separately."
                            after="One universal query finds connected insights instantly."
                            delay={0.3}
                        />
                        <ComparisonRow
                            label="Team Sync"
                            before="Explaining context repeatedly to teammates."
                            after="Share a 'Brain Link' snapshot instantly."
                            delay={0.4}
                        />
                    </div>
                </div>

                {/* Social Proof Quote */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="mt-32 text-center space-y-8"
                >
                    <div className="text-3xl md:text-5xl font-display font-bold text-white leading-tight max-w-5xl mx-auto tracking-tight">
                        "I used to spend 2 hours a day just getting back into context. <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#FF00AA]">Oraya gave me that time back.</span>"
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-xl font-bold font-display text-white shadow-lg">
                            AS
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-white text-lg">Alex S.</div>
                            <div className="text-sm text-[#00F0FF] font-mono uppercase tracking-wider">Sr. Staff Engineer</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function ComparisonRow({ label, before, after, delay }: { label: string, before: string, after: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 hover:bg-white/5 transition-colors group"
        >
            <div className="text-xl font-display font-bold text-white flex items-center">{label}</div>

            <div className="flex items-start gap-4 text-zinc-400 group-hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5 text-red-500/50 shrink-0 mt-1" />
                <span className="text-base leading-relaxed">{before}</span>
            </div>

            <div className="flex items-start gap-4 text-white">
                <Check className="w-5 h-5 text-[#00F0FF] shrink-0 mt-1 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
                <span className="text-lg font-medium leading-relaxed">{after}</span>
            </div>
        </motion.div>
    );
}
