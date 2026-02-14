"use client";

import { motion } from "framer-motion";

const partners = [
    { name: "NEURAL_NET", color: "from-[#00F0FF] to-white" },
    { name: "RESONANCE_CORE", color: "from-white to-[#FF00AA]" },
    { name: "SOVEREIGN_LABS", color: "from-emerald-400 to-[#00F0FF]" },
    { name: "GHOST_SHELL", color: "from-[#FF00AA] to-purple-500" },
    { name: "AETHER_OS", color: "from-amber-400 to-[#00F0FF]" },
    { name: "SAD_REDACTED", color: "from-red-500 to-white" },
];

export default function SocialProof() {
    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Very faint top/bottom glow lines */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="space-y-16"
                >
                    <h2 className="text-zinc-600 font-mono font-black text-[10px] uppercase tracking-[0.5em] mb-12">
                        // AUTHORIZED BY THE SOVEREIGN ARCHITECTS
                    </h2>

                    <div className="relative flex overflow-hidden">
                        <div className="flex animate-marquee whitespace-nowrap gap-20 items-center">
                            {[...partners, ...partners, ...partners].map((partner, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 group cursor-default"
                                >
                                    <div className={`w-2 h-10 bg-gradient-to-b ${partner.color} opacity-20 group-hover:opacity-100 transition-opacity duration-500`} />
                                    <span className="text-2xl md:text-4xl font-display font-black text-white/20 group-hover:text-white transition-all duration-500 tracking-tighter">
                                        {partner.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Masking gradients for the marquee */}
                        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10" />
                        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10" />
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}
