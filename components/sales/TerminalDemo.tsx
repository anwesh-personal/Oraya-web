"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal, Shield, Cpu, Activity, Zap, Box, Command, Search, Sparkles, ChevronRight, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COMMAND_HINTS = [
    { cmd: "oraya --analyze", desc: "Scan project for context leaks" },
    { cmd: "oraya --brain-link", desc: "Establish OS kernel bridge" },
    { cmd: "oraya --vault-secure", desc: "Encrypt local memory shards" },
    { cmd: "oraya --dominate", desc: "Unlock peak hardware mode" },
];

export default function TerminalDemo() {
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<string[]>([
        "ORAYA_KERNEL_v3.2.1 // BOOT_SUCCESS",
        "NEURAL_LATENCY: 8ms [OPTIMAL]",
        "SYSTEM_STATUS: SOVEREIGN_MODE_ACTIVE",
        "READY_FOR_ARCHITECT_INPUT...",
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isProcessing]);

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        const cmd = input.trim().toLowerCase();
        setHistory(prev => [...prev, `> ${input}`]);
        setInput("");
        setIsProcessing(true);

        await new Promise(r => setTimeout(r, 800));

        if (cmd === "help") {
            setHistory(prev => [...prev,
                "AUTHORIZED_PROTOCOLS:",
                "  --analyze     Semantic structure audit",
                "  --brain-link   Global relay handshake",
                "  --vault       AES-256 shard validation",
                "  --dominate    GENESIS_LEVEL_CLEARANCE",
                "  clear         Reset session buffers",
            ]);
        } else if (cmd.includes("--analyze")) {
            setHistory(prev => [...prev,
                "SHARDING_PROJECT_CONTEXT...",
                "FOUND: 12 circular leaks in /lib/core",
                "ACTION: Native refactor injected.",
                "IQ_BOOST: +14.2% verified."
            ]);
        } else if (cmd.includes("--dominate")) {
            setHistory(prev => [...prev,
                "CRITICAL: UNLOCKING GENESIS_MODULE...",
                "INTENT_ENGINE: Bypassing browser stack.",
                "HARDWARE_LINK: Direct GPU-to-Neuron link.",
                "WELCOME HOME, MASTER_ARCHITECT."
            ]);
        } else if (cmd === "clear") {
            setHistory([]);
        } else {
            setHistory(prev => [...prev, `ERR: PROTOCOL '${cmd}' NOT FOUND.`]);
        }

        setIsProcessing(false);
    };

    return (
        <section className="py-24 md:py-48 bg-black relative overflow-hidden noise-overlay">
            {/* Ambient Background UI elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00F0FF]/[0.05] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#FF00AA]/[0.05] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-full font-mono text-[9px] font-black uppercase tracking-[0.4em] text-[#00F0FF] backdrop-blur-3xl"
                    >
                        <Terminal size={12} />
                        Kernel_Interface_01
                    </motion.div>

                    <h2 className="text-5xl md:text-8xl font-sans font-black text-white tracking-tighter leading-[0.9] uppercase">
                        Direct <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/50 to-white/20">Domination.</span>
                    </h2>

                    <p className="text-lg md:text-xl text-zinc-500 font-sans font-light max-w-2xl mx-auto leading-relaxed tracking-tight">
                        No UI lag. No cloud middle-men. <br className="hidden md:block" />
                        Command your infrastructure through the first native kernel for AI.
                    </p>
                </div>

                {/* THE TERMINAL 2.0 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative w-full max-w-4xl mx-auto rounded-[32px] overflow-hidden border border-white/10 bg-[#050505] shadow-[0_60px_150px_rgba(0,0,0,1)] group"
                >
                    {/* Glass Header */}
                    <div className="bg-white/[0.03] px-8 py-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
                        <div className="flex gap-2.5">
                            <div className="w-3 h-3 rounded-full bg-red-900/30" />
                            <div className="w-3 h-3 rounded-full bg-yellow-900/30" />
                            <div className="w-3 h-3 rounded-full bg-green-900/30" />
                        </div>
                        <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-2">
                            <Lock size={10} /> ORAYA_ADMIN // ROOT_ACCESS
                        </div>
                        <div className="w-12 h-1 bg-white/5 rounded-full" />
                    </div>

                    {/* Terminal Body */}
                    <div className="relative p-10 h-[500px] flex flex-col items-stretch">
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto space-y-3 font-mono text-[13px] text-left custom-scrollbar scroll-smooth"
                        >
                            <AnimatePresence mode="popLayout">
                                {history.map((line, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex items-start gap-3 ${line.startsWith(">") ? "text-white font-black" :
                                                line.includes("SUCCESS") || line.includes("BOOT") ? "text-[#00F0FF]" :
                                                    line.includes("CRITICAL") || line.includes("INTENT") ? "text-[#FF00AA]" :
                                                        "text-zinc-600"
                                            }`}
                                    >
                                        <span className="opacity-20 flex-shrink-0">[{i.toString().padStart(2, '0')}]</span>
                                        <span className="leading-relaxed">{line}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isProcessing && (
                                <div className="flex items-center gap-3 text-[#0090FF] animate-pulse">
                                    <span className="opacity-20">[..]</span>
                                    <span className="text-[11px] uppercase tracking-widest">Sharding_Neurons...</span>
                                </div>
                            )}
                        </div>

                        {/* Interactive Input Layer */}
                        <form onSubmit={handleCommand} className="mt-8 relative pt-6 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <span className="text-[#00F0FF] font-black tracking-widest">$</span>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Execute protocol..."
                                    className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-zinc-800"
                                    autoFocus
                                />
                                <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-white/10 opacity-30">
                                    <span className="text-[9px] font-mono font-black text-white">ENTER</span>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Subtle Scanline Overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(transparent,transparent_50%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.2)_100%)] bg-[length:100%_4px] opacity-20" />
                </motion.div>

                {/* Command Quicklinks - Reduced Scale */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
                    {COMMAND_HINTS.map((hint, i) => (
                        <button
                            key={i}
                            onClick={() => setInput(hint.cmd)}
                            className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-[#00F0FF]/30 hover:bg-[#00F0FF]/5 transition-all duration-300 text-left group"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-mono font-black text-white uppercase tracking-tighter group-hover:text-[#00F0FF] transition-colors">{hint.cmd}</span>
                            </div>
                            <p className="text-[10px] text-zinc-600 font-sans tracking-wide">{hint.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
