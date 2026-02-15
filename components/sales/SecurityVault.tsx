"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Shield, Lock, Eye, Key, Fingerprint, FileKey, Server, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const securityLayers = [
    {
        name: "Hardware Keychain",
        icon: Fingerprint,
        color: "#F0B429",
        desc: "API keys stored in macOS Keychain / Windows Credential Manager. Hardware-backed, not file-based.",
        status: "ACTIVE",
    },
    {
        name: "AES-256-GCM Encryption",
        icon: Key,
        color: "#10B981",
        desc: "Every secret encrypted with item-specific keys before touching any storage. Swiss bank level.",
        status: "ACTIVE",
    },
    {
        name: "Local SQLite Database",
        icon: Server,
        color: "#00F0FF",
        desc: "All chats, files, and context stored locally. Nothing goes to the cloud. Period.",
        status: "ACTIVE",
    },
    {
        name: "Ghost Protocol",
        icon: Eye,
        color: "#8B5CF6",
        desc: "Zero-trace mode. No logs, no history. Ephemeral containers for maximum deniability.",
        status: "STANDBY",
    },
    {
        name: "Immutable Audit Trail",
        icon: FileKey,
        color: "#FF00AA",
        desc: "Every tool call logged with timestamp, duration, success state. Verifiable and tamper-proof.",
        status: "ACTIVE",
    },
    {
        name: "Protocol Tiers (L1-L5)",
        icon: Shield,
        color: "#F0B429",
        desc: "5 security clearance levels. From Observer (view only) to God Mode (full system access).",
        status: "CONFIGURED",
    },
];

