"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shield, Command, Activity, Lock } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function LegalLayout({ title, children }: { title: string, children: React.ReactNode }) {
    const { mode } = useThemeStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <main className="min-h-screen bg-[var(--surface-0)]" />;

    return (
        <main className="min-h-screen bg-[var(--surface-0)] text-[var(--surface-900)] selection:bg-[var(--primary)] selection:text-white transition-colors duration-1000 py-32 md:py-48 px-6">
            {/* Atmospheric Backgrounds */}
            <div className={cn(
                "fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000",
                mode === 'dark' ? "bg-[radial-gradient(circle_at_top_right,var(--primary-glow),transparent_60%)] opacity-[0.05]" : "bg-[radial-gradient(circle_at_top_right,var(--primary-glow),transparent_60%)] opacity-[0.02]"
            )} />

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Tactical Navigation */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-24 flex items-center justify-between"
                >
                    <Link href="/" className="group flex items-center gap-4 text-xs font-mono font-black text-[var(--surface-400)] hover:text-[var(--primary)] transition-all uppercase tracking-[0.4em]">
                        <div className="p-2 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] group-hover:border-[var(--primary)] group-hover:bg-[var(--surface-0)] transition-all">
                            <ArrowLeft size={16} />
                        </div>
                        Back to Command Center
                    </Link>

                    <div className="hidden md:flex items-center gap-6 text-[9px] font-mono font-black text-[var(--surface-400)] uppercase tracking-[0.4em]">
                        <span className="flex items-center gap-2"><Lock size={12} className="text-[var(--success)]" /> End-to-End Encryption</span>
                        <span className="flex items-center gap-2"><Activity size={12} className="text-[var(--primary)]" /> System_Live</span>
                    </div>
                </motion.div>

                {/* Hero Headers */}
                <div className="space-y-12 mb-24 border-b-4 border-[var(--surface-900)] pb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-4 px-6 py-2 bg-[var(--surface-100)] border-2 border-[var(--surface-200)] rounded-full font-mono text-[10px] font-black uppercase tracking-[0.5em] text-[var(--surface-600)]"
                    >
                        <Shield size={14} className="text-[var(--primary)]" />
                        Sovereign_Protocol_v4.0
                    </motion.div>

                    <div className="space-y-6">
                        <motion.h1
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-7xl md:text-[8rem] font-display font-black text-[var(--surface-900)] tracking-tighter leading-[0.8]"
                        >
                            {title}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            className="text-xs font-mono font-black text-[var(--surface-900)] tracking-[0.6em] uppercase"
                        >
                            Revision_Index: February 2026 // Auth_Sovereign
                        </motion.p>
                    </div>
                </div>

                {/* Content Area */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="prose prose-2xl prose-invert prose-gray max-w-none text-[var(--surface-700)] selection:bg-[var(--primary)] selection:text-white"
                >
                    <div className="space-y-16 font-light leading-snug tracking-tight">
                        {children}
                    </div>
                </motion.div>

                {/* Legal Footer HUD */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-48 pt-24 border-t-2 border-[var(--surface-100)] flex flex-col md:flex-row items-center justify-between gap-12"
                >
                    <div className="flex flex-col gap-4 text-center md:text-left">
                        <div className="text-sm font-mono font-black text-[var(--surface-900)] uppercase tracking-[0.2em]">&copy; 2026 Oraya Technologies.</div>
                        <div className="text-[10px] font-mono font-black text-[var(--surface-400)] uppercase tracking-[0.4em]">Sovereignty is a shared responsibility.</div>
                    </div>

                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-12 h-1 bg-[var(--surface-100)] rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                                    className="h-full w-full bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent"
                                />
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
