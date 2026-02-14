"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Brain, Shield, Zap, Terminal, Search, Moon, Layers, GitBranch,
    RefreshCw, Globe, Lock, Eye, Cpu, Users, MessageSquare, Lightbulb,
    Fingerprint, Server, Key, Activity, Palette, Sliders, Network,
    FileCode, X, ChevronRight, Sparkles
} from "lucide-react";

const allFeatures = [
    {
        icon: Brain,
        title: "Neural Memory Palace",
        short: "Permanent context that never forgets.",
        color: "#B794F6",
        category: "Intelligence",
        detail: "Unlike ChatGPT or Claude that reset every conversation, Oraya maintains a persistent semantic graph of your entire codebase, conversations, and decisions. Every interaction strengthens the neural map — context compounds over time, not resets.",
        specs: ["Unlimited context window", "Cross-session recall", "Semantic deduplication"],
        example: "You: 'Why did we switch directly to AES?' -> Oraya: 'On Jan 14, you cited compliance reqs in a chat about the auth module.'"
    },
    {
        icon: Terminal,
        title: "God Mode Terminal",
        short: "Execute commands with sovereign authority.",
        color: "#00F0FF",
        category: "Autonomy",
        detail: "Oraya doesn't just suggest terminal commands — she executes them, reads the output, and self-corrects. A 25-turn autonomous loop that can debug, build, deploy, and verify without human intervention.",
        specs: ["25-turn auto-loop", "Error self-correction", "Output parsing"],
        example: "> cargo build --release ... Error: linker failed. \n> Action: Fixing flags. Re-running..."
    },
    {
        icon: Search,
        title: "Semantic Codebase Search",
        short: "Ask questions across your entire stack.",
        color: "#00F0FF",
        category: "Intelligence",
        detail: "Go beyond grep. Ask 'Where does the auth middleware validate JWT tokens?' and Oraya traces the full execution path across files, frameworks, and languages. Understands relationships between your Rust backend and React frontend.",
        specs: ["Cross-language search", "Dependency tracing", "Natural language queries"],
        example: "Query: 'Where is JWT validated?' \nResult: 'In middleware.rs:34, enforced by the actix_web extractor.'"
    },
    {
        icon: Moon,
        title: "Dream State Processing",
        short: "Intelligence that works while you sleep.",
        color: "#B794F6",
        category: "Intelligence",
        detail: "When you close the laptop, Oraya doesn't stop. Via the VPS Relay Protocol, she continues background research, indexes new patterns, and prepares context nudges for your next session. Wake up to a smarter AI.",
        specs: ["Background crawling", "Pattern detection", "Context nudges"],
        example: "03:00 AM: Analyzed 400 logs. \nInsight: 'Memory leak pattern detected in worker threads during high load.'"
    },
    {
        icon: Shield,
        title: "Sovereign Vault",
        short: "Military-grade local encryption.",
        color: "#FFBB00",
        category: "Security",
        detail: "API keys, secrets, and environment variables are encrypted with AES-256-GCM and stored exclusively on your hardware. Oraya's architecture makes it physically impossible for keys to leave your machine.",
        specs: ["AES-256-GCM", "Hardware-backed keys", "Zero cloud exposure"],
        example: "Storage: ~/.oraya/vault.enc \nKey Location: Secure Enclave (Hardware). Cloud Access: COMPLETELY BLOCKED."
    },
    {
        icon: Layers,
        title: "Multi-Workspace Context",
        short: "One brain across every repository.",
        color: "#00F0FF",
        category: "Intelligence",
        detail: "Switch between your frontend, backend, and infrastructure repos without losing context. Oraya maintains a unified neural map across all workspaces, understanding how changes in one affect the others.",
        specs: ["Cross-repo awareness", "Dependency mapping", "Unified context"],
        example: "Warning: 'Changing UserStruct in /backend will break the Interface in /frontend/api.ts at line 89.'"
    },
    {
        icon: Users,
        title: "Agent Swarm",
        short: "Spawn specialized AI agents on demand.",
        color: "#FF00AA",
        category: "Autonomy",
        detail: "Create task-specific agents with custom personalities, capabilities, and access levels. A research agent, a code review agent, a deployment agent — all operating under your sovereign command.",
        specs: ["Custom agent creation", "Role-based access", "Parallel execution"],
        example: "Spawned: Agent-04 (Researcher) to analyze logs. \nSpawned: Agent-05 (Fixer) to draft patch. Running in parallel."
    },
    {
        icon: GitBranch,
        title: "Objective Execution",
        short: "Define goals. Oraya executes them.",
        color: "#00FF99",
        category: "Autonomy",
        detail: "Say 'Refactor the auth system to use JWT'. Oraya decomposes it into sub-tasks, plans the execution order, writes the code, runs the tests, and presents you with a clean diff to review.",
        specs: ["Auto-decomposition", "Sequential execution", "Human-in-the-loop"],
        example: "Goal: Migrate to Tailwind. \nPlan: 1. Scan CSS. 2. Install deps. 3. Rewrite components. Status: Step 3..."
    },
    {
        icon: Lock,
        title: "Zero-Knowledge Architecture",
        short: "We can't see your data. By design.",
        color: "#FFBB00",
        category: "Security",
        detail: "Oraya's local-first architecture means your code, conversations, and secrets never transit through our infrastructure. There is no server-side component that could theoretically access your data.",
        specs: ["Local-first processing", "No telemetry", "Air-gapped option"],
        example: "Traffic Analysis: 0 bytes sent to external servers. \nInference: Localhost:11434 (GPU)."
    },
    {
        icon: RefreshCw,
        title: "Self-Healing Loops",
        short: "Errors caught and fixed autonomously.",
        color: "#00FF99",
        category: "Autonomy",
        detail: "When a command fails or a test breaks, Oraya doesn't just report the error — she analyzes the stack trace, identifies the root cause, applies a fix, and re-runs the verification. Up to 25 attempts before escalating.",
        specs: ["Stack trace analysis", "Auto-patching", "Verification loops"],
        example: "Test Failed: 'User not found'. \nAction: Seeding test DB. \nResult: Test Passed. Retries: 1."
    },
    {
        icon: Fingerprint,
        title: "Biometric Entrenchment",
        short: "Hardware-level identity verification.",
        color: "#FFBB00",
        category: "Security",
        detail: "Optional biometric authentication ties Oraya access to your physical identity. Touch ID, Face ID, or hardware security keys — ensuring no one else can command your AI even with physical access.",
        specs: ["Touch ID / Face ID", "Hardware key support", "Session locking"],
        example: "Access Request: 'Deploy to Prod'. \nAuth Required: Touch ID. \nStatus: Verified."
    },
    {
        icon: MessageSquare,
        title: "Cognitive Modes",
        short: "Four distinct intelligence protocols.",
        color: "#B794F6",
        category: "Intelligence",
        detail: "Switch between Architect (deep planning), Combat (high-speed execution), Ghost (stealth research), and Oracle (creative ideation) modes. Each optimizes Oraya's synaptic weights for the specific task type.",
        specs: ["Architect mode", "Combat mode", "Ghost + Oracle modes"],
        example: "Mode: ARCHITECT. \nReasoning Depth: Max. \nOutput: System Design Doc. Time: 45s."
    },
    {
        icon: Globe,
        title: "Global Relay Network",
        short: "Distributed intelligence without borders.",
        color: "#00F0FF",
        category: "Infrastructure",
        detail: "Your Oraya nodes can relay intelligence across secure VPS endpoints worldwide. Research in Tokyo, execute in Berlin, deploy from Bangalore — all encrypted end-to-end with zero data residency concerns.",
        specs: ["Multi-region relay", "E2E encryption", "Zero residency"],
        example: "Routing: 'Research Task' -> Tokyo Node (Encrypted). \nLatency: 40ms. Residency: Japan."
    },
    {
        icon: Cpu,
        title: "Native Rust Core",
        short: "No Electron. Pure metal performance.",
        color: "#00FF99",
        category: "Infrastructure",
        detail: "Built on Tauri with a Rust backend, Oraya runs at native speed. No Chrome instance eating 2GB of RAM. The entire AI operating system runs in under 200MB with sub-50ms response times.",
        specs: ["Tauri + Rust", "<200MB memory", "<50ms latency"],
        example: "Memory: 140MB. Startup: 0.8s. \nComparison: VSCode uses ~800MB."
    },
    {
        icon: Palette,
        title: "5 Premium Themes",
        short: "Dramatically distinct visual identities.",
        color: "#FF00AA",
        category: "Experience",
        detail: "From the cyber-minimalist Origin theme to the warm serif Atelier — each theme transforms the entire aesthetic with unique fonts, colors, and surface treatments. Dark and light modes for each.",
        specs: ["10 theme variants", "Custom typography", "Dark + Light modes"],
        example: "Active Theme: 'Atelier'. \nFont: 'Merriweather'. Vibe: 'Warm & Focused'."
    },
    {
        icon: Eye,
        title: "Sovereign Obfuscation",
        short: "Zero-trace cognitive mode.",
        color: "#FFBB00",
        category: "Security",
        detail: "Activate Ghost Protocol to purge all session traces from memory after use. No logs, no history, no digital footprint. Perfect for sensitive operations that require absolute discretion.",
        specs: ["Session purging", "No persistent logs", "Trace elimination"],
        example: "Command: 'Enable Ghost Protocol'. \nSession State: PURGED. Disk Writes: 0."
    },
    {
        icon: Network,
        title: "Neural Architecture Bridge",
        short: "AI modeled on biological systems.",
        color: "#B794F6",
        category: "Intelligence",
        detail: "Oraya's architecture maps biological nervous system concepts to digital equivalents. Peripheral sensing, spinal reflexes, cortical processing, and immune defense — creating a truly organic intelligence layer.",
        specs: ["Bio-digital mapping", "Reflex responses", "Immune protocols"],
        example: "Reflex: High load detected. \nAction: 'Spinal' layer auto-scales workers before 'Cortical' notice."
    },
    {
        icon: Server,
        title: "VPS Relay Protocol",
        short: "Your private cloud compute layer.",
        color: "#00F0FF",
        category: "Infrastructure",
        detail: "Deploy a lightweight relay on any VPS to extend Oraya's capabilities. Background research, scheduled tasks, and persistent monitoring — all running on infrastructure you control.",
        specs: ["Any VPS provider", "Background tasks", "Scheduled jobs"],
        example: "Uplink: Connected to AWS EC2. \nStatus: Offloading embedding task. Local CPU: Idle."
    },
    {
        icon: Sliders,
        title: "52-Parameter Agent Config",
        short: "Total control over AI behavior.",
        color: "#FF00AA",
        category: "Experience",
        detail: "Every aspect of an agent's personality, capabilities, and constraints is configurable. From response style and security tier to memory retention and provider selection — 52 parameters, zero black boxes.",
        specs: ["Personality tuning", "Capability scoping", "Security tiers"],
        example: "Config: { 'creativity': 0.8, 'context': 32k, 'tone': 'Pro', 'refusal_rate': 0.01 }"
    },
    {
        icon: Sparkles,
        title: "Provider Agnostic",
        short: "Any LLM. Your choice. Always.",
        color: "#00FF99",
        category: "Infrastructure",
        detail: "Use OpenAI, Anthropic, Google, Mistral, Ollama, or any OpenAI-compatible endpoint. Switch providers mid-conversation without losing context. Oraya maintains consistency across all models.",
        specs: ["6+ providers", "Hot-swap models", "Context preservation"],
        example: "Model: GPT-4o -> Switch -> Claude 3.5. \nContext: Preserved. Downtime: 0ms."
    },
    {
        icon: FileCode,
        title: "Real-Time Code Indexing",
        short: "Every file change, instantly mapped.",
        color: "#00F0FF",
        category: "Intelligence",
        detail: "File watchers detect every save, every git commit, every new dependency. The semantic graph updates in real-time, ensuring Oraya always operates on the current state of your codebase.",
        specs: ["File watchers", "Git integration", "Instant re-indexing"],
        example: "Event: 'Saved user_model.rs'. \nGraph Update: +12 nodes mapped. Time: 12ms."
    },
    {
        icon: Activity,
        title: "Neural Rhythm Tracking",
        short: "AI that adapts to your productivity cycle.",
        color: "#B794F6",
        category: "Experience",
        detail: "Oraya learns when you're most productive, what patterns precede breakthroughs, and when you need a break. She adjusts her response depth, proactivity, and suggestion frequency accordingly.",
        specs: ["Productivity patterns", "Adaptive responses", "Session analytics"],
        example: "Insight: 'You code best 10AM-12PM. \nAction: Scheduling deep work block now.'"
    },
    {
        icon: Key,
        title: "Sovereign Key Management",
        short: "Keys never leave your enclave.",
        color: "#FFBB00",
        category: "Security",
        detail: "A dedicated local key vault with zero-knowledge architecture. Keys are exposed only to the specific agent process requesting access, with full audit logging and automatic rotation policies.",
        specs: ["Process isolation", "Audit logging", "Auto-rotation"],
        example: "Request: Agent 'C' needs AWS_KEY. \nCheck: Authorized? Yes. \nAction: Injecting env var."
    },
    {
        icon: Lightbulb,
        title: "Context Nudges",
        short: "Proactive intelligence delivery.",
        color: "#00FF99",
        category: "Experience",
        detail: "After Dream State processing, Oraya surfaces actionable insights when you return. 'I found 3 optimization patterns in your auth module' or 'Your dependency has a critical CVE' — intelligence delivered before you ask.",
        specs: ["Proactive alerts", "Pattern discovery", "CVE detection"],
        example: "Nudge: 'You are refactoring Auth. \nDon't forget to update the refund webhook in webhooks.ts.'"
    },
];

