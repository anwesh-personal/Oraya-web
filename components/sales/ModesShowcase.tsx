"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { MessageSquare, Lightbulb, Swords, Ghost, ChevronRight, Lock, Cpu, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const modes = [
    {
        name: "Assistant",
        icon: MessageSquare,
        color: "#00F0FF",
        tagline: "Balanced Intelligence",
        context: "Last 50 messages",
        tokens: "~200K",
        desc: "Everyday coding companion. Fast, precise, context-aware. Perfect for debugging, quick refactors, and general questions.",
        terminal: [
            { type: "system", text: "Mode: ASSISTANT | Context: 50 msgs | Speed: Fast" },
            { type: "user", text: "> Fix the TypeScript error in auth.ts" },
            { type: "ai", text: "Found: Type 'string | undefined' not assignable to 'string'" },
            { type: "ai", text: "Applied: Optional chaining + fallback default" },
            { type: "success", text: "✓ Build successful. 0 errors, 0 warnings." },
        ],
        features: ["Quick responses", "Token efficient", "General purpose", "Low latency"],
    },
    {
        name: "Brainstorm",
        icon: Lightbulb,
        color: "#FF00AA",
        tagline: "Deep Creative Thinking",
        context: "Last 100 messages",
        tokens: "~500K",
        desc: "Expanded context for architecture discussions, system design, and creative problem solving. Sees more, thinks deeper.",
        terminal: [
            { type: "system", text: "Mode: BRAINSTORM | Context: 100 msgs | Depth: High" },
            { type: "user", text: "> Design the caching layer for multi-tenant" },
            { type: "ai", text: "Analyzing: 3 workspaces, 14 services, 8 shared deps..." },
            { type: "ai", text: "Proposal: Redis L1 + SQLite L2 with tenant isolation" },
            { type: "ai", text: "Generating: Architecture diagram + migration plan" },
            { type: "success", text: "✓ Created 3 files, 1 diagram, 1 migration." },
        ],
        features: ["Extended context", "Architecture aware", "Creative solutions", "Multi-file reasoning"],
    },
    {
        name: "War Room",
        icon: Swords,
        color: "#F0B429",
        tagline: "Absolute Context. Zero Amnesia.",
        context: "Full history",
        tokens: "2M+",
        desc: "The nuclear option. Zero context pruning. Oraya loads your ENTIRE conversation history, every file reference, every decision ever made. Nothing is forgotten.",
        terminal: [
            { type: "system", text: "Mode: WAR ROOM | Context: FULL | Tokens: 2M+" },
            { type: "warn", text: "⚠ Loading complete project history..." },
            { type: "ai", text: "Indexed: 2,403 files | 847 conversations | 12 agents" },
            { type: "user", text: "> Why did we switch from REST to GraphQL in March?" },
            { type: "ai", text: "Found conv #431 (Mar 14): Performance bottleneck in /api/users" },
            { type: "ai", text: "Decision: 73% fewer round trips, schema-first typing" },
            { type: "success", text: "✓ Full context restored. I remember everything." },
        ],
        features: ["Zero amnesia", "Full history recall", "Decision archaeology", "Unmatched depth"],
    },
    {
        name: "Ghost Protocol",
        icon: Ghost,
        color: "#10B981",
        tagline: "Zero Trace. Complete Stealth.",
        context: "Ephemeral",
        tokens: "Session only",
        desc: "Nothing is saved. No logs, no history, no traces. Ephemeral execution containers. For when discretion is non-negotiable.",
        terminal: [
            { type: "system", text: "Mode: GHOST | Context: Ephemeral | Logs: DISABLED" },
            { type: "warn", text: "⚠ Ghost Protocol active. No data will persist." },
            { type: "user", text: "> [REDACTED]" },
            { type: "ai", text: "Processing in sandboxed container..." },
            { type: "ai", text: "Operation complete. Purging session artifacts..." },
            { type: "success", text: "✓ Session destroyed. Zero traces remain." },
        ],
        features: ["No logs", "No history", "Ephemeral containers", "Complete deniability"],
    },
];

