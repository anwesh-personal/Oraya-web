
"use client";

import Link from "next/link";
import { ArrowLeft, Check, Zap, Rocket, Star, ShieldCheck, Lock, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function SpecialOfferPage() {
    return (
        <main className="min-h-screen bg-black text-white overflow-hidden py-12 px-6">

            {/* Top Bar for Trust */}
            <header className="max-w-4xl mx-auto flex items-center justify-between mb-16 opacity-70">
                <Link href="/" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <ArrowLeft size={16} />
                    <span className="text-sm font-medium">Back to Oraya.dev</span>
                </Link>
                <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-[#00F0FF]">
                    <span>Special Offer Unlocked</span>
                    <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
                </div>
            </header>

            <div className="max-w-3xl mx-auto space-y-24">

                {/* 4P - PICTURE (Attention) */}
                <section className="text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block px-4 py-1.5 rounded-full border border-red-500/30 bg-red-900/10 text-red-400 font-mono text-xs font-bold uppercase tracking-wider mb-4"
                    >
                        ⚠️ Limited Cohort Access
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-none">
                        Stop Letting Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#FF00AA]">Second Brain Rot.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 font-light leading-relaxed max-w-2xl mx-auto">
                        Imagine an AI that doesn't just chat, but
                        <span className="text-white font-bold"> remembers every line of code you've written in the last year.</span>
                        <br />That reality is one click away.
                    </p>
                </section>

                {/* 4P - PROMISE (Interest) */}
                <section className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F0FF]/10 blur-[80px] rounded-full pointer-events-none" />

                    <h2 className="text-3xl font-display font-bold mb-6">Our 30-Day "Superhuman" Promise</h2>
                    <ul className="space-y-6">
                        <PromiseItem
                            text="Cut context-switching time by 50% or we refund you double."
                            icon={Clock}
                        />
                        <PromiseItem
                            text="Integrate your entire Github + Notion knowledge base in < 5 mins."
                            icon={Rocket}
                        />
                        <PromiseItem
                            text="Zero data leakage. If a key leaves your device, we shut down the company."
                            icon={ShieldCheck}
                        />
                    </ul>
                </section>

                {/* 4P - PROVE (Desire) */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-[#111] border border-white/10 rounded-2xl">
                        <div className="flex text-yellow-500 mb-4">
                            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                        </div>
                        <p className="text-lg font-medium italic mb-4">"I deleted ChatGPT Plus yesterday. Oraya's War Room mode is the only thing that can handle my 40-file refactors without hallucinating."</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full" />
                            <div>
                                <div className="font-bold text-sm">Sarah Jenkins</div>
                                <div className="text-xs text-gray-400">Ex-Stripe Engineer</div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-[#111] border border-white/10 rounded-2xl flex flex-col justify-center items-center text-center">
                        <div className="text-5xl font-bold text-[#00F0FF] mb-2">2.4 hrs</div>
                        <div className="text-sm text-gray-400 uppercase tracking-widest">Saved Per Day</div>
                        <div className="text-xs text-gray-600 mt-2">(Avg across 500 beta users)</div>
                    </div>
                </section>

                {/* 4P - PUSH (Action) */}
                <section className="text-center space-y-8 pb-24">
                    <div className="p-1 bg-gradient-to-r from-[#00F0FF] via-white to-[#FF00AA] rounded-2xl">
                        <div className="bg-black rounded-[14px] p-8 md:p-12">
                            <h2 className="text-4xl font-display font-bold mb-4">Get "War Room" Access Now</h2>
                            <div className="text-3xl font-mono text-gray-400 mb-8 line-through opacity-50">$49/mo</div>
                            <div className="text-6xl font-display font-bold text-white mb-2">$19<span className="text-2xl text-gray-400 font-normal">/mo</span></div>
                            <div className="text-[#00F0FF] font-medium mb-8">Early Founders Cohort (Only 42 spots left)</div>

                            <a href="/subscribe" className="block w-full py-5 bg-white text-black font-black text-xl rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)]">
                                CLAIM OFFER &rarr;
                            </a>
                            <p className="text-xs text-gray-500 mt-4">30-day money-back guarantee. No questions asked.</p>
                        </div>
                    </div>
                </section>

            </div>
        </main>
    );
}

function PromiseItem({ text, icon: Icon }: { text: string, icon: any }) {
    return (
        <li className="flex items-start gap-4">
            <div className="mt-1 p-2 bg-[#00F0FF]/10 rounded-lg text-[#00F0FF]">
                <Icon size={20} />
            </div>
            <span className="text-lg text-gray-300 font-medium leading-snug" dangerouslySetInnerHTML={{ __html: text }} />
        </li>
    );
}
