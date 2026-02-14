
"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

export default function ComparisonSection() {
    const features = [
        { name: "Local-First Architecture", oraya: true, cursor: false, copilot: false },
        { name: "2M+ Token Context Window", oraya: true, cursor: "partial", copilot: false },
        { name: "Self-Healing Codebase", oraya: true, cursor: false, copilot: false },
        { name: "Dream State Processing", oraya: true, cursor: false, copilot: false },
        { name: "Sovereign Key Vault", oraya: true, cursor: false, copilot: false },
        { name: "Multi-Agent Workflows", oraya: true, cursor: "partial", copilot: false },
        { name: "Universal Model Support", oraya: true, cursor: true, copilot: false },
        { name: "Cross-Platform (Mac/Win/Linux)", oraya: true, cursor: true, copilot: true },
        { name: "Real-Time Team Collaboration", oraya: true, cursor: false, copilot: false },
        { name: "Offline / Air-Gapped Mode", oraya: true, cursor: false, copilot: false },
        { name: "Quantum-Safe Encryption", oraya: true, cursor: false, copilot: false },
        { name: "Ghost Protocol (Zero Trace)", oraya: true, cursor: false, copilot: false },
    ];

    return (
        <section className="py-40 bg-[#050505] relative overflow-hidden" id="comparison">
            <div className="max-w-5xl mx-auto px-6 relative z-10">

                <div className="text-center mb-20 space-y-6">
                    <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-none">
                        Why Not Just <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">Use Something Else?</span>
                    </h2>
                    <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
                        We get it. There are options. But none of them were built to be an <span className="text-white font-medium">operating system</span>.
                    </p>
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="grid grid-cols-4 gap-4 p-6 bg-white/5 border-b border-white/10 text-center">
                        <div className="text-left text-sm font-mono text-gray-500 uppercase tracking-wider">Feature</div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-display font-bold text-[#00F0FF]">Oraya</span>
                            <span className="text-[10px] text-gray-500 font-mono">AI OS</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-display font-bold text-gray-400">Cursor</span>
                            <span className="text-[10px] text-gray-500 font-mono">Code Editor</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-display font-bold text-gray-400">Copilot</span>
                            <span className="text-[10px] text-gray-500 font-mono">Autocomplete</span>
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-white/5">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.03, duration: 0.3 }}
                                className="grid grid-cols-4 gap-4 p-5 hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="text-sm text-gray-300 font-medium flex items-center group-hover:text-white transition-colors">
                                    {f.name}
                                </div>
                                <CellValue value={f.oraya} highlight />
                                <CellValue value={f.cursor} />
                                <CellValue value={f.copilot} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function CellValue({ value, highlight }: { value: boolean | string, highlight?: boolean }) {
    if (value === true) {
        return (
            <div className="flex justify-center items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${highlight ? 'bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-white/10 text-white'}`}>
                    <Check size={16} strokeWidth={3} />
                </div>
            </div>
        );
    }
    if (value === "partial") {
        return (
            <div className="flex justify-center items-center">
                <div className="w-7 h-7 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                    <Minus size={16} strokeWidth={3} />
                </div>
            </div>
        );
    }
    return (
        <div className="flex justify-center items-center">
            <div className="w-7 h-7 rounded-full bg-white/5 text-gray-600 flex items-center justify-center">
                <X size={14} strokeWidth={3} />
            </div>
        </div>
    );
}
