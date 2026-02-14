import { Bot, Zap, MessageSquare, CreditCard, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function MemberDashboardPage() {
    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">Welcome back, User</h1>
                    <p className="text-[var(--surface-500)] mt-1">Here's what's happening with your account</p>
                </div>
                <Link
                    href="/dashboard/agents/new"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all shadow-lg"
                    style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 20px -4px var(--primary-glow)' }}
                >
                    <Bot className="w-4 h-4" />
                    Create Agent
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--primary)]/20">
                            <Bot className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Active Agents</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">3</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-info/10 border border-info/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-info/20">
                            <MessageSquare className="w-6 h-6 text-info" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Conversations</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">1,234</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-warning/20">
                            <Zap className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">API Tokens Used</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">45.2K</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-success/10 border border-success/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-success/20">
                            <CreditCard className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-500)]">Current Plan</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">Pro</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Your Agents */}
                <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                    <h2 className="text-lg font-semibold text-[var(--surface-900)] mb-4">Your Agents</h2>
                    <div className="space-y-3">
                        {[
                            { name: "Customer Support Bot", status: "active", conversations: 567 },
                            { name: "Sales Assistant", status: "active", conversations: 234 },
                            { name: "Knowledge Helper", status: "idle", conversations: 89 },
                        ].map((agent) => (
                            <div
                                key={agent.name}
                                className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-100)] hover:bg-[var(--surface-200)] transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: 'var(--gradient-primary)' }}
                                    >
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--surface-900)]">{agent.name}</p>
                                        <p className="text-sm text-[var(--surface-500)]">{agent.conversations} conversations</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${agent.status === "active"
                                    ? "bg-success/20 text-success"
                                    : "bg-warning/20 text-warning"
                                    }`}>
                                    {agent.status}
                                </span>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/dashboard/agents"
                        className="block mt-4 text-center text-sm text-[var(--primary)] hover:opacity-80"
                    >
                        View all agents →
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                    <h2 className="text-lg font-semibold text-[var(--surface-900)] mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/dashboard/agents/new"
                            className="p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors text-center"
                        >
                            <Bot className="w-8 h-8 text-[var(--primary)] mx-auto mb-2" />
                            <p className="font-medium text-[var(--surface-900)]">New Agent</p>
                        </Link>
                        <Link
                            href="/dashboard/usage"
                            className="p-4 rounded-xl bg-info/10 border border-info/20 hover:bg-info/20 transition-colors text-center"
                        >
                            <TrendingUp className="w-8 h-8 text-info mx-auto mb-2" />
                            <p className="font-medium text-[var(--surface-900)]">View Usage</p>
                        </Link>
                        <Link
                            href="/dashboard/billing"
                            className="p-4 rounded-xl bg-success/10 border border-success/20 hover:bg-success/20 transition-colors text-center"
                        >
                            <CreditCard className="w-8 h-8 text-success mx-auto mb-2" />
                            <p className="font-medium text-[var(--surface-900)]">Billing</p>
                        </Link>
                        <Link
                            href="/dashboard/marketplace"
                            className="p-4 rounded-xl bg-warning/10 border border-warning/20 hover:bg-warning/20 transition-colors text-center"
                        >
                            <Zap className="w-8 h-8 text-warning mx-auto mb-2" />
                            <p className="font-medium text-[var(--surface-900)]">Marketplace</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
