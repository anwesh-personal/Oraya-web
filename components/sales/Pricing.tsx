"use client";

import { Check, X, Sparkles, ArrowRight, ScanLine, Brain, Terminal, MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Solo_Recon_Node",
        price: "$9.95",
        period: "/mo",
        desc: "The entry-level neural hook for independent architects.",
        cta: "Claim_Node",
        features: [
            { label: "1 Sovereign Agent (Ova)", included: true },
            { label: "1 Dedicated Workspace", included: true },
            { label: "Local LLM Runtime", included: true },
            { label: "Basic System Memory", included: true },
            { label: "Community Support", included: true },
            { label: "Multi-Agent Parallelism", included: false },
            { label: "Ghost Ops / Wraith Mode", included: false },
        ],
        popular: false,
    },
    {
        name: "Architect_Elite_Swarm",
        price: "$49",
        period: "/mo",
        desc: "Dominion-grade orchestration for high-intensity engineers.",
        cta: "Ascend_To_Elite",
        features: [
            { label: "Full Elite Swarm (Ora, Ova, Mara)", included: true },
            { label: "Unlimited Workspaces", included: true },
            { label: "Multi-Agent Parallelism", included: true },
            { label: "Advanced Neural Recon", included: true },
            { label: "Ghost Ops / Wraith Mode", included: true },
            { label: "Hardware Dominion", included: true },
            { label: "Priority Kernel Support", included: true },
            { label: "VPS Relay Driver", included: true },
        ],
        popular: true,
    },
    {
        name: "Sovereign_Entity",
        price: "$67",
        period: "/node",
        desc: "Enterprise isolation for high-status organizations.",
        cta: "Authorize_Entity",
        features: [
            { label: "Dedicated Team Node", included: true },
            { label: "Centralized Neural Relay", included: true },
            { label: "Advanced Admin Control", included: true },
            { label: "Audit Logs + Compliance", included: true },
            { label: "Self-Hosted Support", included: true },
            { label: "Air-Gapped Deployment", included: true },
            { label: "White-Glove Onboarding", included: true },
        ],
        popular: false,
    },
];

import { useResponsive } from "./responsive/ResponsiveProvider";
import { ResponsiveSwitcher } from "./responsive/ResponsiveSwitcher";

export default function PricingSection() {
    const [mounted, setMounted] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const { isMobile } = useResponsive();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const sectionHeader = (
        <div className="text-center mb-16 md:mb-24 space-y-6 md:space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-4 px-6 py-2 bg-white/[0.02] border border-white/10 rounded-full font-mono text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-primary"
            >
                <ScanLine size={12} className="animate-pulse" />
                SYSTEM_ADOPTION_PROTOCOLS_V9
            </motion.div>

            <h2 className="text-5xl md:text-9xl font-display font-black text-white tracking-tight leading-[0.8] uppercase">
                Choose Your <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-white/10">Dominion.</span>
            </h2>
        </div>
    );

    const askOraWidget = (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 md:mt-24 max-w-4xl mx-auto"
        >
            <div className="relative p-[1px] rounded-[32px] md:rounded-[40px] overflow-hidden bg-gradient-to-b from-white/10 to-transparent">
                <div className="relative bg-[#080808] rounded-[31px] md:rounded-[39px] p-8 md:p-12 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <Brain size={isMobile ? 120 : 200} />
                    </div>

                    <div className={cn("flex flex-col gap-10 md:gap-12 items-center", !isMobile && "md:flex-row")}>
                        <div className={cn("space-y-6 flex-1", isMobile && "text-center")}>
                            <div className={cn("flex items-center gap-4 text-primary font-mono text-[10px] font-black uppercase tracking-[0.4em]", isMobile && "justify-center")}>
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                NEURAL_ASSISTANT_ACTIVE
                            </div>
                            <h3 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tight">Ask Ora.</h3>
                            <p className="text-zinc-500 font-sans font-light text-base md:text-lg leading-relaxed">
                                Not sure which node fits your architecture? Describe your workload and Oraya will recommend the optimal clearance level.
                            </p>
                        </div>

                        <div className="w-full md:w-[400px] space-y-4">
                            <div className="bg-black/40 border border-white/5 rounded-2xl md:rounded-3xl p-6 min-h-[100px] md:min-h-[120px] flex flex-col justify-end font-mono text-xs">
                                <div className="text-primary mb-2">Ora // 0xAF3:</div>
                                <div className="text-zinc-400 leading-relaxed">
                                    Specify your engineering intent... I am ready to calculate your best path.
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Tell Ora about your setup..."
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl md:rounded-2xl px-5 py-3.5 md:px-6 md:py-4 font-sans text-sm outline-none focus:border-primary/50 transition-colors pr-14 md:pr-16"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-black rounded-lg md:rounded-xl hover:bg-white transition-colors">
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const desktopView = (
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
            {sectionHeader}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12 items-center">
                {plans.map((plan, i) => (
                    <PricingCard key={i} plan={plan} index={i} isMobile={false} />
                ))}
            </div>
            {askOraWidget}
        </div>
    );

    const mobileView = (
        <div className="px-6 relative z-10 space-y-16">
            {sectionHeader}
            <div className="space-y-8">
                {plans.map((plan, i) => (
                    <PricingCard key={i} plan={plan} index={i} isMobile={true} />
                ))}
            </div>
            {askOraWidget}
        </div>
    );

    return (
        <section className="py-24 md:py-40 bg-transparent relative overflow-hidden" id="pricing">
            {/* Massive Atmospheric Depth */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.03)_0%,transparent_70%)] pointer-events-none" />
            <ResponsiveSwitcher mobile={mobileView} desktop={desktopView} />
        </section>
    );
}

