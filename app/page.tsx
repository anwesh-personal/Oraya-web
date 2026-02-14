
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

import Manifesto from "@/components/sales/Manifesto";
import NeuralArchitecture from "@/components/sales/NeuralArchitecture";
import SovereigntyScorecard from "@/components/sales/SovereigntyScorecard";
import GlobalRelay from "@/components/sales/GlobalRelay";

// ─── Cinematic Section Divider ─────────────────────────────────
function Divider({ accent }: { accent?: "cyan" | "magenta" | "gold" | "none" }) {
    const glowColor = accent === "cyan" ? "#00F0FF" : accent === "magenta" ? "#FF00AA" : accent === "gold" ? "#F0B429" : undefined;
    return (
        <div className="relative h-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black to-transparent" />
            {glowColor && (
                <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[1px] opacity-10"
                    style={{ boxShadow: `0 0 40px 10px ${glowColor}`, backgroundColor: glowColor }}
                />
            )}
        </div>
    );
}

export default function LandingPage() {
    return (
        <main className="sales-page-dark min-h-screen bg-black text-white selection:bg-[#00F0FF] selection:text-black overflow-x-hidden relative">
            {/* Global Effects */}
            <SalesNavbar />
            <NeuralBackground />
            <SpotlightCursor />

            {/* ━━━ ACT I — THE PROMISE ━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* Hook them with the vision */}
            <SalesHero />

            {/* Social credibility strip */}
            <SocialProof />

            <Divider accent="cyan" />

            {/* ━━━ ACT II — THE PAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* Amplify what's broken */}
            <ProblemSection />

            {/* The Founder's raw story — "I built this because I had to" */}
            <Manifesto />

            <Divider accent="magenta" />

            {/* ━━━ ACT III — THE SOLUTION ━━━━━━━━━━━━━━━━━━━━━ */}
            {/* Visually prove the difference: before/after */}
            <TransformationSection />

            {/* Show the terminal — "This is what power looks like" */}
            <TerminalDemo />

            <Divider accent="cyan" />

            {/* ━━━ ACT IV — THE PROOF ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* Head-to-head comparison table */}
            <SovereigntyScorecard />

            {/* The Numbers */}
            <StatsCounter />

            <Divider accent="gold" />

            {/* ━━━ ACT V — THE DEPTH ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* Multi-Agent System */}
            <AgentEcosystem />

            {/* Neural Architecture — how the brain actually works */}
            <NeuralArchitecture />

            {/* Cognitive Modes — Assistant, Brainstorm, War Room, Ghost */}
            <ModesShowcase />

            <Divider accent="cyan" />

            {/* Core Features Zig-Zag — indexing, execution, control, voice */}
            <FeaturesAIOS />

            {/* Multi-Workspace Intelligence */}
            <MultiWorkspace />

            {/* Security Vault — Fort Knox */}
            <SecurityVault />

            {/* 24/7 Research + Memory */}
            <ResearchMemory />

            {/* Global Infrastructure */}
            <GlobalRelay />

            <Divider accent="magenta" />

            {/* ━━━ ACT VI — THE VALUE ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* Everything you get — Grand Offer stack */}
            <GrandOffer />

            {/* Pricing */}
            <PricingSection />

            <Divider accent="none" />

            {/* ━━━ ACT VII — THE CLOSE ━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* FAQ */}
            <FAQSection />

            {/* Final CTA */}
            <FinalCTA />

            {/* Footer */}
            <Footer />
        </main>
    );
}
