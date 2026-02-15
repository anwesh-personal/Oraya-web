"use client";

import { motion } from "framer-motion";
import { Zap, Network, Activity, Terminal } from "lucide-react";
import OrchestrationFlow from "./OrchestrationFlow";

export default function AgentOrchestration() {
    return (
        <section className="py-24 bg-black relative overflow-hidden border-t border-white/[0.03]" id="orchestration">
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="mb-20 space-y-8 max-w-4xl text-left">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/[0.03] border border-white/10 rounded-full font-mono text-[9px] font-black uppercase tracking-[0.4em] text-primary"
                    >
                        <Network size={12} />
                        Mission_Control_v2
                    </motion.div>

                    <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tight uppercase leading-none">
                        The Swarm <br />
                        <span className="text-white/20">In Action.</span>
                    </h2>

                    <p className="text-zinc-600 font-sans font-light text-xl md:text-2xl uppercase tracking-tight">
                        Watch Ora spawn specialized agents, execute deep-context missions, <br />
                        and <span className="text-white">self-destruct</span> once the intelligence is harvested.
                    </p>
                </div>

                <div className="w-full">
                    {/* FULL WIDTH: THE INTERACTIVE FLOW */}
                    <div className="space-y-12">
                        <OrchestrationFlow />
                        <div className="flex justify-center gap-16 px-8">
                            <div className="space-y-4 text-center">
                                <div className="text-[10px] font-mono text-zinc-800 uppercase tracking-[0.4em]">Spawning_Latency</div>
                                <div className="text-3xl font-black text-white tracking-tight italic">0.4<span className="text-[10px] text-zinc-600 ml-2 not-italic">MS</span></div>
                            </div>
                            <div className="space-y-4 text-center">
                                <div className="text-[10px] font-mono text-zinc-800 uppercase tracking-[0.4em]">Memory_Transplant</div>
                                <div className="text-3xl font-black text-white tracking-tight italic">100<span className="text-[10px] text-zinc-600 ml-2 not-italic">% LOSSLESS</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
