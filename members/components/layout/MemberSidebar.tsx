"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bot,
    LayoutDashboard,
    MessageSquare,
    CreditCard,
    Settings,
    Store,
    BarChart3,
    HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/agents", label: "My Agents", icon: Bot },
    { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
    { href: "/dashboard/usage", label: "Usage", icon: BarChart3 },
    { href: "/dashboard/marketplace", label: "Marketplace", icon: Store },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function MemberSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-[var(--surface-300)] bg-[var(--surface-50)]/50 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--surface-300)]">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 20px -4px var(--primary-glow)' }}
                    >
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-[var(--surface-900)]">Oraya</span>
                        <p className="text-xs text-[var(--surface-500)]">Member Portal</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                                isActive
                                    ? "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30"
                                    : "text-[var(--surface-500)] hover:bg-[var(--surface-100)] hover:text-[var(--surface-800)]"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Help */}
            <div className="p-4 border-t border-[var(--surface-300)]">
                <Link
                    href="/support"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--surface-500)] hover:bg-[var(--surface-100)] hover:text-[var(--surface-800)] transition-all"
                >
                    <HelpCircle className="w-5 h-5" />
                    <span className="font-medium">Help & Support</span>
                </Link>
            </div>

            {/* Plan Badge */}
            <div className="p-4 border-t border-[var(--surface-300)]">
                <div className="p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                    <p className="text-sm text-[var(--surface-500)] mb-1">Current Plan</p>
                    <p className="text-lg font-bold text-[var(--surface-900)]">Pro</p>
                    <Link
                        href="/dashboard/billing"
                        className="text-sm text-[var(--primary)] hover:opacity-80 mt-2 inline-block"
                    >
                        Manage subscription →
                    </Link>
                </div>
            </div>
        </aside>
    );
}
