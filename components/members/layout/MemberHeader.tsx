"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    User,
    LogOut,
    Settings,
    ChevronDown,
    Search,
    X,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UserData {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
}

interface TokenInfo {
    balance: number;
    currency: string;
}

interface MemberHeaderProps {
    user: UserData;
    tokens?: TokenInfo | null;
    collapsed?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function MemberHeader({ user, tokens, collapsed }: MemberHeaderProps) {
    const router = useRouter();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (showSearch && searchRef.current) {
            searchRef.current.focus();
        }
    }, [showSearch]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
    };

    const formatTokenBalance = (balance: number): string => {
        if (balance >= 1000000) return `${(balance / 1000000).toFixed(1)}M`;
        if (balance >= 1000) return `${(balance / 1000).toFixed(0)}K`;
        return balance.toLocaleString();
    };

    return (
        <header
            className={cn(
                "h-[var(--header-height)] border-b border-[var(--surface-300)] bg-[var(--surface-50)]/80 backdrop-blur-lg flex items-center justify-between px-6 z-30 sticky top-0",
                collapsed ? "ml-20" : "ml-[var(--sidebar-width)]"
            )}
            style={{ transition: "margin-left 0.3s" }}
        >
            {/* ── Left: Search ── */}
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search documentation, settings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-800)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 text-sm transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--surface-400)] hover:text-[var(--surface-600)]"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Right: Tokens + Notifications + User ── */}
            <div className="flex items-center gap-3">
                {/* Token Balance */}
                {tokens && (
                    <button
                        onClick={() => router.push("/dashboard/tokens")}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] hover:bg-[var(--surface-200)] transition-all"
                    >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">T</span>
                        </div>
                        <span className="text-sm font-semibold text-[var(--surface-800)]">
                            {formatTokenBalance(tokens.balance)}
                        </span>
                    </button>
                )}

                {/* Desktop App Link */}
                <a
                    href="oraya://open"
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--surface-500)] hover:text-[var(--surface-700)] hover:bg-[var(--surface-100)] border border-[var(--surface-300)] transition-all"
                    title="Open Oraya Desktop"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open App
                </a>

                {/* Notifications */}
                <button className="relative p-2 rounded-xl hover:bg-[var(--surface-100)] text-[var(--surface-500)] hover:text-[var(--surface-700)] transition-colors">
                    <Bell className="w-5 h-5" />
                    {/* Notification dot */}
                    {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--error)]" /> */}
                </button>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface-100)] transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.name || "User"}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-sm font-bold text-white">
                                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="text-left hidden lg:block">
                            <p className="text-sm font-medium text-[var(--surface-800)] leading-tight">
                                {user.name || "User"}
                            </p>
                            <p className="text-xs text-[var(--surface-500)]">{user.email}</p>
                        </div>
                        <ChevronDown
                            className={cn(
                                "w-4 h-4 text-[var(--surface-400)] transition-transform hidden lg:block",
                                showUserMenu && "rotate-180"
                            )}
                        />
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-300)] shadow-xl shadow-[var(--surface-900)]/10 z-50 overflow-hidden">
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-[var(--surface-200)]">
                                <p className="text-sm font-medium text-[var(--surface-800)]">
                                    {user.name || "User"}
                                </p>
                                <p className="text-xs text-[var(--surface-500)]">{user.email}</p>
                            </div>
                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        router.push("/dashboard/settings");
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--surface-700)] hover:bg-[var(--surface-100)] transition-colors text-left text-sm"
                                >
                                    <User className="w-4 h-4" />
                                    Profile
                                </button>
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        router.push("/dashboard/settings");
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--surface-700)] hover:bg-[var(--surface-100)] transition-colors text-left text-sm"
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </button>
                                <div className="my-1 border-t border-[var(--surface-200)]" />
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        handleLogout();
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors text-left text-sm"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
