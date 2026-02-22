"use client";

import { useState } from "react";
import { Bell, Search, User, LogOut, Settings, ChevronDown } from "lucide-react";

export function MemberHeader() {
    const [showUserMenu, setShowUserMenu] = useState(false);

    return (
        <header className="sticky top-0 z-20 shrink-0 h-16 border-b border-[var(--surface-300)] bg-[var(--surface-50)]/80 backdrop-blur-xl flex items-center justify-between px-6">
            {/* Search */}
            <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                <input
                    type="text"
                    placeholder="Search agents, conversations..."
                    className="w-full pl-10 pr-4 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
                />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 rounded-xl hover:bg-[var(--surface-100)] text-[var(--surface-500)] hover:text-[var(--surface-800)] transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--primary)]" />
                </button>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface-100)] transition-colors"
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--gradient-primary)' }}
                        >
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-medium text-[var(--surface-900)]">John Doe</p>
                            <p className="text-xs text-[var(--surface-500)]">john@example.com</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-[var(--surface-500)]" />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-200)] shadow-xl z-50">
                            <div className="p-2">
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--surface-600)] hover:bg-[var(--surface-100)] transition-colors text-left">
                                    <User className="w-4 h-4" />
                                    Profile
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--surface-600)] hover:bg-[var(--surface-100)] transition-colors text-left">
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </button>
                                <div className="my-2 border-t border-[var(--surface-200)]" />
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors text-left">
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
