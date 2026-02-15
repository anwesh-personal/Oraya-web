"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldCheck, Database, Brain, LucideIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useResponsive } from "./responsive/ResponsiveProvider";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & TASKS
// ─────────────────────────────────────────────────────────────────────────────
type AgentState = "SPAWNING" | "INJECTING" | "SYNCING" | "WORKING" | "SUBMITTING" | "DESTRUCTING";

interface Agent {
    id: string;
    slot: number;
    code: string;
    avatar: string;
    role: string;
    state: AgentState;
}

const ORA_AVATAR = "/assets/Assets/Ora-multitasking.jpg";

const AGENT_POOL = [
    { code: "0X_89_INFILTRATION", avatar: "/assets/agents/ephe1.jpg" },
    { code: "0X_42_DECRYPT", avatar: "/assets/agents/ephe2.jpg" },
    { code: "0X_GAMMA_RED", avatar: "/assets/agents/ephe3.jpg" },
    { code: "0x_Talwinder_92", avatar: "/assets/agents/ephe4.jpg" },
    { code: "0X_OMEGA_9", avatar: "/assets/agents/ephe5.png" }
];

const TASKS = [
    "RESEARCH NEURAL SHARDS",
    "DEPLOY REPO TO VERCEL",
    "DEBUG KERNEL PANIC 0x4",
    "SCRAPE MARKET SENTIMENT",
    "GENERATE SOCIAL CAMPAIGN",
    "OPTIMIZE VECTOR DATABASE",
    "REDACT SENSITIVE PII",
    "TRAIN LORA WEIGHTS",
    "AUDIT SMART CONTRACTS",
    "BYPASS CLOUDFLARE WAF",
    "SYNC DECENTRALIZED NODES"
];

