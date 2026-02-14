"use client";

import { motion } from "framer-motion";
import {
    Cpu, Network, HardDrive, Shield, Zap, GitBranch,
    Terminal, Layers, Globe, Activity, Book, Code,
    Database, Lock, Radio, Workflow, Eye, Boxes,
    RefreshCw, CloudOff, Scan, FileCode, Binary, Command
} from "lucide-react";

const CATEGORIES = [
    { id: "core", label: "01 // CORE_KERNEL", color: "#00F0FF", bg: "rgba(0, 240, 255, 0.03)" },
    { id: "memory", label: "02 // NEURAL_RECALL", color: "#FF00AA", bg: "rgba(255, 0, 170, 0.03)" },
    { id: "security", label: "03 // SOVEREIGN_VAULT", color: "#10B981", bg: "rgba(16, 185, 129, 0.03)" },
    { id: "execution", label: "04 // DOMINION_ENGINE", color: "#F0B429", bg: "rgba(240, 180, 41, 0.03)" },
];

const VALUE_STACK = [
    {
        title: "Recursive Learning Loops",
        icon: RefreshCw,
        desc: "The OS learns from 100% of your interactions daily, refining its internal weights to match your coding style perfectly.",
        cat: "core",
        serial: "K-PROC-77X",
        spec: "Weight optimization: 0.004ms per token delta."
    },
    {
        title: "Self-Healing Filesystem",
        icon: HardDrive,
        desc: "Automatically detects broken imports, missing assets, and corrupted references, patching them in the background.",
        cat: "core",
        serial: "K-FS-900",
        spec: "Auto-scan: 12.4M files/sec."
    },
    {
        title: "Dream State Processing",
        icon: CloudOff,
        desc: "While you sleep, Oraya indexes new libraries, optimizes context paths, and reorganizes your knowledge graph.",
        cat: "core",
        serial: "K-HYPNOS-4",
        spec: "Idle consumption: <0.5% CPU."
    },
    {
        title: "Neural Defragmentation",
        icon: Network,
        desc: "Reorders scattered project context into coherent, linear narratives that LLMs can understand instantly.",
        cat: "core",
        serial: "K-SHARD-X",
        spec: "Entropy reduction: 84.2% peak."
    },
    {
        title: "Semantic Caching",
        icon: Layers,
        desc: "Intelligently deduplicates queries and caches responses, reducing your API costs by 40% automatically.",
        cat: "memory",
        serial: "M-CACHE-V2",
        spec: "Hit rate: 92% historical avg."
    },
    {
        title: "Memory Palace",
        icon: Database,
        desc: "A vector database that indexes every keystroke, allowing you to search for 'that code I wrote last Tuesday' instantly.",
        cat: "memory",
        serial: "M-STORE-LR",
        spec: "Recall latency: <5ms at 10M nodes."
    },
    {
        title: "Version Deep-Link",
        icon: GitBranch,
        desc: "Connects chat context directly to specific git commits, allowing you to trace the evolution of your logic.",
        cat: "memory",
        serial: "M-GIT-SYNC",
        spec: "Commit resolution: SHA-256 depth."
    },
    {
        title: "Sovereign Key Vault",
        icon: Lock,
        desc: "Your API keys never leave your machine. They are encrypted with AES-256 GCM and stored in your OS keychain.",
        cat: "security",
        serial: "S-CRYPT-9",
        spec: "Hardware Enclave: SE-v2 isolation."
    },
    {
        title: "Ghost Protocol",
        icon: Eye,
        desc: "Activates a completely untraceable mode. No logs, no history, ephemeral execution containers. 100% stealth.",
        cat: "security",
        serial: "S-GHOST-EP",
        spec: "No-Trace persistence: 0.00% metadata."
    },
    {
        title: "Local LLM Runtime",
        icon: Cpu,
        desc: "Run Llama-3, Mistral, and other open weights locally with full hardware acceleration support.",
        cat: "security",
        serial: "S-METAL-X",
        spec: "Acceleration: Metal/CUDA L1."
    },
    {
        title: "Auto-Refactor Agent",
        icon: Code,
        desc: "Background agents proactively scan for technical debt and open Pull Requests with massive quality improvements.",
        cat: "execution",
        serial: "E-AGENT-QL",
        spec: "Debt detection: Static+Dynamic."
    },
    {
        title: "Workflow Automator",
        icon: Workflow,
        desc: "Chain together multiple AI agents to perform complex, multi-step background tasks while you focus on logic.",
        cat: "execution",
        serial: "E-CHAIN-ML",
        spec: "Orchestration: 5-way parallel max."
    }
];

