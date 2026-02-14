"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { MessageSquare, Lightbulb, Swords, Ghost, ChevronRight, Lock, Cpu, Zap } from "lucide-react";

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

export default function ModesShowcase() {
    const [activeMode, setActiveMode] = useState(0);
    const [visibleLines, setVisibleLines] = useState(0);

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

    return (
        <section className="py-32 bg-black relative overflow-hidden border-t border-white/5" id="modes">
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20 space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0B429]/10 border border-[#F0B429]/20 rounded-full font-mono text-xs font-bold uppercase tracking-widest text-[#F0B429]">
                        <Cpu size={12} />
                        Cognitive Modes
                    </div>
                    <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-none">
                        Four Modes. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#F0B429] to-[#10B981]">
                            Infinite Control.
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 font-light max-w-3xl mx-auto leading-relaxed">
                        Sometimes you need a quick answer. Sometimes you need your AI to remember <span className="text-white font-normal">every decision you&apos;ve ever made</span>.
                        Oraya adapts to how you think — not the other way around.
                    </p>
                </motion.div>

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
                                onClick={() => setActiveMode(i)}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 border ${activeMode === i
                                    ? "bg-white/10 border-white/20 text-white shadow-lg"
                                    : "bg-white/[0.02] border-white/5 text-gray-500 hover:text-white hover:border-white/10"
                                    }`}
                                style={activeMode === i ? { boxShadow: `0 0 30px ${mode.color}20` } : {}}
                            >
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
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {/* Left: Info */}
                        <div className="space-y-8 p-8 md:p-10 rounded-3xl border border-white/10 bg-[#0A0A0A]">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-3xl font-display font-black text-white">{modes[activeMode].name}</h3>
                                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full"
                                        style={{ color: modes[activeMode].color, background: `${modes[activeMode].color}15`, border: `1px solid ${modes[activeMode].color}30` }}>
                                        {modes[activeMode].tagline}
                                    </span>
                                </div>
                                <p className="text-lg text-gray-400 leading-relaxed mt-4">{modes[activeMode].desc}</p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Context Window</div>
                                    <div className="text-xl font-display font-black mt-1" style={{ color: modes[activeMode].color }}>{modes[activeMode].context}</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Token Capacity</div>
                                    <div className="text-xl font-display font-black mt-1" style={{ color: modes[activeMode].color }}>{modes[activeMode].tokens}</div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-2 gap-3">
                                {modes[activeMode].features.map((f, i) => (
                                    <motion.div
                                        key={f}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <ChevronRight size={12} style={{ color: modes[activeMode].color }} />
                                        <span className="text-gray-300">{f}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Live Terminal */}
                        <div className="rounded-3xl border border-white/10 bg-[#050505] overflow-hidden">
                            {/* Terminal Header */}
                            <div className="bg-[#111] px-5 py-3 border-b border-white/5 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                                </div>
                                <div className="flex-1 text-center">
                                    <span className="text-xs font-mono text-gray-600">oraya — {modes[activeMode].name.toLowerCase()}</span>
                                </div>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: modes[activeMode].color, boxShadow: `0 0 8px ${modes[activeMode].color}` }} />
                            </div>

                            {/* Terminal Body */}
                            <div className="p-6 font-mono text-sm space-y-2 min-h-[320px]">
                                {modes[activeMode].terminal.slice(0, visibleLines).map((line, i) => (
                                    <motion.div
                                        key={`${activeMode}-${i}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex items-start gap-2 ${line.type === "system" ? "text-gray-600" :
                                            line.type === "user" ? "text-white font-bold" :
                                                line.type === "ai" ? "text-gray-300" :
                                                    line.type === "warn" ? "text-yellow-400" :
                                                        line.type === "success" ? "text-emerald-400" : "text-gray-400"
                                            }`}
                                    >
                                        {line.type === "user" && <span style={{ color: modes[activeMode].color }}>$</span>}
                                        {line.type === "system" && <span className="text-gray-600">#</span>}
                                        {line.type === "ai" && <span style={{ color: modes[activeMode].color }}>→</span>}
                                        <span>{line.text}</span>
                                    </motion.div>
                                ))}
                                {visibleLines < modes[activeMode].terminal.length && (
                                    <div className="flex items-center gap-2">
                                        <span style={{ color: modes[activeMode].color }}>$</span>
                                        <span className="w-2 h-4 animate-pulse" style={{ background: modes[activeMode].color }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
