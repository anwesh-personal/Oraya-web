"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function FAQSection() {
    const faqs = [
        {
            q: "Is Oraya really free?",
            a: "Yes. The Personal tier is completely free, forever. No credit card. No trial period. You get the full neural core, local-first architecture, and Dream State processing at zero cost. We make money from Pro and Team tiers which add collaboration, priority support, and enterprise features."
        },
        {
            q: "How is this different from Cursor or Copilot?",
            a: "Cursor is a code editor. Copilot is autocomplete. Oraya is an operating system. It doesn't just suggest code—it indexes your entire digital footprint (code, docs, Slack, Notion), manages context across 2M+ tokens, runs autonomous agents in the background, and self-heals your codebase while you sleep. It's a fundamentally different category."
        },
        {
            q: "Does my data ever leave my machine?",
            a: "Never. Oraya is local-first by design. Your API keys are encrypted with AES-256 GCM and stored in your OS keychain. Your codebase is indexed locally. When you use cloud models (like GPT-4), the request goes directly from your machine to the provider—we never proxy, log, or store anything."
        },
        {
            q: "What models does Oraya support?",
            a: "All of them. GPT-4o, Claude 3.5 Sonnet, Gemini Pro, Mistral Large, Llama 3, and any OpenAI-compatible API. You can also run models locally using Metal (Mac) or CUDA (Linux/Windows) acceleration. Switch between providers with a single click."
        },
        {
            q: "What is 'Dream State Processing'?",
            a: "When your machine is idle (usually overnight), Oraya enters Dream State. It re-indexes your codebase, optimizes the knowledge graph, pre-fetches context for likely workflows, and retrains its local embeddings. When you wake up, it's smarter than you left it."
        },
        {
            q: "Can I use Oraya in air-gapped / classified environments?",
            a: "Yes. Oraya can run entirely offline using local LLM runtimes (Llama 3, Mistral). Combined with Ghost Protocol (zero-trace mode), it's designed for defense, fintech, and healthcare environments where data sovereignty is non-negotiable."
        },
        {
            q: "What platforms does Oraya support?",
            a: "macOS (Apple Silicon & Intel), Windows 10+, and Linux (Ubuntu, Fedora, Arch). Built with Tauri for native-level performance and a tiny footprint (~15MB installer)."
        },
        {
            q: "How does team collaboration work?",
            a: "Team members can share 'Brain Links'—encrypted snapshots of their context state. It's peer-to-peer, end-to-end encrypted, and doesn't require a central server. Think of it as AirDrop for developer context."
        },
    ];

    return (
        <section className="py-40 bg-black relative overflow-hidden" id="faq">
            <div className="max-w-3xl mx-auto px-6 relative z-10">

                <div className="text-center mb-20 space-y-6">
                    <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-none">
                        Questions? <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-600">Answered.</span>
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
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="border border-white/5 rounded-2xl overflow-hidden bg-[#0A0A0A] hover:border-white/10 transition-colors"
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left gap-4"
            >
                <span className="text-lg md:text-xl font-display font-bold text-white">{q}</span>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-zinc-500 shrink-0"
                >
                    <ChevronDown size={20} />
                </motion.div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 md:px-8 pb-6 md:pb-8 text-zinc-400 text-base leading-relaxed border-t border-white/5 pt-6">
                            {a}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
