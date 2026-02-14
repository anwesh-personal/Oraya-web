"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-white/5 py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">

                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#FF00AA] flex items-center justify-center">
                                <span className="text-black font-black text-sm font-display">O</span>
                            </div>
                            <span className="font-display font-bold text-lg text-white">Oraya</span>
                        </Link>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            The AI Operating System. <br />Local-first. Self-healing. Yours.
                        </p>
                    </div>

                    {/* Product */}
                    <div className="space-y-4">
                        <h4 className="font-mono text-xs text-gray-500 uppercase tracking-widest font-bold">Product</h4>
                        <div className="flex flex-col gap-3">
                            <Link href="#aios-features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
                            <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
                            <Link href="#comparison" className="text-sm text-gray-400 hover:text-white transition-colors">Compare</Link>
                            <Link href="/changelog" className="text-sm text-gray-400 hover:text-white transition-colors">Changelog</Link>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                        <h4 className="font-mono text-xs text-gray-500 uppercase tracking-widest font-bold">Resources</h4>
                        <div className="flex flex-col gap-3">
                            <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">Documentation</Link>
                            <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</Link>
                            <Link href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</Link>
                            <Link href="/community" className="text-sm text-gray-400 hover:text-white transition-colors">Community</Link>
                        </div>
                    </div>

                    {/* Company */}
                    <div className="space-y-4">
                        <h4 className="font-mono text-xs text-gray-500 uppercase tracking-widest font-bold">Company</h4>
                        <div className="flex flex-col gap-3">
                            <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">About</Link>
                            <Link href="/careers" className="text-sm text-gray-400 hover:text-white transition-colors">Careers</Link>
                            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy</Link>
                            <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms</Link>
                        </div>
                    </div>

                    {/* Social */}
                    <div className="space-y-4">
                        <h4 className="font-mono text-xs text-gray-500 uppercase tracking-widest font-bold">Connect</h4>
                        <div className="flex items-center gap-4">
                            <a href="https://github.com/oraya-dev" className="text-gray-600 hover:text-white transition-colors"><Github size={20} /></a>
                            <a href="https://twitter.com/oraya_dev" className="text-gray-600 hover:text-white transition-colors"><Twitter size={20} /></a>
                            <a href="https://linkedin.com/company/oraya" className="text-gray-600 hover:text-white transition-colors"><Linkedin size={20} /></a>
                            <a href="mailto:hello@oraya.dev" className="text-gray-600 hover:text-white transition-colors"><Mail size={20} /></a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-600 font-mono">
                        &copy; {new Date().getFullYear()} Oraya Technologies. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-700 font-mono">
                        Built with 🧠 in stealth.
                    </p>
                </div>
            </div>
        </footer>
    );
}
