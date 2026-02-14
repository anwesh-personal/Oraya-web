"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    Bot,
    Server,
    Cpu,
    BarChart3,
    Settings,
    Key,
    FileText,
    Shield,
    HelpCircle,
    ChevronRight,
    Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useThemeStore } from "@/stores/theme-store";
import type { SessionPayload } from "@/lib/auth";

interface SidebarProps {
    session: SessionPayload;
}

const navigation = [
    {
        label: "Main",
        items: [
            { name: "Overview", href: "/superadmin/overview", icon: LayoutDashboard },
            { name: "Organizations", href: "/superadmin/organizations", icon: Building2 },
            { name: "Users", href: "/superadmin/users", icon: Users },
        ],
    },
    {
        label: "AI Management",
        items: [
            { name: "Agents", href: "/superadmin/agents", icon: Bot },
            { name: "Engines", href: "/superadmin/engines", icon: Server },
            { name: "AI Providers", href: "/superadmin/ai-providers", icon: Cpu },
            { name: "Models", href: "/superadmin/models", icon: Boxes },
        ],
    },
    {
        label: "Operations",
        items: [
            { name: "Deployments", href: "/superadmin/deployments", icon: ChevronRight },
            { name: "Analytics", href: "/superadmin/analytics", icon: BarChart3 },
            { name: "Audit Logs", href: "/superadmin/logs", icon: FileText },
        ],
    },
    {
        label: "System",
        items: [
            { name: "API Keys", href: "/superadmin/settings/api-keys", icon: Key },
            { name: "Security", href: "/superadmin/settings/security", icon: Shield },
            { name: "Settings", href: "/superadmin/settings", icon: Settings },
        ],
    },
];

export function Sidebar({ session }: SidebarProps) {
    const pathname = usePathname();
    const { mode } = useThemeStore();

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-[var(--surface-50)] border-r border-[var(--surface-300)] flex flex-col z-40">
            {/* Logo */}
            <div className="h-[var(--header-height)] flex items-center px-6 border-b border-[var(--surface-300)]">
                <Link href="/superadmin/overview" className="flex items-center gap-3">
                    <Image
                        src={mode === 'dark' ? '/logos/oraya-light.png' : '/logos/oraya-dark.png'}
                        alt="Oraya"
                        width={36}
                        height={36}
                        className="w-9 h-9"
                    />
                    <div>
                        <h1 className="font-semibold text-[var(--surface-900)] font-display">Oraya</h1>
                        <p className="text-xs text-[var(--surface-500)]">Platform Admin</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {navigation.map((section) => (
                    <div key={section.label} className="mb-6">
                        <p className="px-3 mb-2 text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                            {section.label}
                        </p>
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                                                    : "text-[var(--surface-600)] hover:text-[var(--surface-800)] hover:bg-[var(--surface-100)]"
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "w-5 h-5",
                                                    isActive ? "text-[var(--primary)]" : "text-[var(--surface-500)]"
                                                )}
                                            />
                                            {item.name}
                                            {isActive && (
                                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--surface-300)]">
                {/* Theme Switcher */}
                <div className="flex items-center justify-between mb-3 px-3">
                    <span className="text-xs text-[var(--surface-500)]">Theme</span>
                    <ThemeSwitcher />
                </div>

                <Link
                    href="/superadmin/help"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--surface-600)] hover:text-[var(--surface-800)] hover:bg-[var(--surface-100)] transition-colors"
                >
                    <HelpCircle className="w-5 h-5" />
                    Help & Support
                </Link>
                <div className="mt-3 px-3 py-2">
                    <p className="text-xs text-[var(--surface-500)]">Logged in as</p>
                    <p className="text-sm font-medium text-[var(--surface-700)] truncate">{session.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                        {session.role}
                    </span>
                </div>
            </div>
        </aside>
    );
}

