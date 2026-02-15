"use client";

import { motion } from "framer-motion";

const partners = [
    { name: "KERNEL_RND", color: "from-primary/20 to-zinc-900" },
    { name: "NEURAL_AXON", color: "from-zinc-700 to-primary/10" },
    { name: "SOVEREIGN_VEC", color: "from-secondary/20 to-zinc-900" },
    { name: "GHOST_ROOT", color: "from-zinc-800 to-zinc-700" },
    { name: "ORAYA_ELITE", color: "from-primary/20 to-secondary/10" },
    { name: "SHARD_SEC", color: "from-zinc-700 to-zinc-900" },
];

export default function SocialProof() {
    return (
        <section className="py-20 bg-transparent relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2 }}
                    className="space-y-24"
                >
                    <h2 className="text-zinc-700 font-mono font-black text-[10px] uppercase tracking-[0.6em] mb-12">
                        // AUTHORIZED_BY_THE_SOVEREIGN_ARCHITECTS
                    </h2>

                    <div className="relative flex overflow-hidden py-12">
                        <div className="flex animate-marquee whitespace-nowrap gap-32 items-center">
                            {[...partners, ...partners, ...partners, ...partners].map((partner, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-6 group cursor-default"
                                >
                                    <div className={`w-1 h-14 bg-gradient-to-b ${partner.color} opacity-20 group-hover:opacity-80 transition-all duration-1000`} />
                                    <span className="text-3xl md:text-5xl font-display font-black text-white/[0.15] group-hover:text-white/60 group-hover:scale-105 transition-all duration-1000 tracking-tight uppercase">
                                        {partner.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Masking gradients for the marquee */}
                        <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-[#050505] to-transparent z-10" />
                        <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-[#050505] to-transparent z-10" />
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}
