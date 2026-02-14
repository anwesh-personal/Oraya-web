export interface Agent {
    name: string;
    role: string;
    status: string;
    color: string;
    avatar: string;
    desc: string;
    capabilities: string[];
    mode: string;
    clearance: string;
}

export const agents: Agent[] = [
    {
        name: "Ora",
        role: "Sovereign",
        status: "Active",
        color: "#00F0FF",
        avatar: "/assets/agents/ora-avatar.png",
        desc: "The core intelligence. Immediate kernel access. Commands the swarm with absolute authority. Full clearance, zero restrictions.",
        capabilities: ["God Mode Terminal", "Agent Spawning", "Memory Implant", "System Override"],
        mode: "Command",
        clearance: "L5",
    },
    {
        name: "Ova",
        role: "Neural Recon",
        status: "Active",
        color: "#FF00AA",
        avatar: "/assets/Assets/2.png",
        desc: "Deep-layer reconnaissance. 24/7 neural indexing across every shard of your data. Finds what's hidden before you even look.",
        capabilities: ["24/7 Research", "Auto-Summary", "Neural Mapping", "Knowledge Synthesis"],
        mode: "Deep Recon",
        clearance: "L3",
    },
    {
        name: "Mara",
        role: "Sanitization",
        status: "Idle",
        color: "#8B5CF6",
        avatar: "/assets/Assets/9.png",
        desc: "Lethal auditor. Tears through code to find debt, bugs, and weaknesses. If it doesn't meet the standard, it doesn't survive.",
        capabilities: ["Code Audit", "Debt Detection", "Performance Kill-switch", "Refactor Siege"],
        mode: "Sanitize",
        clearance: "L2",
    },
    {
        name: "Saira",
        role: "Ghost Ops",
        status: "Stealth",
        color: "#10B981",
        avatar: "/assets/Assets/3.png",
        desc: "Zero-trace execution. Operates in the shadows of the OS. Handles sensitive credentials and encrypted weights with absolute deniability.",
        capabilities: ["Ghost Protocol", "Sovereign Shield", "Bypass Mode", "Ephemeral Execution"],
        mode: "Wraith",
        clearance: "L2",
    },
];
