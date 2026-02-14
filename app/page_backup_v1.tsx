
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
import ComparisonSection from "@/components/sales/ComparisonSection";
import FAQSection from "@/components/sales/FAQSection";
import FinalCTA from "@/components/sales/FinalCTA";
import TransformationSection from "@/components/sales/Transformation";
import PricingSection from "@/components/sales/Pricing";
import Footer from "@/components/sales/Footer";
import TheCore from "@/components/sales/TheCore";
import AgentEcosystem from "@/components/sales/AgentEcosystem";
import ResearchMemory from "@/components/sales/ResearchMemory";
import NeuralArchitecture from "@/components/sales/NeuralArchitecture";
import SecurityVault from "@/components/sales/SecurityVault";
import GlobalRelay from "@/components/sales/GlobalRelay";
import Manifesto from "@/components/sales/Manifesto";
import ModesShowcase from "@/components/sales/ModesShowcase";
import MultiWorkspace from "@/components/sales/MultiWorkspace";
import SovereigntyScorecard from "@/components/sales/SovereigntyScorecard";
import FeatureGrid from "@/components/sales/FeatureGrid";
import TechStackEater from "@/components/sales/TechStackEater";

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-[#00F0FF] selection:text-black overflow-x-hidden relative">
            {/* Global Effects */}
            <SalesNavbar />
            <NeuralBackground />
            <SpotlightCursor />

            {/* 1. The Promise (Hook) */}
            <SalesHero />
            <SocialProof />
            <Manifesto />

            {/* Cinematic Transition */}
            <div className="h-48 bg-gradient-to-b from-black via-[#050505] to-black" />

            {/* 2. The Shift (Problem & Future) */}
            <ProblemSection />
            <TransformationSection />

            {/* Cinematic Transition */}
            <div className="h-32 bg-gradient-to-b from-black to-[#0a0a0a]" />

            {/* 3. The Reality (High-Impact Showcase) */}
            <TerminalDemo />

            <div className="h-24 bg-[#0a0a0a]" />
            <MultiWorkspace />

            <div className="h-24 bg-[#050505]" />
            <AgentEcosystem />

            <div className="h-24 bg-black" />
            <ModesShowcase />

            {/* Cinematic Transition */}
            <div className="h-48 bg-gradient-to-b from-black via-[#050505] to-black" />

            {/* 4. The Depth (Intelligence Deep-Dive) */}
            <NeuralArchitecture />
            <FeaturesAIOS />
            <FeatureGrid />
            <ResearchMemory />

            {/* Cinematic Transition */}
            <div className="h-48 bg-gradient-to-b from-black to-[#050505]" />

            {/* 5. The Fortress (Infrastructure & Security) */}
            <SecurityVault />
            <GlobalRelay />
            <TheCore />

            {/* Cinematic Transition */}
            <div className="h-32 bg-gradient-to-b from-[#050505] to-black" />

            {/* 6. The Proof (Validation) */}
            <StatsCounter />
            <SovereigntyScorecard />
            <ComparisonSection />

            {/* Cinematic Transition */}
            <div className="h-48 bg-gradient-to-b from-black via-[#050505] to-black" />

            {/* 7. The Offer (Consolidation & Pricing) */}
            <TechStackEater />
            <GrandOffer />
            <PricingSection />
            <FAQSection />
            <FinalCTA />

            {/* 23. Footer */}
            <Footer />
        </main>
    );
}
