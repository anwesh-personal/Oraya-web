"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Shield, Zap, Globe } from "lucide-react";
import { useEffect } from "react";

interface LightboxProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl?: string; // Placeholder for now
    title: string;
}

export function SalesLightbox({ isOpen, onClose, title }: LightboxProps) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl cursor-crosshair"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-6xl aspect-video bg-[#050505] rounded-[32px] md:rounded-[60px] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col"
                    >
                        {/* Header Area */}
                        <div className="p-6 md:p-10 border-b border-white/5 flex items-center justify-between bg-black/50 backdrop-blur-md">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-mono text-primary font-black uppercase tracking-[0.4em]">Sovereign_Demo_Live</div>
                                    <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight mt-1">{title}</h3>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 transition-all group"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>

                        {/* Video Content Placeholder */}
                        <div className="flex-1 relative flex items-center justify-center bg-black group/video">
                            {/* Cinematic scanning lines */}
                            <div className="absolute inset-0 pointer-events-none z-10 scanline opacity-20" />

                            <div className="relative z-20 flex flex-col items-center gap-8 text-center px-10">
                                <div className="w-24 h-24 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary animate-pulse">
                                    <Play size={40} fill="currentColor" />
                                </div>
                                <div className="space-y-4">
                                    <div className="text-3xl md:text-5xl font-display font-black text-white uppercase leading-tight italic">
                                        Witness the <br />
                                        <span className="text-primary tracking-widest leading-none">Intelligence Shift.</span>
                                    </div>
                                    <p className="text-zinc-500 text-lg md:text-xl font-light max-w-2xl">
                                        This cinematic demonstration illustrates the raw power of the Oraya Kernel under high-intensity neural load.
                                    </p>
                                </div>
                            </div>

                            {/* Telemetry Overlays */}
                            <div className="absolute bottom-10 left-10 p-6 glass-card rounded-2xl border border-primary/20 space-y-3 hidden md:block">
                                <div className="flex items-center gap-3 text-[10px] font-mono text-primary font-black uppercase">
                                    <Globe size={12} /> Sync_Status
                                </div>
                                <div className="text-lg font-black text-white font-mono">100%_SECURE</div>
                            </div>

                            <div className="absolute bottom-10 right-10 p-6 glass-card rounded-2xl border border-primary/20 space-y-3 hidden md:block text-right">
                                <div className="flex items-center justify-end gap-3 text-[10px] font-mono text-primary font-black uppercase">
                                    <Shield size={12} /> Enclave_Shield
                                </div>
                                <div className="text-lg font-black text-white font-mono italic">ACT_L5_ACTIVE</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
