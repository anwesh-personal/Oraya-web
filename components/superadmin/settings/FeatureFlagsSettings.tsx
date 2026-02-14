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
            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--surface-900)]">Feature Flags by Tier</h3>
                        <p className="text-sm text-[var(--surface-500)] mt-1">Control which features are available per subscription tier</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-100)] border border-[var(--surface-200)] rounded-xl text-[var(--surface-600)] hover:bg-[var(--surface-200)] transition-all">
                        <Plus className="w-4 h-4" />
                        Add Feature
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--surface-200)]">
                                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--surface-500)]">Feature</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-[var(--surface-500)] w-24">Free</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-[var(--surface-500)] w-24">BYOK</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-[var(--surface-500)] w-24">Pro</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-[var(--surface-500)] w-24">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-200)]">
                            {flags.map((flag) => (
                                <tr key={flag.id} className="hover:bg-[var(--surface-100)] transition-colors">
                                    <td className="px-4 py-4">
                                        <div>
                                            <p className="font-medium text-[var(--surface-900)]">{flag.name}</p>
                                            <p className="text-sm text-[var(--surface-500)]">{flag.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => toggleFlag(flag.id, "free")}
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                flag.free
                                                    ? "bg-success/20 text-success"
                                                    : "bg-[var(--surface-100)] text-[var(--surface-400)] hover:bg-[var(--surface-200)]"
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
                                                    ? "bg-success/20 text-success"
                                                    : "bg-[var(--surface-100)] text-[var(--surface-400)] hover:bg-[var(--surface-200)]"
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
                                                    ? "bg-success/20 text-success"
                                                    : "bg-[var(--surface-100)] text-[var(--surface-400)] hover:bg-[var(--surface-200)]"
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
                                                    ? "bg-success/20 text-success"
                                                    : "bg-[var(--surface-100)] text-[var(--surface-400)] hover:bg-[var(--surface-200)]"
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
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all shadow-lg"
                    style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 20px -4px var(--primary-glow)' }}
                >
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>
        </div>
    );
}