export default function GrandOffer() {
    return (
        <section id="grand-offer" className="py-24 md:py-48 bg-black relative overflow-hidden noise-overlay">
            <div className="scanline" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">

                {/* ACT HEADER: The Manifest */}
                <div className="mb-32 space-y-8">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-[#F0B429]">
                        <Scan size={14} className="animate-pulse" />
                        GLOBAL_ASSET_MANIFEST_v2.0
                    </div>

                    <h2 className="text-6xl md:text-9xl font-sans font-black text-white tracking-tighter leading-[0.85] uppercase">
                        The Grand <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-700">Offering.</span>
                    </h2>

                    <p className="text-zinc-500 font-light text-2xl max-w-3xl uppercase tracking-tighter">
                        20 specialized technical shards. <br />
                        One <span className="text-white italic">Sovereign Ecosystem</span>.
                    </p>
                </div>

                {/* THE INVENTORY GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {VALUE_STACK.map((item, i) => (
                        <InventoryCard key={i} item={item} index={i} />
                    ))}

                    {/* Placeholder for 'More to come' */}
                    <div className="p-12 rounded-[40px] border border-dashed border-white/5 flex flex-col items-center justify-center gap-6 opacity-20 hover:opacity-100 transition-opacity group">
                        <Binary size={48} className="text-zinc-500 group-hover:text-[#F0B429] transition-colors" />
                        <div className="text-center">
                            <div className="text-xs font-mono text-zinc-600 uppercase tracking-widest">Awaiting_Sync</div>
                            <div className="text-white font-black uppercase mt-2">8 More Subsystems</div>
                        </div>
                    </div>
                </div>

                {/* Final CTA Strip */}
                <div className="mt-32 p-12 rounded-[40px] bg-white/[0.01] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 group">
                    <div className="space-y-4 text-center md:text-left">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Ready for Sovereignty?</h3>
                        <p className="text-zinc-500 font-light text-lg uppercase tracking-tighter">Your machine. Your code. Your rules.</p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-12 py-6 bg-white text-black font-mono font-black text-sm uppercase tracking-[0.3em] rounded-2xl hover:bg-[#F0B429] transition-all relative overflow-hidden group/btn shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                    >
                        <span className="relative z-10">Initialize_Kernel</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    </motion.button>
                </div>
            </div>
        </section>
    );
}

function InventoryCard({ item, index }: { item: typeof VALUE_STACK[0], index: number }) {
    const category = CATEGORIES.find(c => c.id === item.cat);
    const Icon = item.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="group relative p-8 rounded-[32px] bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-all duration-500 overflow-hidden min-h-[400px] flex flex-col justify-between"
        >
            {/* Blueprint Overlay (Bottom right) */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                <Icon size={120} strokeWidth={0.5} style={{ color: category?.color }} />
            </div>

            {/* Header: Serial + Tag */}
            <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-1">
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.5em]">Serial_ID</div>
                    <div className="text-[11px] font-mono text-white tracking-widest">{item.serial}</div>
                </div>
                <div className="px-3 py-1 bg-black border border-white/5 rounded-full text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                    {category?.label}
                </div>
            </div>

            {/* Body */}
            <div className="relative z-10 space-y-6 mt-12">
                <div className="w-16 h-16 rounded-2xl bg-black border border-white/5 flex items-center justify-center group-hover:border-[currentColor] transition-colors duration-500" style={{ color: category?.color }}>
                    <Icon size={32} strokeWidth={1} />
                </div>
                <div className="space-y-4">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-white transition-colors">{item.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed group-hover:text-zinc-300 transition-colors font-light italic">&quot;{item.desc}&quot;</p>
                </div>
            </div>

            {/* Spec Footer: Technical detail */}
            <div className="relative z-10 mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: category?.color }} />
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{item.spec}</span>
                </div>
                <div className="text-zinc-800 group-hover:text-white transition-colors">
                    <Command size={14} />
                </div>
            </div>
        </motion.div>
    );
}