const categories = ["All", "Intelligence", "Autonomy", "Security", "Infrastructure", "Experience"];

const categoryColors: Record<string, string> = {
    All: "#ffffff",
    Intelligence: "#B794F6",
    Autonomy: "#00F0FF",
    Security: "#FFBB00",
    Infrastructure: "#00FF99",
    Experience: "#FF00AA",
};

export default function FeatureGrid() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return <section className="py-32 bg-black min-h-[800px]" />;

    const filtered = activeCategory === "All"
        ? allFeatures
        : allFeatures.filter(f => f.category === activeCategory);

    return (
        <section className="py-24 bg-[#0A0A0A] relative overflow-hidden transition-colors" id="all-features">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #444 1px, transparent 0)', backgroundSize: '40px 40px' }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest text-[#00F0FF]">
                        <Sparkles size={12} />
                        {allFeatures.length} Capabilities
                    </div>
                    <h2 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter">
                        Everything Under <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#B794F6]">One Roof.</span>
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Click any capability to explore its full architecture and specifications.
                    </p>
                </motion.div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-xl font-mono text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border ${activeCategory === cat
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-transparent border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                                }`}
                        >
                            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: categoryColors[cat] ?? '#fff' }} />
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Feature Grid */}
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((feature, i) => {
                            const globalIndex = allFeatures.indexOf(feature);
                            return (
                                <motion.div
                                    key={feature.title}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, delay: i * 0.03 }}
                                    onClick={() => setExpandedFeature(globalIndex)}
                                    className="group relative cursor-pointer"
                                >
                                    <div className="group relative p-6 rounded-3xl bg-[#080808] border border-white/10 hover:border-[#00F0FF]/30 transition-all duration-500 h-full flex flex-col gap-4 overflow-hidden">
                                        {/* Hover Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {/* Icon & Category */}
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-[#00F0FF]/50 transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                                                <feature.icon size={22} style={{ color: feature.color }} />
                                            </div>
                                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 bg-white/5 rounded-full border border-white/5" style={{ color: feature.color }}>
                                                {feature.category}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-2 relative z-10">
                                            <h4 className="text-white font-display font-bold text-lg leading-tight group-hover:text-[#00F0FF] transition-colors duration-300">
                                                {feature.title}
                                            </h4>
                                            <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                                                {feature.short}
                                            </p>
                                            <p className="text-zinc-500 text-[11px] leading-relaxed line-clamp-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                {feature.detail}
                                            </p>
                                        </div>

                                        {/* Example Terminal Snippet */}
                                        <div className="relative z-10 mt-2 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                            <span className="text-[#00F0FF] mr-2">$</span>
                                            {feature.example}
                                        </div>

                                        {/* Specs Preview */}
                                        <div className="relative z-10 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                                            {feature.specs.slice(0, 2).map((spec, i) => (
                                                <div key={i} className="px-2 py-1 rounded bg-white/[0.02] border border-white/[0.05] text-[9px] font-mono text-zinc-500">
                                                    {spec}
                                                </div>
                                            ))}
                                            {feature.specs.length > 2 && (
                                                <div className="px-2 py-1 rounded text-[9px] font-mono text-zinc-600">
                                                    +{feature.specs.length - 2}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {expandedFeature !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
                        onClick={() => setExpandedFeature(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.97 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-[#0A0A0A] border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {(() => {
                                const f = allFeatures[expandedFeature];
                                return (
                                    <>
                                        {/* Accent bar */}
                                        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }} />

                                        <div className="p-8 md:p-10 space-y-8">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${f.color}15` }}>
                                                        <f.icon size={28} style={{ color: f.color }} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: f.color }}>{f.category}</span>
                                                        <h3 className="text-2xl md:text-3xl font-display font-black text-white leading-tight">{f.title}</h3>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setExpandedFeature(null)}
                                                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex-shrink-0"
                                                >
                                                    <X size={16} className="text-white/40" />
                                                </button>
                                            </div>

                                            {/* Description */}
                                            <p className="text-base text-zinc-400 leading-relaxed">{f.detail}</p>

                                            {/* Specs */}
                                            <div className="space-y-3">
                                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">Specifications</span>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {f.specs.map((spec, i) => (
                                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                                                            <span className="text-sm font-mono text-zinc-300">{spec}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Navigation */}
                                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                <button
                                                    onClick={() => setExpandedFeature(Math.max(0, expandedFeature - 1))}
                                                    disabled={expandedFeature === 0}
                                                    className="px-4 py-2 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white border border-white/5 hover:border-white/15 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                                >
                                                    ← Previous
                                                </button>
                                                <span className="text-[10px] font-mono text-white/20">{expandedFeature + 1} / {allFeatures.length}</span>
                                                <button
                                                    onClick={() => setExpandedFeature(Math.min(allFeatures.length - 1, expandedFeature + 1))}
                                                    disabled={expandedFeature === allFeatures.length - 1}
                                                    className="px-4 py-2 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white border border-white/5 hover:border-white/15 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
