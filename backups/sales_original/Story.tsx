
"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Zap, Brain, Rocket, ShieldCheck, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function StorySection() {
    const [scrolledIntoView, setScrolledIntoView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setScrolledIntoView(true);
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    // Feature Card
    const FeatureCard = ({ icon: Icon, title, desc, delay, className, image }: { icon: any, title: string, desc: string, delay: string, className?: string, image?: string }) => (
        <div
            className={cn(
                "group relative p-8 md:p-10 rounded-3xl bg-[#0A0A0A] border border-white/5 overflow-hidden hover:border-[#00F0FF]/30 hover:shadow-2xl hover:shadow-[#00F0FF]/5 transition-all duration-500",
                scrolledIntoView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20",
                className
            )}
            style={{ transitionDelay: delay }}
        >
            {/* Optional Background Image */}
            {image && (
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 mix-blend-screen pointer-events-none">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
                </div>
            )}

            <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:border-[#00F0FF]/50 transition-all duration-300">
                    <Icon className="w-7 h-7 text-gray-400 group-hover:text-[#00F0FF] transition-colors" />
                </div>

                <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-[#00F0FF] transition-colors">{title}</h3>
                    <p className="text-gray-400 leading-relaxed text-base font-light">
                        {desc}
                    </p>
                </div>

                <div className="pt-4 flex items-center gap-2 text-[#00F0FF] font-mono text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span>Deep Dive</span>
                    <Zap size={14} />
                </div>
            </div>
        </div>
    );

    return (
        <section ref={ref} id="features" className="relative py-32 bg-black overflow-hidden text-white">
            {/* Radial Glow */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-[#00F0FF]/5 blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-24">

                {/* Intro Text */}
                <div className="text-center space-y-8 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                        <Rocket size={12} />
                        The Solution
                    </div>

                    <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-white leading-[0.9]">
                        Your Second Brain. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#FF00AA]">Actually Useful.</span>
                    </h2>

                    <p className="text-xl md:text-2xl text-gray-400 font-light leading-relaxed">
                        No more hallucinations. No more lost context. <br />
                        Just pure, indexed intelligence across your entire stack.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* 1. Context Awareness */}
                    <FeatureCard
                        icon={Brain}
                        title="Infinite Context"
                        desc="Switch between 'Brainstorm' mode for creativity and 'War Room' for deep, 2M+ token history recall."
                        delay="0.1s"
                        className="lg:col-span-2 min-h-[400px]"
                        image="/assets/Assets/brain/2.png"
                    />

                    {/* 2. Privacy */}
                    <FeatureCard
                        icon={ShieldCheck}
                        title="Sovereign Privacy"
                        desc="Your keys, your data. Local-first architecture ensures sensitive code never leaks into training data."
                        delay="0.3s"
                    />

                    {/* 3. Unified Knowledge */}
                    <FeatureCard
                        icon={Layers}
                        title="Universal Indexing"
                        desc="Connect GitHub, Notion, Slack, and Google Drive. Search and chat with your entire digital footprint instantly."
                        delay="0.5s"
                    />

                    {/* 4. Team Sync */}
                    <FeatureCard
                        icon={Zap}
                        title="Real-Time Sync"
                        desc="Collaborate with your team in shared workspaces. Seamlessly hand off context without losing momentum."
                        delay="0.7s"
                        className="lg:col-span-2 min-h-[400px]"
                        image="/assets/Assets/brain/3.png"
                    />
                </div>
            </div>
        </section>
    );
}