export default function OrchestrationFlow() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [oraState, setOraState] = useState<"IDLE" | "ANALYZING" | "BROADCASTING">("IDLE");
    const [sysLoad, setSysLoad] = useState(32);
    const { isMobile } = useResponsive();

    const agentsRef = useRef<Agent[]>([]);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.2 });

    useEffect(() => { agentsRef.current = agents; }, [agents]);

    const loadColor = sysLoad <= 40 ? "#10B981" : sysLoad <= 70 ? "#F0B429" : "#EF4444";
    const loadBg = sysLoad <= 40 ? "rgba(16, 185, 129, 0.1)" : sysLoad <= 70 ? "rgba(240, 180, 41, 0.1)" : "rgba(239, 68, 68, 0.1)";
    const loadBorder = sysLoad <= 40 ? "rgba(16, 185, 129, 0.3)" : sysLoad <= 70 ? "rgba(240, 180, 41, 0.3)" : "rgba(239, 68, 68, 0.3)";

    useEffect(() => {
        if (!isInView) return;
        const interval = setInterval(() => {
            const count = agents.length;
            const base = oraState === "IDLE" ? 28 : oraState === "ANALYZING" ? 72 : 55;
            const target = Math.min(99, base + count * 8 + (Math.floor(Math.random() * 6) - 3));
            setSysLoad(target);
        }, 1000);
        return () => clearInterval(interval);
    }, [oraState, agents.length, isInView]);

    useEffect(() => {
        if (!isInView) return;
        let mounted = true;
        const loop = async () => {
            while (mounted) {
                const d = Math.random();
                if (d < 0.45) await executeSlide();
                else if (d < 0.8) await executeSwarm();
                else await executeIndividual();
                if (!mounted) break;
                await wait(5000 + Math.random() * 2000);
            }
        };

        const getUniqueBundle = (count: number) => {
            const current = agentsRef.current;
            const activeAvatars = current.map(a => a.avatar);
            const activeRoles = current.map(a => a.role);
            const availAgents = AGENT_POOL.filter(a => !activeAvatars.includes(a.avatar));
            const availTasks = TASKS.filter(t => !activeRoles.includes(t));
            const shuffled = [...availAgents].sort(() => Math.random() - 0.5);
            const shuffledTasks = [...availTasks].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count).map((a, i) => ({ ...a, role: shuffledTasks[i] || TASKS[0] }));
        };

        const spawn = (conf: any, slot: number) => {
            const id = Math.random().toString(36).substring(7);
            setAgents(p => [...p, { id, slot, state: "SPAWNING", ...conf }]);
            return id;
        };
        const setS = (id: string, s: AgentState) => setAgents(p => p.map(a => a.id === id ? { ...a, state: s } : a));

        const orchestrateLife = async (id: string) => {
            await wait(1000); setS(id, "INJECTING");
            await wait(1500); setS(id, "SYNCING");
            await wait(1200); setS(id, "WORKING");
        };

        const kill = async (id: string) => {
            setS(id, "SUBMITTING"); await wait(2500);
            setS(id, "DESTRUCTING"); await wait(3000);
            setAgents(p => p.filter(a => a.id !== id));
        };

        const executeSlide = async () => {
            setOraState("ANALYZING"); await wait(2000);
            const b1 = getUniqueBundle(1);
            if (!b1.length) return;
            const id1 = spawn(b1[0], 1); setOraState("BROADCASTING"); orchestrateLife(id1);
            await wait(1500);
            setOraState("IDLE"); await wait(3000);
            setOraState("ANALYZING"); await wait(1200);
            setAgents(p => p.map(a => a.id === id1 ? { ...a, slot: 0 } : a)); await wait(1200);
            setOraState("BROADCASTING");
            const b2 = getUniqueBundle(2);
            if (b2.length >= 2) {
                const i2 = spawn(b2[0], 1); const i3 = spawn(b2[1], 2);
                orchestrateLife(i2); orchestrateLife(i3);
            }
            setOraState("IDLE"); await wait(12000);
            const ids = agentsRef.current.map(a => a.id).sort(() => Math.random() - 0.5);
            for (const id of ids) await kill(id);
        };

        const executeSwarm = async () => {
            setOraState("ANALYZING"); await wait(2000);
            const b = getUniqueBundle(3); if (!b.length) return;
            const ids = b.map((b, i) => spawn(b, i)); setOraState("BROADCASTING"); await wait(1500);
            ids.forEach(id => orchestrateLife(id)); setOraState("IDLE"); await wait(15000);
            for (const id of [...ids].sort(() => Math.random() - 0.5)) await kill(id);
        };

        const executeIndividual = async () => {
            const slot = Math.floor(Math.random() * 3); setOraState("ANALYZING"); await wait(1500);
            const b = getUniqueBundle(1); if (!b.length) return;
            const id = spawn(b[0], slot); setOraState("BROADCASTING"); await wait(1500);
            orchestrateLife(id); setOraState("IDLE"); await wait(10000); await kill(id);
        };

        loop(); return () => { mounted = false; };
    }, [isInView]);

    const oraCore = (
        <div className={cn(
            "relative flex flex-col items-center justify-center border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent z-20",
            isMobile ? "w-full p-6 border-b" : "lg:w-[30%] w-full h-full border-r p-10"
        )}>
            <div className={cn("relative w-full aspect-square flex flex-col items-center justify-center", isMobile ? "max-w-[140px]" : "max-w-[280px]")}>
                <AnimatePresence>
                    {oraState === "ANALYZING" && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1.2 }} exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 bg-primary/10 rounded-full blur-[60px] md:blur-[100px]" />
                    )}
                </AnimatePresence>
                <motion.div animate={{ scale: oraState === "ANALYZING" ? 1.05 : 1 }} className="relative w-full aspect-square rounded-[30px] md:rounded-[60px] border border-white/10 p-2 bg-black shadow-2xl overflow-hidden ring-1 ring-white/5">
                    <div className="relative w-full h-full rounded-[24px] md:rounded-[52px] overflow-hidden border border-white/5">
                        <Image src={ORA_AVATAR} alt="ORA" fill className="object-cover scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                </motion.div>
            </div>

            <div className={cn("w-full px-4", isMobile ? "mt-4 max-w-[220px]" : "mt-8")}>
                <motion.div animate={{ backgroundColor: loadBg, borderColor: loadBorder, color: loadColor }} className="w-full flex items-center justify-between px-4 py-3 md:px-6 md:py-4 rounded-[20px] md:rounded-[28px] border backdrop-blur-xl transition-all duration-500 shadow-lg">
                    <div className="flex items-center gap-2 md:gap-3">
                        <Activity size={14} className="animate-pulse" />
                        <span className="text-[10px] md:text-[11px] font-mono font-black uppercase tracking-[0.2em]">Load</span>
                    </div>
                    <div className="text-xl md:text-2xl font-mono font-black tabular-nums">{Math.round(sysLoad)}%</div>
                </motion.div>
            </div>

            <div className="mt-4 text-center space-y-2">
                <div className="flex items-center gap-3 justify-center">
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 rounded-full" style={{ backgroundColor: loadColor, boxShadow: `0 0 15px ${loadColor}` }} />
                    <span className="text-[10px] md:text-xs font-mono text-white font-black uppercase tracking-[0.3em]">ORA_PRIME</span>
                </div>
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className={cn(
            "relative w-full bg-[#030303] border border-white/[0.08] overflow-hidden select-none shadow-2xl flex flex-col",
            isMobile ? "rounded-[32px] min-h-[850px]" : "lg:h-[850px] lg:flex-row lg:rounded-[48px]"
        )}>
            {oraCore}

            {/* THE WOMB ZONE */}
            <div className={cn("relative w-full bg-[#050505]", isMobile ? "flex-1 overflow-hidden" : "lg:w-[70%] h-full lg:p-12")}>
                <div className={cn("relative w-full h-full border border-white/10 rounded-[24px] md:rounded-[40px] lg:rounded-[60px] bg-black/40 overflow-hidden shadow-2xl backdrop-blur-xl", isMobile && "border-0 rounded-0 bg-transparent")}>
                    <div className={cn("absolute left-8 right-8 flex justify-between items-start z-30", isMobile ? "top-6" : "top-10")}>
                        <div className="flex items-center gap-3 md:gap-5">
                            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_20px_#F0B429]" />
                            <span className="text-[10px] md:text-[12px] font-mono text-primary font-black uppercase tracking-[0.4em]">EPHEMERAL_SWARM</span>
                        </div>
                        {!isMobile && (
                            <div className="flex items-center gap-3 text-zinc-700 font-mono text-[10px] uppercase tracking-widest transition-opacity">
                                <ShieldCheck size={14} className="opacity-40" /> SECURE_ORCHESTRATION
                            </div>
                        )}
                    </div>

                    <div className="relative w-full h-full">
                        <div className={cn(
                            "w-full h-full",
                            isMobile
                                ? "pt-24 pb-12 px-6 overflow-y-auto scrollbar-hide flex flex-col gap-8"
                                : "relative py-0"
                        )}>
                            <AnimatePresence initial={false}>
                                {[...agents].sort((a, b) => a.slot - b.slot).map((a) => (
                                    <AgentMolecule key={a.id} agent={a} loadColor={loadColor} isMobile={isMobile} />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Desktop Tethers */}
                    {!isMobile && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            <AnimatePresence>
                                {agents.map((a) => (
                                    <motion.g key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <TetherPath slot={a.slot} color="#F0B429" />
                                    </motion.g>
                                ))}
                            </AnimatePresence>
                        </svg>
                    )}
                </div>
            </div>
        </div>
    );
}

