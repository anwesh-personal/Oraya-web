"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Key,
    Coins,
    CreditCard,
    Microscope,
    Settings,
    HelpCircle,
    LogOut,
    Loader2,
    Download,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useThemeStore } from "@/stores/theme-store";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UserData {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
}

interface LicenseInfo {
    plan_id: string;
    plan_name: string;
    status: string;
}

interface MemberSidebarProps {
    user: UserData;
    license?: LicenseInfo | null;
}

// ─────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────

const navigation = [
    {
        label: "Main",
        items: [
            { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { name: "License & Devices", href: "/dashboard/license", icon: Key },
            { name: "Token Wallet", href: "/dashboard/tokens", icon: Coins },
        ],
    },
    {
        label: "Services",
        items: [
            { name: "24/7 Research", href: "/dashboard/research", icon: Microscope },
        ],
    },
    {
        label: "Account",
        items: [
            { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
            { name: "Settings", href: "/dashboard/settings", icon: Settings },
        ],
    },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function MemberSidebar({ user, license }: MemberSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { mode } = useThemeStore();
    const [collapsed, setCollapsed] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.replace("/login");
            router.refresh();
        } catch {
            setLoggingOut(false);
        }
    };

    const planColor = license?.plan_id === "enterprise"
        ? "var(--warning)"
        : license?.plan_id === "pro" || license?.plan_id === "team"
            ? "var(--primary)"
            : "var(--surface-500)";

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 bottom-0 bg-[var(--surface-50)] border-r border-[var(--surface-300)] flex flex-col z-40 transition-all duration-300",
                collapsed ? "w-20" : "w-[var(--sidebar-width)]"
            )}
        >
            {/* ── Logo ── */}
            <div className="h-[var(--header-height)] flex items-center px-5 border-b border-[var(--surface-300)] justify-between">
                <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
                    <Image
                        src={mode === "dark" ? "/logos/oraya-light.png" : "/logos/oraya-dark.png"}
                        alt="Oraya"
                        width={36}
                        height={36}
                        className="w-9 h-9 flex-shrink-0"
                    />
                    {!collapsed && (
                        <div className="min-w-0">
                            <h1 className="font-semibold text-[var(--surface-900)] font-display truncate">
                                Oraya
                            </h1>
                            <p className="text-xs text-[var(--surface-500)]">Member Portal</p>
                        </div>
                    )}
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-500)] transition-colors hidden lg:flex"
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* ── Download CTA ── */}
            {!collapsed && (
                <div className="px-4 pt-4">
                    <a
                        href="https://oraya.dev/download"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)]/10 to-[var(--secondary)]/10 border border-[var(--primary)]/20 hover:border-[var(--primary)]/40 transition-all group"
                    >
                        <Download className="w-5 h-5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--surface-900)]">
                                Download Oraya
                            </p>
                            <p className="text-xs text-[var(--surface-500)]">
                                Desktop App for macOS
                            </p>
                        </div>
                    </a>
                </div>
            )}

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {navigation.map((section) => (
                    <div key={section.label} className="mb-6">
                        {!collapsed && (
                            <p className="px-3 mb-2 text-xs font-medium text-[var(--surface-500)] uppercase tracking-wider">
                                {section.label}
                            </p>
                        )}
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const isActive =
                                    item.href === "/dashboard"
                                        ? pathname === "/dashboard"
                                        : pathname === item.href || pathname.startsWith(`${item.href}/`);

                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            title={collapsed ? item.name : undefined}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
                                                    : "text-[var(--surface-600)] hover:text-[var(--surface-800)] hover:bg-[var(--surface-100)]",
                                                collapsed && "justify-center px-0"
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "w-5 h-5 flex-shrink-0",
                                                    isActive
                                                        ? "text-[var(--primary)]"
                                                        : "text-[var(--surface-500)]"
                                                )}
                                            />
                                            {!collapsed && item.name}
                                            {!collapsed && isActive && (
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

            {/* ── Footer ── */}
            <div className="border-t border-[var(--surface-300)]">
                {/* Plan Badge */}
                {!collapsed && license && (
                    <div className="px-4 pt-4">
                        <div
                            className="px-4 py-3 rounded-xl border transition-all"
                            style={{
                                backgroundColor: `color-mix(in srgb, ${planColor} 8%, transparent)`,
                                borderColor: `color-mix(in srgb, ${planColor} 20%, transparent)`,
                            }}
                        >
                            <p className="text-xs text-[var(--surface-500)]">Current Plan</p>
                            <p
                                className="text-sm font-bold capitalize"
                                style={{ color: planColor }}
                            >
                                {license.plan_name}
                            </p>
                            {license.plan_id === "free" && (
                                <Link
                                    href="/dashboard/billing"
                                    className="text-xs font-medium hover:underline mt-1 inline-block"
                                    style={{ color: "var(--primary)" }}
                                >
                                    Upgrade →
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Theme Switcher */}
                {!collapsed && (
                    <div className="flex items-center justify-between px-6 py-3">
                        <span className="text-xs text-[var(--surface-500)]">Theme</span>
                        <ThemeSwitcher />
                    </div>
                )}

                {/* Help */}
                <div className="px-3 pb-1">
                    <Link
                        href="/support"
                        title={collapsed ? "Help & Support" : undefined}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--surface-600)] hover:text-[var(--surface-800)] hover:bg-[var(--surface-100)] transition-colors",
                            collapsed && "justify-center px-0"
                        )}
                    >
                        <HelpCircle className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && "Help & Support"}
                    </Link>
                </div>

                {/* User Profile + Logout */}
                <div className="px-3 pb-4">
                    <div
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 mb-1",
                            collapsed && "justify-center px-0"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                                {(user.name || user.email || "U").charAt(0).toUpperCase()}
                            </span>
                        </div>
                        {!collapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-[var(--surface-800)] truncate">
                                    {user.name || "User"}
                                </p>
                                <p className="text-xs text-[var(--surface-500)] truncate">
                                    {user.email}
                                </p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        title={collapsed ? "Sign Out" : undefined}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all",
                            "text-[var(--surface-600)] hover:text-[var(--error)] hover:bg-[var(--error)]/10",
                            collapsed && "justify-center px-0"
                        )}
                    >
                        {loggingOut ? (
                            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                        ) : (
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                        )}
                        {!collapsed && (loggingOut ? "Signing out..." : "Sign Out")}
                    </button>
                </div>
            </div>
        </aside>
    );
}
