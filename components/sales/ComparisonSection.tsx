
"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

import { useResponsive } from "./responsive/ResponsiveProvider";
import { ResponsiveSwitcher } from "./responsive/ResponsiveSwitcher";

export default function ComparisonSection() {
    const { isMobile } = useResponsive();
    const features = [
        { name: "Local-First Architecture", oraya: true, cursor: false, copilot: false },
        { name: "2M+ Token Context Window", oraya: true, cursor: "partial", copilot: false },
        { name: "Self-Healing Codebase", oraya: true, cursor: false, copilot: false },
        { name: "Dream State Processing", oraya: true, cursor: false, copilot: false },
        { name: "Sovereign Key Vault", oraya: true, cursor: false, copilot: false },
        { name: "Multi-Agent Workflows", oraya: true, cursor: "partial", copilot: false },
        { name: "Universal Model Support", oraya: true, cursor: true, copilot: false },
        { name: "Cross-Platform Support", oraya: true, cursor: true, copilot: true },
        { name: "Real-Time Team Relay", oraya: true, cursor: false, copilot: false },
        { name: "Offline / Air-Gapped", oraya: true, cursor: false, copilot: false },
        { name: "Quantum-Safe Encryption", oraya: true, cursor: false, copilot: false },
        { name: "Ghost Protocol", oraya: true, cursor: false, copilot: false },
    ];

    const sectionHeader = (
        <div className="text-center mb-12 md:mb-20 space-y-6">
            <h2 className="text-4xl md:text-7xl font-display font-black text-white tracking-tight leading-none uppercase">
                Why Not Just <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">Use Something Else?</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 font-light max-w-2xl mx-auto uppercase tracking-tight">
                We get it. There are options. But none of them were built to be an <span className="text-white font-medium">operating system</span>.
            </p>
        </div>
    );

    const desktopView = (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 p-8 bg-white/5 border-b border-white/10 text-center">
                <div className="text-left text-xs font-mono text-gray-500 uppercase tracking-[0.4em]">Feature</div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-display font-black text-[#00F0FF]">Oraya</span>
                    <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">AI OS</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-display font-black text-white/40">Cursor</span>
                    <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Editor</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-display font-black text-white/40">Copilot</span>
                    <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Plugin</span>
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
                        className="grid grid-cols-4 gap-4 p-6 hover:bg-white/[0.02] transition-colors group"
                    >
                        <div className="text-sm text-gray-300 font-medium flex items-center group-hover:text-white transition-colors uppercase tracking-tight">
                            {f.name}
                        </div>
                        <CellValue value={f.oraya} highlight />
                        <CellValue value={f.cursor} />
                        <CellValue value={f.copilot} />
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const mobileView = (
        <div className="space-y-4">
            {features.map((f, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03 }}
                    className="p-6 rounded-[24px] bg-[#0A0A0A] border border-white/5 space-y-5"
                >
                    <div className="text-base font-black text-white uppercase tracking-tight">
                        {f.name}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[9px] font-mono text-[#00F0FF] font-black uppercase tracking-widest">Oraya</span>
                            <CellValue value={f.oraya} highlight isMobile />
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Cursor</span>
                            <CellValue value={f.cursor} isMobile />
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Copilot</span>
                            <CellValue value={f.copilot} isMobile />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    return (
        <section className="py-24 md:py-40 bg-[#050505] relative overflow-hidden" id="comparison">
            <div className="max-w-5xl mx-auto px-6 relative z-10">
                {sectionHeader}
                <ResponsiveSwitcher mobile={mobileView} desktop={desktopView} />
            </div>
        </section>
    );
}

function CellValue({
    value,
    highlight,
    isMobile
}: {
    value: boolean | string;
    highlight?: boolean;
    isMobile?: boolean;
}) {
    const size = isMobile ? 14 : 16;
    const boxSize = isMobile ? "w-6 h-6" : "w-7 h-7";

    if (value === true) {
        return (
            <div className="flex justify-center items-center">
                <div className={cn(
                    boxSize,
                    "rounded-full flex items-center justify-center transition-all duration-500",
                    highlight
                        ? "bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                        : "bg-white/10 text-white"
                )}>
                    <Check size={size} strokeWidth={3} />
                </div>
            </div>
        );
    }
    if (value === "partial") {
        return (
            <div className="flex justify-center items-center">
                <div className={cn(boxSize, "rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center")}>
                    <Minus size={size} strokeWidth={3} />
                </div>
            </div>
        );
    }
    return (
        <div className="flex justify-center items-center">
            <div className={cn(boxSize, "rounded-full bg-white/5 text-gray-700 flex items-center justify-center")}>
                <X size={size - 2} strokeWidth={3} />
            </div>
        </div>
    );
}