function PricingCard({ plan, index, isMobile }: { plan: any; index: number; isMobile: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
            whileHover={!isMobile ? { y: -10 } : {}}
            className={cn(
                "relative rounded-[40px] md:rounded-[56px] border transition-all duration-700 overflow-hidden flex flex-col h-full",
                isMobile ? "p-8" : "p-10 md:p-12",
                plan.popular
                    ? "bg-[#0A0805] border-primary/40 shadow-[0_40px_100px_-20px_rgba(245,158,11,0.15)] ring-1 ring-primary/20 z-10 py-12 md:py-20"
                    : "bg-surface-0 border-white/5 hover:border-white/10",
                plan.popular && !isMobile && "scale-[1.05]"
            )}
        >
            {plan.popular && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            )}

            <div className="space-y-8 md:space-y-10 flex-1">
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <h4 className="font-mono text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-zinc-600">
                            {plan.name}
                        </h4>
                        {plan.popular && (
                            <span className="bg-primary/10 border border-primary/20 text-primary font-mono font-black text-[8px] md:text-[9px] px-3 py-1 md:px-4 md:py-1.5 rounded-full uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2">
                                <Sparkles size={10} />
                                Elite
                            </span>
                        )}
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className={cn(
                            "font-display font-black tracking-tight leading-none",
                            plan.popular
                                ? (isMobile ? "text-6xl text-white" : "text-7xl md:text-9xl text-white")
                                : (isMobile ? "text-5xl text-white/90" : "text-5xl md:text-6xl text-white/90")
                        )}>
                            {plan.price}
                        </span>
                        <span className="text-zinc-700 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-black">
                            {plan.period}
                        </span>
                    </div>
                </div>

                <p className="text-zinc-500 font-sans font-light italic text-sm md:text-base leading-relaxed uppercase tracking-tight">
                    &quot;{plan.desc}&quot;
                </p>

                <div className="h-px w-full bg-white/5" />

                <ul className="space-y-4 md:space-y-5">
                    {plan.features.map((feature: any, j: number) => (
                        <li key={j} className="flex gap-4 items-start group/li">
                            <div className={cn(
                                "shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center transition-all duration-500",
                                feature.included
                                    ? "bg-primary/10 text-primary group-hover/li:bg-primary group-hover/li:text-black"
                                    : "bg-white/[0.03] text-zinc-700"
                            )}>
                                {feature.included ? <Check size={isMobile ? 10 : 12} strokeWidth={3} /> : <X size={isMobile ? 8 : 10} />}
                            </div>
                            <span className={cn(
                                "text-[10px] md:text-[11px] font-mono uppercase tracking-[0.1em] md:tracking-[0.2em] transition-colors duration-500 pt-0.5",
                                feature.included ? "text-zinc-400 group-hover/li:text-white" : "text-zinc-700"
                            )}>
                                {feature.label}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <Link
                href={plan.name.includes("Entity") ? "/contact" : "/download"}
                className={cn(
                    "mt-10 md:mt-12 w-full py-5 md:py-6 rounded-xl md:rounded-2xl font-mono font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] md:tracking-[0.5em] flex items-center justify-center gap-3 transition-all duration-500 group/btn relative overflow-hidden",
                    plan.popular
                        ? "bg-primary text-black hover:bg-white shadow-[0_20px_40px_-5px_var(--primary-glow)]"
                        : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                )}
            >
                {plan.cta}
                <ArrowRight size={isMobile ? 12 : 14} className="group-hover/btn:translate-x-2 transition-transform" />

                {plan.popular && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                )}
            </Link>

            {/* Neural Glint for Popular Plan */}
            {plan.popular && (
                <div className="absolute -inset-24 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-5 pointer-events-none" />
            )}
        </motion.div>
    );
}

