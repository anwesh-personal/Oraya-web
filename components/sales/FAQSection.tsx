"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function FAQSection() {
    const faqs = [
        {
            q: "Why is it so fast?",
            a: "Because we bypassed the internet. Oraya is a native Rust binary that communicates directly with your hardware kernel. By removing the browser and the cloud proxy from the execution loop, we reduced latency from 3 seconds to sub-12 milliseconds. It's fast enough to be biological."
        },
        {
            q: "How is this different from 'AI Wrappers'?",
            a: "Standard AI tools are skins for cloud APIs. Oraya is a sovereign kernel. It doesn't just suggest text; it possesses the motor cortex of your operating system. It understands the connective tissue between your backend, frontend, and infra."
        },
        {
            q: "Who owns the data?",
            a: "You do. Physically. Oraya is local-first by design. Your logic, keys, and architectural decisions stay on your machine, guarded by AES-256 GCM encryption. Your computer is a sovereign territory; we just provide the fortification."
        },
        {
            q: "What is the 'Memory Palace'?",
            a: "It's a high-density neural graph that indexes every keystroke, research doc, and logic commit. Instead of 'searching' for code, Oraya allows you to recall it instantly with zero context loss, even for projects you haven't touched in months."
        },
        {
            q: "What models can I deploy?",
            a: "Absolute flexibility. Switch between the world's most powerful cloud models (GPT-4o, Claude 3.5) or run open-weights (Llama 3, Mistral) locally with full GPU acceleration for air-gapped security."
        },
        {
            q: "What's the catch?",
            a: "Better engineering. Oraya is designed for the 1% of architects who refuse to compromise their privacy, their context, or their speed for a cheap web wrapper."
        },
        {
            q: "What is 'Ghost Protocol'?",
            a: "The ultimate stealth mode. Activate it for sensitive projects to ensure zero-trace persistence. No logs, no history, ephemeral execution containers. Total digital invisibility."
        },
        {
            q: "Can I use it in air-gapped environments?",
            a: "Yes. Oraya can run 100% offline. It was built for environments where data sovereignty is non-negotiable—defense, high-stakes fintech, and proprietary R&D labs."
        },
    ];

    return (
        <section className="py-8 md:py-12 bg-transparent relative overflow-hidden" id="faq">
            <div className="max-w-[800px] mx-auto px-6 relative z-10">

                <div className="text-center mb-10 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/[0.02] border border-white/[0.08] rounded-full font-mono text-[9px] font-black uppercase tracking-[0.4em] text-white/40"
                    >
                        SYSTEM_INTEL_BRIEFING
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-display font-black text-white tracking-tighter leading-tight uppercase">
                        Architect <span className="text-white/40">Intel.</span>
                    </h2>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FAQItem({ q, a, index }: { q: string, a: string, index: number }) {
    const [open, setOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            className="border border-white/[0.03] rounded-[24px] overflow-hidden bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all duration-500 shadow-xl"
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left gap-4 group/btn"
            >
                <div className="flex gap-6 items-center">
                    <span className="text-primary/40 font-mono text-[9px] font-black group-hover/btn:text-primary transition-colors whitespace-nowrap tracking-widest uppercase">0{index + 1}</span>
                    <span className="text-lg md:text-xl font-display font-black text-white uppercase tracking-tighter group-hover/btn:text-white transition-colors">{q}</span>
                </div>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="text-zinc-700 group-hover/btn:text-white transition-colors"
                >
                    <ChevronDown size={20} strokeWidth={1.5} />
                </motion.div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 md:px-8 pb-6 md:pb-8 text-zinc-500 text-sm md:text-base leading-relaxed border-t border-white/[0.03] pt-6 font-sans font-light italic">
                            {a}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
