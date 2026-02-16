"use client";

import { motion } from "framer-motion";
import { Shield, Cpu, Lock, Zap, Network, Server, Fingerprint } from "lucide-react";

export default function PerimeterMap() {
    return (
        <section className="py-24 bg-surface-0 relative overflow-hidden border-t border-white/5" id="perimeter">
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Header */}
                <div className="max-w-4xl mb-24">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-3 px-6 py-2 bg-primary/5 border border-primary/20 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8"
                    >
                        <Network size={12} />
                        PHYSICAL_SOVEREIGNTY_MAP
                    </motion.div>

                    <h2 className="text-5xl md:text-8xl font-display font-black text-white uppercase tracking-tighter leading-[0.85] mb-8">
                        The Sovereign <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/40 to-white/10">Perimeter.</span>
                    </h2>

                    <p className="text-xl md:text-2xl text-zinc-500 font-sans font-light max-w-2xl leading-relaxed">
                        Architecture is destiny. We didn&apos;t just build a tool; we defined a <span className="text-white italic">boundary</span> where your data ends and the cloud begins.
                    </p>
                </div>

                {/* ARCHITECTURE MAP */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden lg:block -z-10" />

                    <MapNode
                        index={1}
                        delay={0}
                        icon={Cpu}
                        label="HARDWARE_ENCLAVE"
                        title="Physical Isolation"
                        desc="Weights are sharded into local RAM. They never touch the disk in unencrypted forms."
                        color="var(--primary)"
                    />

                    <MapNode
                        index={2}
                        delay={0.2}
                        icon={Lock}
                        label="SOVEREIGN_KERNEL"
                        title="The Sidecar Bridge"
                        desc="A local Rust binary handles all file-ops. We possession files at the byte-level, bypassing APIs."
                        color="#ffffff"
                    />

                    <MapNode
                        index={3}
                        delay={0.4}
                        icon={Shield}
                        label="ZERO_KNOWLEDGE"
                        title="E2EE Tunneling"
                        desc="When you chosen to sync, it's a private tunnel. No logs on our side. No telemetry for OpenAI."
                        color="var(--secondary)"
                    />

                    <MapNode
                        index={4}
                        delay={0.6}
                        icon={Fingerprint}
                        label="LOCAL_KEYCHAIN"
                        title="Hardware Auth"
                        desc="API keys never leave your machine. Secured by native FaceID/TouchID enclaves."
                        color="var(--primary)"
                    />
                </div>

                {/* BOTTOM SUMMARY */}
                <div className="mt-24 p-12 rounded-[48px] bg-white/[0.01] border border-white/[0.05] grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                    <div className="space-y-4">
                        <div className="text-primary font-mono text-[10px] uppercase font-black tracking-widest">RESIDENT_INTEL</div>
                        <p className="text-zinc-600 text-sm font-light uppercase tracking-tight leading-snug">
                            Models are executed on <span className="text-white">your hardware</span>, utilizing local GPU optimization for sub-12ms response.
                        </p>
                    </div>
                    <div className="space-y-4 border-y md:border-y-0 md:border-x border-white/5 py-8 md:py-0 md:px-12">
                        <div className="text-secondary font-mono text-[10px] uppercase font-black tracking-widest">ZERO_LAND</div>
                        <p className="text-zinc-600 text-sm font-light uppercase tracking-tight leading-snug">
                            We don&apos;t rent cloud servers. You don&apos;t lease your context. <span className="text-white">You own the machine.</span>
                        </p>
                    </div>
                    <div className="space-y-4 md:pl-12">
                        <div className="text-white font-mono text-[10px] uppercase font-black tracking-widest">BYPASS_ELECTRON</div>
                        <p className="text-zinc-600 text-sm font-light uppercase tracking-tight leading-snug">
                            Byte-level encryption bypassing standard browser sandbox limitations for <span className="text-white">Total OS Dominion</span>.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MapNode({ icon: Icon, label, title, desc, color, index, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 1 }}
            className="group relative p-10 rounded-[40px] border border-white/5 bg-[#080808] hover:border-white/20 transition-all duration-700 h-full flex flex-col justify-between"
        >
            {/* Number Indicator */}
            <div className="absolute top-8 right-8 text-[10px] font-mono text-zinc-800 font-bold">
                0{index}
            </div>

            <div className="space-y-6">
                <div className="w-16 h-16 rounded-[24px] bg-black border border-white/10 flex items-center justify-center group-hover:border-[currentColor] transition-colors duration-500 shadow-2xl" style={{ color }}>
                    <Icon size={32} strokeWidth={1} />
                </div>

                <div className="space-y-2">
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em] font-black group-hover:text-[currentColor] transition-colors" style={{ color: color + '80' }}>
                        {label}
                    </div>
                    <h4 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h4>
                </div>
            </div>

            <p className="mt-8 text-[15px] text-zinc-500 font-sans font-light leading-relaxed group-hover:text-zinc-300 transition-colors italic">
                &quot;{desc}&quot;
            </p>

            {/* Bottom Glow */}
            <div className="absolute inset-x-0 bottom-0 h-1 opacity-0 group-hover:opacity-40 transition-opacity" style={{ background: color }} />
        </motion.div>
    );
}
