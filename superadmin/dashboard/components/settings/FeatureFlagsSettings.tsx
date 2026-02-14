"use client";

import { useState } from "react";
import { Save, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureFlag {
    id: string;
    name: string;
    description: string;
    free: boolean;
    byok: boolean;
    pro: boolean;
    enterprise: boolean;
}

const initialFlags: FeatureFlag[] = [
    {
        id: "voice_mode",
        name: "Voice Mode",
        description: "Text-to-speech and speech-to-text capabilities",
        free: false,
        byok: false,
        pro: true,
        enterprise: true,
    },
    {
        id: "custom_agents",
        name: "Custom Agents",
        description: "Create unlimited custom AI agents",
        free: false,
        byok: false,
        pro: true,
        enterprise: true,
    },
    {
        id: "cloud_sync",
        name: "Cloud Sync",
        description: "Sync agents, memories, and settings across devices",
        free: false,
        byok: false,
        pro: true,
        enterprise: true,
    },
    {
        id: "agent_marketplace",
        name: "Agent Marketplace",
        description: "Access to community and premium agent templates",
        free: false,
        byok: false,
        pro: true,
        enterprise: true,
    },
    {
        id: "master_protocol",
        name: "Master Protocol",
        description: "Advanced protocol for cross-agent orchestration",
        free: false,
        byok: false,
        pro: true,
        enterprise: true,
    },
    {
        id: "mcp_extensions",
        name: "MCP Extensions",
        description: "Model Context Protocol integrations",
        free: false,
        byok: false,
        pro: true,
        enterprise: true,
    },
    {
        id: "team_management",
        name: "Team Management",
        description: "Multi-user team accounts with roles",
        free: false,
        byok: false,
        pro: false,
        enterprise: true,
    },
    {
        id: "sso",
        name: "SSO (SAML/OAuth)",
        description: "Single sign-on for enterprise security",
        free: false,
        byok: false,
        pro: false,
        enterprise: true,
    },
    {
        id: "white_label",
        name: "White Label",
        description: "Custom branding and domain",
        free: false,
        byok: false,
        pro: false,
        enterprise: true,
    },
    {
        id: "api_access",
        name: "API Access",
        description: "REST API for programmatic access",
        free: false,
        byok: false,
        pro: true,
        enterprise: true,
    },
];

export function FeatureFlagsSettings() {
    const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);

    const toggleFlag = (flagId: string, tier: "free" | "byok" | "pro" | "enterprise") => {
        setFlags(flags.map((flag) =>
            flag.id === flagId ? { ...flag, [tier]: !flag[tier] } : flag
        ));
    };

    const handleSave = () => {
        console.log("Saving feature flags:", flags);
    };

    return (
        <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Feature Flags by Tier</h3>
                        <p className="text-sm text-gray-400 mt-1">Control which features are available per subscription tier</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all">
                        <Plus className="w-4 h-4" />
                        Add Feature
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Feature</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400 w-24">Free</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400 w-24">BYOK</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400 w-24">Pro</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400 w-24">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {flags.map((flag) => (
                                <tr key={flag.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-4">
                                        <div>
                                            <p className="font-medium text-white">{flag.name}</p>
                                            <p className="text-sm text-gray-400">{flag.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => toggleFlag(flag.id, "free")}
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                flag.free
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : "bg-white/5 text-gray-500 hover:bg-white/10"
                                            )}
                                        >
                                            {flag.free ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => toggleFlag(flag.id, "byok")}
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                flag.byok
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : "bg-white/5 text-gray-500 hover:bg-white/10"
                                            )}
                                        >
                                            {flag.byok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => toggleFlag(flag.id, "pro")}
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                flag.pro
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : "bg-white/5 text-gray-500 hover:bg-white/10"
                                            )}
                                        >
                                            {flag.pro ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => toggleFlag(flag.id, "enterprise")}
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                flag.enterprise
                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                    : "bg-white/5 text-gray-500 hover:bg-white/10"
                                            )}
                                        >
                                            {flag.enterprise ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
                >
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>
        </div>
    );
}