export default function SecurityVault() {
    const [activeLayer, setActiveLayer] = useState<number | null>(null);
    const ringRotation = useMotionValue(0);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.2 });

    useEffect(() => {
        if (!isInView) return;
        const controls = animate(ringRotation, 360, {
            duration: 60,
            repeat: Infinity,
            ease: "linear",
        });
        return controls.stop;
    }, [ringRotation, isInView]);

    const ring1 = useTransform(ringRotation, (v) => `rotate(${v}deg)`);
    const ring2 = useTransform(ringRotation, (v) => `rotate(${-v * 1.8}deg)`);

    return (
        <section ref={containerRef} className="py-12 md:py-16 bg-black relative overflow-hidden noise-overlay border-t border-white/5" id="security">
            <div className="scanline" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* LEFT: THE ELEGANT VAULT (The "Proper Circles" version) */}
                    <div className="relative flex items-center justify-center py-20">
                        <div className="relative w-[400px] h-[400px] md:w-[500px] md:h-[500px]">

                            {/* Outer Orbiting Ring */}
                            <motion.div
                                style={{ transform: ring1 }}
                                className="absolute inset-0 rounded-full border border-white/10"
                            >
                                {/* Gold Node Dots */}
                                {[0, 60, 120, 180, 240, 300].map((deg) => (
                                    <div key={deg} className="absolute w-2.5 h-2.5 rounded-full bg-[#F0B429]/40 border border-[#F0B429]/80 shadow-[0_0_10px_#F0B429]"
                                        style={{
                                            top: `${50 - 50 * Math.cos(deg * Math.PI / 180)}%`,
                                            left: `${50 + 50 * Math.sin(deg * Math.PI / 180)}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }} />
                                ))}
                            </motion.div>

                            {/* Middle Orbiting Ring */}
                            <motion.div
                                style={{ transform: ring2 }}
                                className="absolute inset-[18%] rounded-full border border-white/[0.08]"
                            >
                                {/* Green Node Dots */}
                                {[45, 135, 225, 315].map((deg) => (
                                    <div key={deg} className="absolute w-2 h-2 rounded-full bg-[#10B981]/60 border border-[#10B981]"
                                        style={{
                                            top: `${50 - 50 * Math.cos(deg * Math.PI / 180)}%`,
                                            left: `${50 + 50 * Math.sin(deg * Math.PI / 180)}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }} />
                                ))}
                            </motion.div>

                            {/* Inner Fixed Ring */}
                            <div className="absolute inset-[32%] rounded-full border border-white/5" />

                            {/* THE CORE CORE */}
                            <div className="absolute inset-[36%] rounded-full border border-white/[0.15] bg-[#0A0A0A] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex items-center justify-center p-8 overflow-hidden">
                                {/* Digital Hologram Background */}
                                <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-150 rotate-45" />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#F0B429]/20 via-transparent to-[#00F0FF]/10" />
                                </div>

                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="relative z-10"
                                >
                                    <Lock size={48} className="text-[#F0B429] drop-shadow-[0_0_20px_#F0B429]" />
                                </motion.div>

                                {/* Rotating Inner Glint */}
                                {isInView && (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.02] to-transparent pointer-events-none"
                                    />
                                )}
                            </div>

                            {/* ELITE FLOATING LABELS */}
                            {/* Top Label */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    className="px-4 py-1.5 rounded-full bg-[#0A0A0A] border border-[#F0B429]/30 flex items-center gap-2.5 whitespace-nowrap"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#F0B429] shadow-[0_0_8px_#F0B429] animate-pulse" />
                                    <span className="text-[10px] font-mono text-[#F0B429] font-black uppercase tracking-[0.3em]">VAULT_ACTIVE</span>
                                </motion.div>
                                <div className="w-[1px] h-6 bg-gradient-to-b from-[#F0B429]/40 to-transparent" />
                            </div>

                            {/* Bottom Label */}
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                                <div className="w-[1px] h-6 bg-gradient-to-t from-[#10B981]/40 to-transparent" />
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    className="px-4 py-1.5 rounded-full bg-[#0A0A0A] border border-[#10B981]/30 flex items-center gap-2.5 whitespace-nowrap"
                                >
                                    <Shield size={10} className="text-[#10B981]" />
                                    <span className="text-[10px] font-mono text-[#10B981] font-black uppercase tracking-[0.3em]">6_LAYERS_ACTIVE</span>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: SECURITY PROTOCOL LIST (High Fidelity & Elegant) */}
                    <div className="space-y-4">
                        <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.8em] mb-12 flex items-center gap-4">
                            <div className="h-[1px] w-8 bg-zinc-800" />
                            SECURE_KERNEL_ARCHITECTURE
                        </div>

                        {securityLayers.map((layer, i) => {
                            const Icon = layer.icon;
                            return (
                                <motion.div
                                    key={layer.name}
                                    onMouseEnter={() => setActiveLayer(i)}
                                    onMouseLeave={() => setActiveLayer(null)}
                                    className={cn(
                                        "p-6 md:p-8 rounded-[24px] border transition-all duration-500 group relative cursor-default overflow-hidden",
                                        activeLayer === i
                                            ? "bg-white/[0.04] border-white/10 shadow-xl scale-[1.01]"
                                            : "bg-transparent border-white/[0.03] hover:border-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-black border border-white/[0.05] group-hover:border-[currentColor] transition-colors duration-500"
                                            style={{ color: layer.color }}>
                                            <Icon size={26} strokeWidth={1} />
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-4">
                                                <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none">{layer.name}</h4>
                                                <div className="px-2.5 py-0.5 rounded-full border text-[8px] font-mono font-black"
                                                    style={{ borderColor: `${layer.color}40`, color: layer.color, background: `${layer.color}05` }}>
                                                    {layer.status}
                                                </div>
                                            </div>
                                            <p className="text-zinc-600 text-sm font-light group-hover:text-zinc-400 transition-colors tracking-tight leading-snug">{layer.desc}</p>
                                        </div>
                                    </div>

                                    {/* Sub-Telemetry (Obsidian style) */}
                                    {activeLayer === i && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]"
                                        >
                                            <div className="flex gap-4">
                                                <span className="text-zinc-700">KERNELID:</span> 0x889A_01
                                                <span className="text-zinc-800">|</span>
                                                <span className="text-zinc-700">MODE:</span> READONLY
                                            </div>
                                            <div className="text-[#10B981] font-black animate-pulse">VERIFIED</div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}

                        {/* FINAL DISCLAIMER CARD */}
                        <div className="mt-16 p-10 rounded-[40px] bg-[#F0B429]/[0.02] border border-[#F0B429]/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]">
                                <AlertTriangle size={140} className="text-[#F0B429]" />
                            </div>
                            <div className="relative z-10 flex gap-8 items-start">
                                <div className="w-16 h-16 rounded-3xl bg-black border border-[#F0B429]/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={28} className="text-[#F0B429] drop-shadow-[0_0_15px_#F0B429]" />
                                </div>
                                <div className="space-y-4">
                                    <h5 className="text-[#F0B429] font-mono text-xs font-black uppercase tracking-[0.3em]">PROPRIETARY_ENGINEERING_NOTE</h5>
                                    <p className="text-zinc-500 text-sm leading-relaxed uppercase tracking-tight font-light">
                                        <span className="text-white font-bold">No other local AI app can claim this.</span> Most are Electron shells proxying to cloud APIs. Oraya is a native Rust binary with byte-level encryption. Your machine is a sovereign territory.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
