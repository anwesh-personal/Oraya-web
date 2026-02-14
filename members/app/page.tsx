import Link from "next/link";
import { ArrowRight, Bot, Zap, Shield, Cloud } from "lucide-react";

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--surface-200)] bg-[var(--surface-50)]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'var(--gradient-primary)' }}
                        >
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-[var(--surface-900)]">Oraya</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-[var(--surface-500)] hover:text-[var(--surface-900)] transition-colors">Features</Link>
                        <Link href="#pricing" className="text-[var(--surface-500)] hover:text-[var(--surface-900)] transition-colors">Pricing</Link>
                        <Link href="/docs" className="text-[var(--surface-500)] hover:text-[var(--surface-900)] transition-colors">Docs</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/login"
                            className="text-[var(--surface-600)] hover:text-[var(--surface-900)] transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="px-4 py-2 rounded-xl text-white font-medium transition-all shadow-lg"
                            style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 20px -4px var(--primary-glow)' }}
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-sm mb-8">
                        <Zap className="w-4 h-4" />
                        Powered by Advanced AI
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-[var(--surface-900)] mb-6 leading-tight">
                        Your Personal AI
                        <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
                            Agent Platform
                        </span>
                    </h1>

                    <p className="text-xl text-[var(--surface-500)] max-w-2xl mx-auto mb-10">
                        Build, deploy, and manage intelligent AI agents that work for you 24/7.
                        From customer support to code review, Oraya handles it all.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-all shadow-xl"
                            style={{ background: 'var(--gradient-primary)', boxShadow: '0 8px 32px -8px var(--primary-glow)' }}
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/demo"
                            className="px-8 py-4 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-2xl text-[var(--surface-900)] font-semibold text-lg hover:bg-[var(--surface-200)] transition-all"
                        >
                            Watch Demo
                        </Link>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="max-w-6xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 rounded-3xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center mb-6">
                            <Bot className="w-7 h-7 text-[var(--primary)]" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--surface-900)] mb-3">Custom Agents</h3>
                        <p className="text-[var(--surface-500)]">
                            Create unlimited AI agents tailored to your specific needs. Each agent learns and improves over time.
                        </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-info/10 border border-info/20">
                        <div className="w-14 h-14 rounded-2xl bg-info/20 flex items-center justify-center mb-6">
                            <Cloud className="w-7 h-7 text-info" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--surface-900)] mb-3">Cloud Sync</h3>
                        <p className="text-[var(--surface-500)]">
                            Your agents, settings, and memories sync across all devices. Access your AI assistants anywhere.
                        </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-success/10 border border-success/20">
                        <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center mb-6">
                            <Shield className="w-7 h-7 text-success" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--surface-900)] mb-3">Enterprise Security</h3>
                        <p className="text-[var(--surface-500)]">
                            SSO, role-based access, and data encryption. Your data stays private and secure.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--surface-200)] py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--gradient-primary)' }}
                        >
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[var(--surface-900)] font-semibold">Oraya</span>
                    </div>
                    <p className="text-[var(--surface-400)] text-sm">
                        © 2026 Oraya. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
