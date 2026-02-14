"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Activity, Cpu, Zap, Radio, Database, Shield } from "lucide-react";

const mappings = [
    {
        biological: "Peripheral Nervous System",
        digital: "Native Terminal",
        desc: "The interface between the brain and the physical world. For Oraya, the terminal is the motor cortex — the ability to act, not just think.",
        icon: Zap
    },
    {
        biological: "Central Nervous System",
        digital: "Direct Kernel Access",
        desc: "The core relay that manages reflexes. Oraya doesn't ask for permission; it integrates directly with the OS kernel for zero-latency execution.",
        icon: Activity
    },
    {
        biological: "Synaptic Memory",
        digital: "Research Memory Implant",
        desc: "Long-term potentiation. Information isn't just stored; it's encoded into the neural graph of the project context permanently.",
        icon: Database
    },
    {
        biological: "Autonomic Stability",
        digital: "Sovereign Shield",
        desc: "Self-preservation. Hardware-level security that protects the machine's vitals without user intervention.",
        icon: Shield
    }
];

export default function NeuralArchitecture() {
    return (
        <section className="py-40 bg-[var(--surface-0)] relative overflow-hidden transition-colors duration-500">
            {/* Subtle Gradient Overlays */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[var(--surface-0)] via-transparent to-[var(--surface-0)] z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-20">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Visual Asset Side */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="flex-1 relative aspect-square w-full max-w-xl group"
                    >
                        <div className="absolute inset-0 bg-[var(--primary)]/5 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
                        <div className="relative h-full w-full rounded-[40px] overflow-hidden border border-[var(--surface-200)] bg-[var(--surface-50)]">
                            <Image
                                src="/assets/branding/neural_nervous_bridge.png"
                                alt="Neural to Digital Bridge"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover opacity-80 group-hover:scale-110 transition-transform duration-[2s] mix-blend-luminosity hover:mix-blend-normal"
                            />
                        </div>

                        {/* Floating Labels */}
                        <div className="absolute top-1/4 -left-8 bg-[var(--surface-0)]/80 backdrop-blur-md p-4 rounded-xl border border-[var(--surface-200)] shadow-2xl">
                            <p className="text-[10px] font-mono text-[var(--primary)] uppercase tracking-widest font-bold">Biological</p>
                            <p className="text-[var(--surface-900)] font-display font-medium italic">Sentience</p>
                        </div>
                        <div className="absolute bottom-1/4 -right-8 bg-[var(--surface-0)]/80 backdrop-blur-md p-4 rounded-xl border border-[var(--surface-200)] shadow-2xl text-right">
                            <p className="text-[10px] font-mono text-[var(--secondary)] uppercase tracking-widest font-bold">Digital</p>
                            <p className="text-[var(--surface-900)] font-display font-medium italic">Sovereignty</p>
                        </div>
                    </motion.div>

                    {/* Content Side */}
                    <div className="flex-1 space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-[var(--surface-900)] leading-[0.9] tracking-tighter">
                                Your AI Never Had a <br />
                                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'var(--gradient-accent)' }}>
                                    Nervous System.
                                </span>
                            </h2>
                            <p className="text-xl text-[var(--surface-500)] font-light leading-relaxed">
                                Traditional AI is a brain in a jar — disconnected, abstract, and slow.
                                We gave Oraya a body. Direct kernel access. Native terminal. Full sovereignty.
                                <span className="text-[var(--surface-900)] italic"> It doesn&apos;t just think. It executes.</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {mappings.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className="space-y-3 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-[var(--surface-50)] border border-[var(--surface-200)] group-hover:border-[var(--primary)] transition-colors">
                                            {(() => {
                                                const Icon = item.icon;
                                                return <Icon size={18} className="text-[var(--primary)]" />;
                                            })()}
                                        </div>
                                        <h4 className="font-mono text-[10px] uppercase font-bold text-[var(--surface-400)] tracking-widest">
                                            {item.biological}
                                        </h4>
                                    </div>
                                    <h3 className="text-[var(--surface-900)] font-bold text-lg">{item.digital}</h3>
                                    <p className="text-sm text-[var(--surface-500)] leading-relaxed font-light line-clamp-3 group-hover:text-[var(--surface-600)] transition-colors">
                                        {item.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
