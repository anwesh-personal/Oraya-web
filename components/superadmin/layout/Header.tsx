"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    Search,
    ChevronDown,
    LogOut,
    Settings,
    User,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

interface HeaderProps {
    session: SessionPayload;
}

export function Header({ session }: HeaderProps) {
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogout = async () => {
        await fetch("/api/superadmin/auth/logout", { method: "POST" });
        router.push("/superadmin/login");
        router.refresh();
    };

    return (
        <header className="fixed top-0 right-0 left-[var(--sidebar-width)] h-[var(--header-height)] bg-surface-50/80 backdrop-blur-xl border-b border-surface-300 z-30">
            <div className="h-full px-6 flex items-center justify-between">
                {/* Search */}
                <div className="flex-1 max-w-xl">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                        <input
                            type="text"
                            placeholder="Search users, organizations, agents..."
                            className="w-full pl-12 pr-4 py-2.5 bg-surface-100 border border-surface-300 rounded-xl text-sm text-surface-800 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        />
                        <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-surface-500 bg-surface-200 rounded border border-surface-300">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 ml-6">
                    {/* Theme Switcher */}
                    <ThemeSwitcher variant="dropdown" />

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2.5 rounded-xl bg-surface-100 border border-surface-300 text-surface-600 hover:text-surface-800 hover:bg-surface-200 transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
                        </button>

                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-80 bg-surface-100 border border-surface-300 rounded-xl shadow-2xl z-50">
                                    <div className="p-4 border-b border-surface-300">
                                        <h3 className="font-semibold text-surface-900">Notifications</h3>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-surface-500 text-center py-8">
                                            No new notifications
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-surface-300" />

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-surface-100 border border-surface-300 hover:bg-surface-200 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                                <span className="text-sm font-semibold text-white">
                                    {getInitials(session.email.split("@")[0])}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-surface-800 hidden sm:block">
                                {session.email.split("@")[0]}
                            </span>
                            <ChevronDown className="w-4 h-4 text-surface-500" />
                        </button>

                        {showDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowDropdown(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-56 bg-surface-100 border border-surface-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                                    <div className="p-3 border-b border-surface-300">
                                        <p className="text-sm font-medium text-surface-900 truncate">
                                            {session.email}
                                        </p>
                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                                            {session.role}
                                        </span>
                                    </div>

                                    <div className="p-2">
                                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-surface-700 hover:bg-surface-200 rounded-lg transition-colors">
                                            <User className="w-4 h-4" />
                                            Profile
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-surface-700 hover:bg-surface-200 rounded-lg transition-colors">
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </button>
                                    </div>

                                    <div className="p-2 border-t border-surface-300">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
