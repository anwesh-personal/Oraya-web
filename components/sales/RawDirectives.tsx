"use client";

import { motion } from "framer-motion";
import { Terminal, Shield, Cpu, Code, Command } from "lucide-react";
import { useState } from "react";

const DIRECTIVES = [
    {
        title: "Kernel Configuration",
        id: "kernel",
        code: `{
  "kernel_dominion": "L5_ACTIVE",
  "isolation_mode": "RING_0_SECURE",
  "neural_relay": {
    "sync_latency": "0.12ms",
    "sharding": "AES_256_GCM",
    "telemetry": "DISABLE_ALL"
  }
}`
    },
    {
        title: "Swarm Orchestration",
        id: "swarm",
        code: `{
  "swarm_auth": ["Ora", "Ova", "Mara"],
  "parallel_depth": "0xFFFF",
  "context_rehydration": {
    "speed": "50ms",
    "parity": "99.999%"
  }
}`
    },
    {
        title: "Memory Sharding",
        id: "memory",
        code: `{
  "memory_palace": {
    "total_recall": true,
    "shards": 24,
    "encryption": "XChaCha20-Poly1305",
    "persistence": "RAM_ONLY_EPHEMERAL"
  }
}`
    }
];

export default function RawDirectives() {
    const [activeDirective, setActiveDirective] = useState(0);

    return (
        <section className="py-24 bg-black relative overflow-hidden" id="raw-directives">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                    {/* LEFT CONTENT */}
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="inline-flex items-center gap-3 px-6 py-2 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500"
                            >
                                <Command size={12} className="text-primary" />
                                RAW_ENGINE_DIRECTIVES
                            </motion.div>

                            <h2 className="text-5xl md:text-7xl font-display font-black text-white uppercase tracking-tight leading-none">
                                Tactical <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/40">Evidence.</span>
                            </h2>

                            <p className="text-xl text-zinc-500 font-sans font-light leading-relaxed max-w-lg">
                                We don&apos;t hide behind marketing fluff. These are the raw directives that possess your machine. Every token accounted for. Every syscall authenticated.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {DIRECTIVES.map((d, i) => (
                                <button
                                    key={d.id}
                                    onClick={() => setActiveDirective(i)}
                                    className={`w-full p-6 rounded-3xl border text-left transition-all duration-500 group relative overflow-hidden ${activeDirective === i
                                            ? "bg-white/[0.04] border-primary/40 shadow-2xl"
                                            : "bg-transparent border-white/5 hover:border-white/20"
                                        }`}
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${activeDirective === i ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/10 text-zinc-700"
                                                }`}>
                                                <Terminal size={20} />
                                            </div>
                                            <span className={`text-xl font-bold uppercase tracking-tight ${activeDirective === i ? "text-white" : "text-zinc-500"}`}>
                                                {d.title}
                                            </span>
                                        </div>
                                        {activeDirective === i && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT CODE BLOCK */}
                    <div className="relative">
                        <div className="absolute -inset-10 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

                        <motion.div
                            key={activeDirective}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative rounded-[48px] border border-white/10 bg-[#050505] p-12 shadow-[0_80px_160px_rgba(0,0,0,1)] group"
                        >
                            {/* Window Controls */}
                            <div className="flex gap-2 mb-10">
                                <div className="w-3 h-3 rounded-full bg-red-900/30" />
                                <div className="w-3 h-3 rounded-full bg-yellow-900/30" />
                                <div className="w-3 h-3 rounded-full bg-green-900/30" />
                            </div>

                            <pre className="font-mono text-sm md:text-base leading-relaxed text-primary/80">
                                {DIRECTIVES[activeDirective].code}
                            </pre>

                            {/* Decorative Elements */}
                            <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                                        SHA-256_VERIFIED
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                                        ENCLAVE_READY
                                    </div>
                                </div>
                                <Shield size={16} className="text-zinc-800" />
                            </div>

                            {/* Scanline Effect */}
                            <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(transparent,transparent_50%,rgba(0,0,0,0.05)_50%,rgba(0,0,0,0.05)_100%)] bg-[length:100%_4px] opacity-20" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