import { ResponsiveSwitcher } from "./responsive/ResponsiveSwitcher";
import { HorizontalScrollTabs } from "./responsive/HorizontalScrollTabs";

export default function ModesShowcase() {
    const [activeMode, setActiveMode] = useState(0);
    const [visibleLines, setVisibleLines] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.3 });

    useEffect(() => {
        if (!isInView || isHovered) return;

        const cycle = setInterval(() => {
            setActiveMode((prev) => (prev + 1) % modes.length);
        }, 8000);

        return () => clearInterval(cycle);
    }, [isInView, isHovered]);

    useEffect(() => {
        setVisibleLines(0);
        const total = modes[activeMode].terminal.length;
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setVisibleLines(i);
            if (i >= total) clearInterval(interval);
        }, 500);
        return () => clearInterval(interval);
    }, [activeMode]);

    const activeModeData = modes[activeMode];

    const desktopView = (
        <>
            {/* Mode Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
                {modes.map((mode, i) => {
                    const Icon = mode.icon;
                    return (
                        <motion.button
                            key={mode.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={() => setActiveMode(i)}
                            className={cn(
                                "flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 border relative overflow-hidden",
                                activeMode === i
                                    ? "bg-white/10 border-white/20 text-white shadow-lg"
                                    : "bg-white/[0.02] border-white/5 text-gray-500 hover:text-white hover:border-white/10"
                            )}
                            style={activeMode === i ? { boxShadow: `0 0 30px ${mode.color}20` } : {}}
                        >
                            {activeMode === i && (
                                <motion.div
                                    className="absolute bottom-0 left-0 h-0.5 bg-white/40 z-20"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 8, ease: "linear" }}
                                />
                            )}
                            <Icon size={16} style={{ color: activeMode === i ? mode.color : undefined }} />
                            {mode.name}
                        </motion.button>
                    );
                })}
            </div>

            {/* Mode Detail Panel */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeMode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 gap-8"
                >
                    {/* Left: Info */}
                    <div className="space-y-8 p-10 rounded-3xl border border-white/10 bg-[#0A0A0A]">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-3xl font-display font-black text-white">{activeModeData.name}</h3>
                                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full"
                                    style={{ color: activeModeData.color, background: `${activeModeData.color}15`, border: `1px solid ${activeModeData.color}30` }}>
                                    {activeModeData.tagline}
                                </span>
                            </div>
                            <p className="text-lg text-gray-400 leading-relaxed mt-4">{activeModeData.desc}</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Context Window</div>
                                <div className="text-xl font-display font-black mt-1" style={{ color: activeModeData.color }}>{activeModeData.context}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Token Capacity</div>
                                <div className="text-xl font-display font-black mt-1" style={{ color: activeModeData.color }}>{activeModeData.tokens}</div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-3">
                            {activeModeData.features.map((f, i) => (
                                <motion.div key={f} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-2 text-sm">
                                    <ChevronRight size={12} style={{ color: activeModeData.color }} />
                                    <span className="text-gray-300">{f}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Live Terminal */}
                    <div className="rounded-3xl border border-white/10 bg-[#050505] overflow-hidden">
                        <div className="bg-[#111] px-5 py-3 border-b border-white/5 flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-xs font-mono text-gray-600">oraya — {activeModeData.name.toLowerCase()}</span>
                            </div>
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: activeModeData.color, boxShadow: `0 0 8px ${activeModeData.color}` }} />
                        </div>

                        <div className="p-6 font-mono text-sm space-y-2 min-h-[320px]">
                            {activeModeData.terminal.slice(0, visibleLines).map((line, i) => (
                                <motion.div key={`${activeMode}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex items-start gap-2 ${line.type === "system" ? "text-gray-600" : line.type === "user" ? "text-white font-bold" : line.type === "ai" ? "text-gray-300" : line.type === "warn" ? "text-yellow-400" : line.type === "success" ? "text-emerald-400" : "text-gray-400"}`}>
                                    {line.type === "user" && <span style={{ color: activeModeData.color }}>$</span>}
                                    {line.type === "system" && <span className="text-gray-600">#</span>}
                                    {line.type === "ai" && <span style={{ color: activeModeData.color }}>→</span>}
                                    <span>{line.text}</span>
                                </motion.div>
                            ))}
                            {visibleLines < activeModeData.terminal.length && (
                                <div className="flex items-center gap-2">
                                    <span style={{ color: activeModeData.color }}>$</span>
                                    <span className="w-2 h-4 animate-pulse" style={{ background: activeModeData.color }} />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </>
    );

    const mobileView = (
        <div className="space-y-6">
            <HorizontalScrollTabs
                items={modes.map((mode, i) => ({
                    id: i,
                    label: (
                        <div className="flex items-center gap-2.5">
                            <mode.icon size={14} style={{ color: activeMode === i ? mode.color : undefined }} />
                            {mode.name}
                        </div>
                    )
                }))}
                activeId={activeMode}
                onChange={(id) => setActiveMode(id as number)}
                indicatorColor={modes[activeMode].color}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeMode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                >
                    {/* Mobile Info Card */}
                    <div className="p-8 rounded-3xl border border-white/10 bg-[#0A0A0A] space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-display font-black text-white">{activeModeData.name}</h3>
                                <div className="w-2 h-2 rounded-full shadow-[0_0_12px_currentColor]" style={{ color: activeModeData.color, background: activeModeData.color }} />
                            </div>
                            <div className="inline-flex text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-tighter"
                                style={{ color: activeModeData.color, background: `${activeModeData.color}15`, border: `1px solid ${activeModeData.color}30` }}>
                                {activeModeData.tagline}
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed italic uppercase tracking-tight">&quot;{activeModeData.desc}&quot;</p>
                        </div>

                        {/* Mobile Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                                <div className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Context</div>
                                <div className="text-sm font-display font-black text-white tracking-widest">{activeModeData.context}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                                <div className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Tokens</div>
                                <div className="text-sm font-display font-black text-white tracking-widest">{activeModeData.tokens}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {activeModeData.features.slice(0, 4).map((f) => (
                                <div key={f} className="flex items-center gap-3 text-[10px] font-mono uppercase text-gray-500">
                                    <div className="w-1 h-1 rounded-full" style={{ background: activeModeData.color }} />
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Terminal */}
                    <div className="rounded-3xl border border-white/10 bg-[#050505] overflow-hidden min-h-[300px]">
                        <div className="bg-[#111] px-5 py-3 border-b border-white/5 flex items-center justify-between">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                            </div>
                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">SHELL_{activeModeData.name.toUpperCase()}</span>
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: activeModeData.color }} />
                        </div>

                        <div className="p-6 font-mono text-[11px] space-y-3">
                            {activeModeData.terminal.slice(0, visibleLines).map((line, i) => (
                                <motion.div key={`${activeMode}-mob-${i}`} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className={`flex items-start gap-2 ${line.type === "system" ? "text-gray-700" : line.type === "user" ? "text-white" : line.type === "ai" ? "text-gray-400" : line.type === "warn" ? "text-yellow-600" : line.type === "success" ? "text-emerald-600" : "text-gray-500"}`}>
                                    {line.type === "user" && <span style={{ color: activeModeData.color }}>$</span>}
                                    {line.type === "ai" && <span style={{ color: activeModeData.color }}>→</span>}
                                    <span className="leading-relaxed">{line.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );

    return (
        <section ref={containerRef} className="py-16 md:py-24 bg-black relative overflow-hidden border-t border-white/5" id="modes">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 md:mb-12 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0B429]/10 border border-[#F0B429]/20 rounded-full font-mono text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#F0B429]">
                        <Cpu size={12} />
                        Cognitive Modes
                    </div>
                    <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tight leading-none uppercase">
                        Four Modes. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#F0B429] to-[#10B981]">Infinite Control.</span>
                    </h2>
                    <p className="text-lg md:text-xl text-gray-400 font-light max-w-3xl mx-auto leading-relaxed uppercase tracking-tight">
                        Oraya adapts to how you think — not the other way around.
                    </p>
                </motion.div>

                <ResponsiveSwitcher mobile={mobileView} desktop={desktopView} />
            </div>
        </section>
    );
}
