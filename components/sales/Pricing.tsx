"use client";

import { Check, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

export default function PricingSection() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const plans = [
        {
            name: "Personal",
            price: "$9.95",
            sub: "/month · 1 Month Free Trial",
            cta: "Claim Free Month",
            ctaStyle: "bg-white/10 text-white border border-white/10 hover:bg-white/20",
            features: [
                "1 Sovereign Agent (Ova)",
                "1 Dedicated Workspace",
                "Full Neural Core access",
                "Local LLM + Cloud Hybrid",
                "Sovereign Memory Implant",
                "$97/Year available",
                "Discord Community Access",
            ],
            highlight: false,
        },
        {
            name: "Pro",
            price: "$49",
            sub: "/month · or $32 billed yearly",
            cta: "Ascend to Pro",
            ctaStyle: "bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(0,240,255,0.2)]",
            features: [
                "Full Elite Swarm (Ora, Ova, Mara, Saira)",
                "Unlimited Workspaces",
                "Multi-Agent Parallelism",
                "Advanced Neural Recon",
                "Ghost Ops / Wraith Mode",
                "Priority Kernel Support",
                "Early Access to New Beasts",
            ],
            highlight: true,
            badge: "Most Powerful",
        },
        {
            name: "Team",
            price: "$67",
            sub: "per user/month · or $47 billed yearly",
            cta: "Deploy for Teams",
            ctaStyle: "bg-white/10 text-white border border-white/10 hover:bg-white/20",
            features: [
                "Everything in Pro",
                "Dedicated Team Node",
                "Centralized Neural Relay",
                "Advanced Admin Control",
                "Audit Logs + Compliance",
                "Self-Hosted Support",
                "Direct Architect Access",
            ],
            highlight: false,
        },
    ];

    if (!mounted) return null;

    return (
        <section className="py-40 bg-[var(--surface-0)] relative overflow-hidden transition-colors duration-500" id="pricing">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--primary-glow)] rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">

                <div className="text-center mb-24 space-y-6">
                    <h2 className="text-5xl md:text-7xl font-display font-black text-[var(--surface-900)] tracking-tighter leading-none">
                        Simple, Honest <br />
                        <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'var(--gradient-accent)' }}>Pricing.</span>
                    </h2>
                    <p className="text-xl text-[var(--surface-500)] font-light max-w-2xl mx-auto">
                        Start free. Scale when you&apos;re ready. No surprises.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className={`relative rounded-3xl p-8 md:p-10 flex flex-col justify-between transition-all duration-300 ${plan.highlight
                                ? 'bg-[var(--surface-50)] border-2 border-[var(--primary)] shadow-[0_0_60px_-15px_var(--primary-glow)]'
                                : 'bg-[var(--surface-50)] border border-[var(--surface-200)]'
                                }`}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs rounded-full uppercase tracking-wider flex items-center gap-1 shadow-[0_0_20px_var(--primary-glow)]">
                                    <Sparkles size={12} />
                                    {plan.badge}
                                </div>
                            )}

                            <div className="space-y-8">
                                {/* Header */}
                                <div>
                                    <h3 className="text-xl font-display font-bold text-[var(--surface-900)] mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl md:text-6xl font-display font-black text-[var(--surface-900)]">{plan.price}</span>
                                    </div>
                                    <p className="text-sm text-[var(--surface-500)] mt-2 font-mono">{plan.sub}</p>
                                </div>

                                {/* Features */}
                                <ul className="space-y-4">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-start gap-3">
                                            <Check size={18} className={`shrink-0 mt-0.5 ${plan.highlight ? 'text-[var(--primary)]' : 'text-[var(--surface-400)]'}`} />
                                            <span className="text-[var(--surface-600)] text-sm">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CTA */}
                            <Link
                                href={plan.name === "Team" ? "/contact" : "/download"}
                                className={`mt-10 w-full py-4 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 ${plan.ctaStyle}`}
                            >
                                {plan.cta}
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
