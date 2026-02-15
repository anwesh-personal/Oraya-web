"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X, Command, Activity, Fingerprint, Network } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function SalesNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handler = () => setScrolled(window.scrollY > 30);
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    const navLinks = [
        { label: "01_ORCHESTRATION", href: "#aios-features" },
        { label: "02_NEURAL_RECALL", href: "#intelligence" },
        { label: "03_FORTRESS", href: "#security" },
        { label: "04_DOMINION", href: "#grand-offer" },
        { label: "05_PRICING", href: "#pricing" },
    ];

    if (!mounted) return null;

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className={cn(
                    "fixed top-0 left-0 right-0 z-[100] transition-all duration-700",
                    scrolled
                        ? "bg-black/60 backdrop-blur-3xl border-b border-white/5 py-4"
                        : "bg-transparent py-8"
                )}
            >
                <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center group relative">
                        <div className="relative">
                            <img
                                src="/logos/oraya-light.png"
                                alt="Oraya"
                                className="h-10 md:h-12 w-auto object-contain transition-all duration-700 group-hover:scale-105 brightness-0 invert"
                            />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-black animate-pulse shadow-[0_0_15px_var(--primary-glow)]" />
                        </div>
                        <div className="hidden lg:flex flex-col border-l border-white/10 pl-6 space-y-0.5">
                            <span className="text-[9px] font-mono text-white font-black uppercase tracking-[0.4em]">SOVEREIGN_CORE</span>
                            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">v4.02.5_NOMINAL</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden xl:flex items-center gap-2">
                        {navLinks.map(link => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="px-6 py-2 text-[10px] font-mono font-black text-zinc-500 hover:text-primary transition-all hover:bg-white/[0.03] rounded-full tracking-[0.3em] uppercase"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <div className="flex items-center gap-8">
                        <Link href="/login" className="hidden sm:block text-[10px] font-mono font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">
                            Initialize_Login
                        </Link>

                        <Link
                            href="/download"
                            className="group relative px-8 py-3 bg-white text-black font-mono font-black text-[10px] uppercase tracking-[0.3em] rounded-xl hover:bg-primary transition-all flex items-center gap-4 overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
                        >
                            <span className="relative z-10">Deploy_Kernel</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="xl:hidden text-white/40 hover:text-white transition-colors"
                        >
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Cinematic Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] bg-black/98 backdrop-blur-3xl flex flex-col justify-center px-10 xl:hidden"
                    >
                        <div className="space-y-12">
                            <div className="text-[10px] font-mono text-primary uppercase tracking-[0.6em] mb-12 flex items-center gap-3">
                                <Network size={14} className="animate-pulse" />
                                SYSTEM_NODE_ACTIVE
                            </div>

                            <div className="flex flex-col gap-6">
                                {navLinks.map((link, i) => (
                                    <motion.a
                                        key={link.label}
                                        href={link.href}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => setMobileOpen(false)}
                                        className="text-4xl font-display font-black text-white hover:text-primary transition-all uppercase tracking-tight"
                                    >
                                        {link.label.split('_')[1]}
                                    </motion.a>
                                ))}
                            </div>

                            <div className="pt-12 border-t border-white/5 flex flex-col gap-8">
                                <Link
                                    href="/download"
                                    className="w-full py-6 bg-white text-black font-mono font-black text-xs uppercase tracking-[0.4em] text-center rounded-2xl"
                                >
                                    Initialize_Deploy
                                </Link>
                                <div className="flex justify-between text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
                                    <span>ORAYA_OS // PUBLIC_BETA</span>
                                    <span>ENCRYPTED_SESSION</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
