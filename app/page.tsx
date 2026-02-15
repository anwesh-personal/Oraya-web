"use client";

import { useEffect } from "react";
import SalesNavbar from "@/components/sales/Navbar";
import SalesHero from "@/components/sales/Hero";
import FeaturesAIOS from "@/components/sales/FeaturesAIOS";
import ProblemSection from "@/components/sales/Problem";
import GrandOffer from "@/components/sales/GrandOffer";
import NeuralBackground from "@/components/sales/NeuralBackground";
import SpotlightCursor from "@/components/sales/SpotlightCursor";
import SocialProof from "@/components/sales/SocialProof";
import TerminalDemo from "@/components/sales/TerminalDemo";
import StatsCounter from "@/components/sales/StatsCounter";
import FAQSection from "@/components/sales/FAQSection";
import FinalCTA from "@/components/sales/FinalCTA";
import TransformationSection from "@/components/sales/Transformation";
import PricingSection from "@/components/sales/Pricing";
import Footer from "@/components/sales/Footer";
import AgentEcosystem from "@/components/sales/AgentEcosystem";
import MultiWorkspace from "@/components/sales/MultiWorkspace";
import ModesShowcase from "@/components/sales/ModesShowcase";
import SecurityVault from "@/components/sales/SecurityVault";
import ResearchMemory from "@/components/sales/ResearchMemory";
import { CursorGlow } from "@/components/sales/CursorGlow";

import Manifesto from "@/components/sales/Manifesto";
import NeuralArchitecture from "@/components/sales/NeuralArchitecture";
import SovereigntyScorecard from "@/components/sales/SovereigntyScorecard";
import GlobalRelay from "@/components/sales/GlobalRelay";

// ─── Cinematic Section Divider ─────────────────────────────────
function Divider({ accent }: { accent?: "primary" | "secondary" | "white" | "none" }) {
    const glowColor = accent === "primary" ? "var(--primary)" : accent === "secondary" ? "var(--secondary)" : accent === "white" ? "#FFFFFF" : undefined;
    if (accent === "none") return <div className="h-2 md:h-4" />;
    return (
        <div className="relative h-2 md:h-4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-transparent" />
            {glowColor && (
                <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] h-[1px] opacity-20"
                    style={{
                        boxShadow: `0 0 30px 5px ${accent === 'white' ? '#FFFFFF' : accent === 'primary' ? 'var(--primary-glow)' : 'var(--secondary-glow)'}`,
                        backgroundColor: glowColor
                    }}
                />
            )}
        </div>
    );
}

export default function LandingPage() {
    useEffect(() => {
        // Enforce top-start on refresh
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
    }, []);

    return (
        <main className="sales-page-dark min-h-screen bg-surface-0 text-white selection:bg-primary selection:text-black overflow-x-hidden relative font-sans antialiased">
            {/* ─── GLOBAL ATMOSPHERIC LAYER ───────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none z-[40] bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.15)_0%,transparent_80%)]" />

            {/* ─── VERTICAL SPINE (Continuity) ────────────────────────────── */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/40 via-white/10 to-transparent pointer-events-none z-10 hidden md:block opacity-50" />

            {/* Global Infrastructure */}
            <SalesNavbar />
            <NeuralBackground />
            <CursorGlow />

            {/* ACT I — THE PRELUDE */}
            <div className="relative pt-0">
                <SalesHero />
                <SocialProof />
            </div>

            {/* ACT II — THE VOID */}
            <div className="relative bg-surface-0 border-y border-white/[0.03]">
                <ProblemSection />
                <Manifesto />
            </div>

            <Divider accent="primary" />

            {/* ACT III — THE KERNEL */}
            <div className="relative space-y-12 md:space-y-0">
                <TransformationSection />
                <TerminalDemo />
            </div>

            <Divider accent="secondary" />

            {/* ACT IV — THE METRICS */}
            <div className="relative py-8 md:py-16 bg-surface-50">
                <SovereigntyScorecard />
                <StatsCounter />
            </div>

            <Divider accent="primary" />

            {/* ACT V — THE DEPTH */}
            <div className="relative">
                <div className="space-y-4 md:space-y-8">
                    <AgentEcosystem />
                    <NeuralArchitecture />
                    <ModesShowcase />
                    <FeaturesAIOS />
                    <MultiWorkspace />
                    <SecurityVault />
                    <ResearchMemory />
                    <GlobalRelay />
                </div>
            </div>

            <Divider accent="primary" />

            {/* ACT VI — THE VALUE */}
            <div className="relative py-8 md:py-16 bg-surface-0 border-t border-white/[0.03]">
                <GrandOffer />
                <PricingSection />
            </div>

            {/* ACT VII — THE EPILOGUE */}
            <div className="relative bg-surface-50/50">
                <FAQSection />
                <FinalCTA />
                <Footer />
            </div>
        </main>
    );
}
