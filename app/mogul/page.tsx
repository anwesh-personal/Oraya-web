"use client";

import { useEffect } from "react";
import SalesNavbar from "@/components/sales/Navbar";
import MogulHero from "@/components/sales/mogul/MogulHero";
import MogulStory from "@/components/sales/mogul/MogulStory";
import MogulProblem from "@/components/sales/mogul/MogulProblem";
import MogulTerminal from "@/components/sales/mogul/MogulTerminal";
import MogulTransformation from "@/components/sales/mogul/MogulTransformation";
import MogulDemoVideos from "@/components/sales/mogul/MogulDemoVideos";
import MogulComparison from "@/components/sales/mogul/MogulComparison";
import MogulStats from "@/components/sales/mogul/MogulStats";
import MogulBonuses from "@/components/sales/mogul/MogulBonuses";
import MogulPricingComparison from "@/components/sales/mogul/MogulPricingComparison";
import MogulFinalCTA from "@/components/sales/mogul/MogulFinalCTA";

import AgentEcosystem from "@/components/sales/AgentEcosystem";
import AgentOrchestration from "@/components/sales/AgentOrchestration";
import GrandOffer from "@/components/sales/GrandOffer";
import NeuralBackground from "@/components/sales/NeuralBackground";
import SocialProof from "@/components/sales/SocialProof";
import FAQSection from "@/components/sales/FAQSection";
import PricingSection from "@/components/sales/Pricing";
import Footer from "@/components/sales/Footer";
import { CursorGlow } from "@/components/sales/CursorGlow";
import Manifesto from "@/components/sales/Manifesto";
import SovereigntyScorecard from "@/components/sales/SovereigntyScorecard";
import IntelligenceMantle from "@/components/sales/IntelligenceMantle";
import NeuralArchitecture from "@/components/sales/NeuralArchitecture";
import PerimeterMap from "@/components/sales/PerimeterMap";
import EntropyAudit from "@/components/sales/EntropyAudit";
import RawDirectives from "@/components/sales/RawDirectives";
import SwarmLogs from "@/components/sales/SwarmLogs";
import SecurityVault from "@/components/sales/SecurityVault";
import MultiWorkspace from "@/components/sales/MultiWorkspace";
import ModesShowcase from "@/components/sales/ModesShowcase";
import SelfHealingUI from "@/components/sales/SelfHealingUI";
import ResearchMemory from "@/components/sales/ResearchMemory";
import GlobalRelay from "@/components/sales/GlobalRelay";
import FeaturesAIOS from "@/components/sales/FeaturesAIOS";

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

export default function MogulLandingPage() {
    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
    }, []);

    return (
        <main className="sales-page-dark min-h-screen bg-surface-0 text-white selection:bg-primary selection:text-black overflow-x-hidden relative font-sans antialiased">
            {/* ─── GLOBAL ATMOSPHERIC LAYER ───────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none z-[40] bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.15)_0%,transparent_80%)]" />

            {/* Global Infrastructure */}
            <SalesNavbar />
            <NeuralBackground />
            <CursorGlow />

            {/* ACT I — THE PICTURE (Aspiration & Heart) */}
            <div className="relative pt-0">
                <MogulHero />
                <SocialProof />
                <MogulStory />
            </div>

            <Divider accent="secondary" />

            {/* ACT II — THE PROBLEM (The Business Void) */}
            <div className="relative bg-surface-0 border-y border-white/[0.03]">
                <MogulProblem />
                <MogulTerminal />
                <Manifesto />
            </div>

            <Divider accent="primary" />

            {/* ACT III — THE PROMISE (The Output Engine) */}
            <div className="relative">
                <MogulTransformation />
                <IntelligenceMantle />
                <Divider accent="none" />
                <SovereigntyScorecard />
                <Divider accent="secondary" />
                <EntropyAudit />
            </div>

            <Divider accent="secondary" />

            {/* ACT IV — THE PROOF (Heavy Technical Artillery) */}
            <div className="relative">
                <div className="space-y-4 md:space-y-12">
                    {/* Cinematic Proof Suite */}
                    <MogulDemoVideos />
                    <SwarmLogs />
                    <MogulComparison />

                    <Divider accent="primary" />

                    {/* The Architecture of Dominion */}
                    <MogulStats />
                    <AgentEcosystem />
                    <AgentOrchestration />
                    <NeuralArchitecture />

                    {/* Operating Systems */}
                    <RawDirectives />
                    <ModesShowcase />
                    <div className="py-24">
                        <SelfHealingUI />
                    </div>

                    <Divider accent="white" />

                    {/* Security & Infrastructure */}
                    <FeaturesAIOS />
                    <MultiWorkspace />
                    <SecurityVault />
                    <PerimeterMap />
                    <ResearchMemory />
                    <GlobalRelay />
                </div>
            </div>

            <Divider accent="primary" />

            {/* ACT V — THE OFFER (Aggressive Value Stack) */}
            <div className="relative py-24 bg-surface-0 border-t border-white/[0.03] space-y-40">
                <GrandOffer />
                <MogulBonuses />
            </div>

            <Divider accent="secondary" />

            {/* ACT VI — THE RESPONSE (ROI & Asset Ownership) */}
            <div className="relative space-y-24">
                <MogulPricingComparison />
                <PricingSection />
            </div>

            {/* ACT VII — THE PUSH (Empire Initialization) */}
            <div className="relative bg-surface-50/50">
                <FAQSection />
                <MogulFinalCTA />
                <Footer />
            </div>
        </main>
    );
}