function TetherPath({ slot, color }: { slot: number, color: string }) {
    const yArr = [165, 425, 685]; // 850px height mapping
    return (
        <>
            <motion.path d={`M 0,425 C 100,425 150,${yArr[slot]} 280,${yArr[slot]}`} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.08" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
            <motion.path d={`M 0,425 C 100,425 150,${yArr[slot]} 280,${yArr[slot]}`} fill="none" stroke={color} strokeWidth="1" animate={{ strokeOpacity: [0.2, 0.4, 0.2] }} transition={{ duration: 1.5, repeat: Infinity }} />
        </>
    );
}

function AgentMolecule({ agent, loadColor, isMobile }: { agent: Agent, loadColor: string, isMobile: boolean }) {
    const ySlots = isMobile ? ["0%", "0%", "0%"] : ["20%", "50%", "80%"]; // Mobile uses flex
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (agent.state === "WORKING") {
            const start = Date.now();
            const dur = 8000 + Math.random() * 4000;
            const tick = () => {
                const p = Math.min(1, (Date.now() - start) / dur);
                setProgress(p);
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }
    }, [agent.state]);

    const isHiding = agent.state === "DESTRUCTING";

    return (
        <motion.div
            layout
            initial={isMobile ? { opacity: 0, x: -20, scale: 0.95 } : { opacity: 0 }}
            animate={isHiding ? { opacity: 0, scale: 0.5, filter: "blur(10px)", transition: { delay: 1.5, duration: 0.8 } } : { opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 1, type: "spring", bounce: 0.2 }}
            className={cn(
                "flex items-center",
                isMobile ? "relative w-full gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5" : "absolute -translate-y-[50%] left-[32%] gap-12"
            )}
            style={!isMobile ? { top: ySlots[agent.slot] } : {}}
        >
            <motion.div
                animate={!isHiding ? { y: [0, -6, 0] } : {}}
                transition={isHiding ? {} : { y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                className="relative flex-shrink-0"
            >
                <div className={cn("relative flex items-center justify-center", isMobile ? "w-16 h-16" : "lg:w-40 lg:h-40 w-28 h-28")}>
                    <motion.svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" animate={isHiding ? { opacity: 0, transition: { delay: 2.2 } } : {}}>
                        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                        <motion.circle cx="50" cy="50" r="48" fill="none" stroke={agent.state === "SUBMITTING" ? "#10B981" : loadColor} strokeWidth="2.5" strokeLinecap="round"
                            initial={{ strokeDasharray: "0 302" }} animate={{ strokeDasharray: `${progress * 302} 302` }} transition={{ ease: "linear" }} />
                    </motion.svg>
                    <div className={cn("relative rounded-full overflow-hidden border-2 border-white/20 bg-black shadow-2xl", isMobile ? "w-11 h-11" : "lg:w-32 lg:h-32 w-22 h-22")}>
                        <Image src={agent.avatar} alt={agent.code} fill className="object-cover" unoptimized />
                    </div>
                </div>
            </motion.div>

            <div className={cn("flex flex-col gap-1 md:gap-4 drop-shadow-2xl", isMobile ? "min-w-0 flex-1" : "min-w-[300px]")}>
                <div className="space-y-0.5 md:space-y-1">
                    <div className="flex items-center gap-2 md:gap-4 mb-1">
                        {!isMobile && (
                            <>
                                <AnimatePresence>
                                    {(agent.state !== "SPAWNING" && !isHiding) && (
                                        <StatusIcon icon={Database} label="Context" color="text-primary" delay={0} />
                                    )}
                                </AnimatePresence>
                                <AnimatePresence>
                                    {((agent.state === "SYNCING" || agent.state === "WORKING" || agent.state === "SUBMITTING") && !isHiding) && (
                                        <StatusIcon icon={Brain} label="Memory" color="text-cyan-400" delay={0.6} />
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                        <motion.div animate={isHiding ? { opacity: 0, x: 20, transition: { delay: 1 } } : {}}
                            className={cn("px-2 py-0.5 md:px-4 md:py-1 rounded-full border text-[7px] md:text-[10px] font-mono font-black uppercase tracking-widest",
                                agent.state === "WORKING" ? "bg-primary/10 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-zinc-500")}>
                            {agent.state.replace(/_/g, " ")}
                        </motion.div>
                    </div>
                    <motion.div animate={isHiding ? { opacity: 0, y: 10, transition: { delay: 1.2 } } : {}}>
                        <div className="text-[8px] md:text-[11px] font-mono text-white/30 font-black uppercase tracking-[0.4em] truncate">{agent.code}</div>
                        <div className="text-sm md:text-3xl font-display font-black text-white uppercase tracking-tight leading-none truncate">{agent.role}</div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

function StatusIcon({ icon: Icon, label, color, delay }: { icon: LucideIcon, label: string, color: string, delay: number }) {
    return (
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0, y: -20, transition: { delay, duration: 0.4 } }}
            className={cn("p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col items-center gap-1", color)}
        >
            <Icon size={14} />
            <span className="text-[7px] font-black uppercase tracking-tight">{label}</span>
        </motion.div>
    );
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
