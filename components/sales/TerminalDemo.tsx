"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal, Shield, Cpu, Activity, Zap, Box, Command, Search, Sparkles, ChevronRight, Lock } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const COMMAND_HINTS = [
    {
        cmd: "oraya --analyze", desc: "Semantic structure audit", response: [
            "SCANNING_NEURAL_GRAPH...",
            "INDEXING: 4,102 modules in 0.8ms",
            "DETECTED: 12 circular context leaks",
            "PATCHING: 0x8F01 -> 0x8F02 [SUCCESS]",
            "RESULT: Contextual amnesia eliminated."
        ]
    },
    {
        cmd: "oraya --brain-link", desc: "Establish OS kernel bridge", response: [
            "INITIATING_GLOBAL_RELAY_HANDSHAKE...",
            "LINKING: Local Kernel ↔ Global Synapse",
            "SYNC: 100% Lossless rehydration",
            "STATUS: Biological relay established.",
            "LATENCY: < 1ms verified [OPTIMAL]"
        ]
    },
    {
        cmd: "oraya --vault-secure", desc: "Encrypt local memory shards", response: [
            "ENGAGING_AES_256_GCM_PROTOCOL...",
            "SHARDING: Local context memory shards",
            "ROTATING: Session keys per packet",
            "VAULT: Physical RAM isolation ACTIVE",
            "SECURITY: Data physically cannot leave."
        ]
    },
    {
        cmd: "oraya --dominate", desc: "Unlock peak hardware mode", response: [
            "CRITICAL: BYPASSING_SANDBOX_LIMITS...",
            "DIRECT_ACCESS: GPU_NEURON_BRIDGE_v5",
            "OVERRIDE: Browser stack latency tax removed",
            "GENESIS: Sovereign control engaged.",
            "WELCOME HOME, MASTER_ARCHITECT."
        ]
    },
];

export default function TerminalDemo() {
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<string[]>([
        "ORAYA_KERNEL_v4.0.2 // BOOT_SUCCESS",
        "NEURAL_LATENCY: 0.2ms [NATIVE]",
        "SYSTEM_STATUS: SOVEREIGN_MODE_ACTIVE",
        "READY_FOR_ARCHITECT_INPUT...",
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [autoCycleIndex, setAutoCycleIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.3 });

    useEffect(() => {
        if (!isInView || isProcessing || isHovered) return;

        const cycle = setInterval(() => {
            const nextCmd = COMMAND_HINTS[autoCycleIndex];
            executeAutomation(nextCmd.cmd, nextCmd.response);
            setAutoCycleIndex((prev) => (prev + 1) % COMMAND_HINTS.length);
        }, 6000);

        return () => clearInterval(cycle);
    }, [autoCycleIndex, isInView, isProcessing, isHovered]);

    const executeAutomation = async (cmd: string, response: string[]) => {
        setIsProcessing(true);
        setHistory(prev => [...prev, `> ${cmd}`]);

        await new Promise(r => setTimeout(r, 600));

        for (const line of response) {
            setHistory(prev => [...prev, line]);
            await new Promise(r => setTimeout(r, 200));
        }

        setIsProcessing(false);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isProcessing]);

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        const cmd = input.trim().toLowerCase();
        const hint = COMMAND_HINTS.find(h => h.cmd === cmd);

        if (hint) {
            executeAutomation(hint.cmd, hint.response);
        } else if (cmd === "clear") {
            setHistory(["SESSION_CLEARED // RELOADING_KERNEL..."]);
        } else {
            setHistory(prev => [...prev, `> ${input}`, `ERR: PROTOCOL '${cmd}' NOT FOUND.`]);
        }

        setInput("");
    };

    return (
        <section ref={containerRef} className="py-24 bg-surface-0 relative overflow-hidden">
            {/* Ambient Background UI elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.05] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-secondary/[0.05] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-3 px-6 py-2 bg-white/[0.03] border border-white/[0.08] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.4em] text-primary shadow-[0_0_40px_rgba(245,158,11,0.1)] backdrop-blur-3xl"
                    >
                        <Terminal size={12} className="text-secondary" />
                        Intelligence_Kernel_v4.0.2
                    </motion.div>

                    <h2 className="text-5xl md:text-8xl font-display font-black text-white tracking-tight leading-[0.9] uppercase">
                        Precision <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary via-[80%] to-secondary">Control.</span>
                    </h2>

                    <p className="text-lg md:text-xl text-zinc-500 font-sans font-extralight max-w-2xl mx-auto leading-relaxed tracking-tight">
                        This is the first native kernel designed for sovereign intelligence. <br className="hidden md:block" />
                        No lag. No cloud middle-men. Just raw, unadulterated execution.
                    </p>
                </div>

                {/* THE TERMINAL 2.0 */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="relative w-full max-w-5xl mx-auto rounded-[48px] overflow-hidden border border-white/10 bg-[#050505] shadow-[0_80px_200px_rgba(0,0,0,1)] group"
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
                    <div className="relative p-12 h-[550px] flex flex-col items-stretch">
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
                                            line.includes("SUCCESS") || line.includes("BOOT") ? "text-secondary" :
                                                line.includes("CRITICAL") || line.includes("INTENT") ? "text-primary" :
                                                    "text-zinc-600"
                                            }`}
                                    >
                                        <span className="opacity-20 flex-shrink-0">[{i.toString().padStart(2, '0')}]</span>
                                        <span className="leading-relaxed">{line}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isProcessing && (
                                <div className="flex items-center gap-3 text-primary animate-pulse">
                                    <span className="opacity-20">[..]</span>
                                    <span className="text-[11px] uppercase tracking-widest">Sharding_Neurons...</span>
                                </div>
                            )}
                        </div>

                        {/* Interactive Input Layer */}
                        <form onSubmit={handleCommand} className="mt-8 relative pt-6 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <span className="text-secondary font-black tracking-widest">$</span>
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

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-5xl mx-auto">
                    {COMMAND_HINTS.map((hint, i) => (
                        <button
                            key={i}
                            onClick={() => executeAutomation(hint.cmd, hint.response)}
                            className={cn(
                                "p-6 rounded-3xl bg-white/[0.02] border transition-all duration-500 text-left group relative overflow-hidden",
                                autoCycleIndex === i ? "border-primary/40 bg-primary/5" : "border-white/[0.05] hover:border-primary/30 hover:bg-primary/[0.03]"
                            )}
                        >
                            {autoCycleIndex === i && (
                                <motion.div
                                    layoutId="auto-indicator"
                                    className="absolute bottom-0 left-0 h-1 bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 6, ease: "linear" }}
                                />
                            )}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-mono font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">{hint.cmd}</span>
                            </div>
                            <p className="text-[10px] text-zinc-600 font-sans tracking-wide">{hint.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
