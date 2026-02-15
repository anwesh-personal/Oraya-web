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

import { ResponsiveSwitcher } from "./responsive/ResponsiveSwitcher";

export default function NeuralArchitecture() {
    const visualAsset = (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="flex-1 relative aspect-square w-full max-w-xl group"
        >
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-[60px] md:blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
            <div className="relative h-full w-full rounded-[40px] md:rounded-[60px] overflow-hidden border border-white/10 bg-black/50 backdrop-blur-3xl">
                <Image
                    src="/assets/branding/neural_nervous_bridge.png"
                    alt="Neural to Digital Bridge"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-60 grayscale group-hover:scale-105 transition-transform duration-[2s] hover:grayscale-0"
                />
            </div>

            {/* Floating Labels - Optimized for Mobile */}
            <div className="absolute top-1/4 -left-4 md:-left-8 bg-black/40 backdrop-blur-3xl p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl space-y-1">
                <p className="text-[7px] md:text-[9px] font-mono text-primary uppercase tracking-[0.4em] font-black">BIOLOGICAL</p>
                <p className="text-white font-display font-black uppercase text-base md:text-xl tracking-tight">Sentience</p>
            </div>
            <div className="absolute bottom-1/4 -right-4 md:-right-8 bg-black/40 backdrop-blur-3xl p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl text-right space-y-1">
                <p className="text-[7px] md:text-[9px] font-mono text-secondary uppercase tracking-[0.4em] font-black">DIGITAL</p>
                <p className="text-white font-display font-black uppercase text-base md:text-xl tracking-tight">Sovereignty</p>
            </div>
        </motion.div>
    );

    const contentHeader = (
        <div className="space-y-6 md:space-y-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full font-mono text-[9px] font-black uppercase tracking-[0.4em] text-primary"
            >
                <Radio size={12} className="animate-pulse" />
                System_Evolution_Spec
            </motion.div>

            <h2 className="text-5xl md:text-8xl font-display font-black text-white leading-[0.85] tracking-tight uppercase">
                Your AI Never <br />
                Had a <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary/40 animate-gradient-x bg-[length:200%_auto]">
                    Nervous System.
                </span>
            </h2>
            <p className="text-lg md:text-xl text-zinc-500 font-sans font-extralight leading-relaxed tracking-tight max-w-xl">
                Traditional AI is a brain in a jar — disconnected, abstract, and slow.
                We gave Oraya a body. Direct kernel access. Native terminal. Full sovereignty.
                <span className="text-white font-medium"> It doesn&apos;t just think. It executes.</span>
            </p>
        </div>
    );

    const mappingGrid = (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {mappings.map((item, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="space-y-4 group p-6 rounded-3xl border border-white/5 bg-white/[0.01] hover:border-primary/20 transition-all duration-500"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-primary/30 transition-colors">
                            {(() => {
                                const Icon = item.icon;
                                return <Icon size={20} className="text-primary" />;
                            })()}
                        </div>
                        <h4 className="font-mono text-[9px] uppercase font-black text-zinc-600 tracking-[0.3em] group-hover:text-primary/70 transition-colors">
                            {item.biological}
                        </h4>
                    </div>
                    <h3 className="text-white font-display font-black text-xl uppercase tracking-tight">{item.digital}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed font-sans font-extralight group-hover:text-zinc-400 transition-colors">
                        {item.desc}
                    </p>
                </motion.div>
            ))}
        </div>
    );

    const desktopView = (
        <div className="max-w-7xl mx-auto px-6 relative z-20">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                {visualAsset}
                <div className="flex-1 space-y-12">
                    {contentHeader}
                    {mappingGrid}
                </div>
            </div>
        </div>
    );

    const mobileView = (
        <div className="px-6 relative z-20 space-y-16">
            <div className="space-y-10">
                {contentHeader}
                <div className="px-4">
                    {visualAsset}
                </div>
            </div>
            {mappingGrid}
        </div>
    );

    return (
        <section className="py-20 md:py-24 bg-[#020202] relative overflow-hidden border-y border-white/5">
            {/* Ambient Background UI elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-[150px] pointer-events-none" />

            <ResponsiveSwitcher mobile={mobileView} desktop={desktopView} />
        </section>
    );
}

