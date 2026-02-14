"use client";

import { useState } from "react";
import { Palette, Check, Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { themeList, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
    variant?: "dropdown" | "panel";
}

export function ThemeSwitcher({ variant = "dropdown" }: ThemeSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { themeId, mode, setTheme, toggleMode } = useThemeStore();

    if (variant === "panel") {
        return (
            <div className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--surface-700)]">Appearance</span>
                    <button
                        onClick={toggleMode}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-200)] border border-[var(--surface-300)] hover:bg-[var(--surface-300)] transition-all"
                    >
                        {mode === 'dark' ? (
                            <><Moon className="w-4 h-4 text-[var(--primary)]" /><span className="text-xs text-[var(--surface-700)]">Dark</span></>
                        ) : (
                            <><Sun className="w-4 h-4 text-[var(--primary)]" /><span className="text-xs text-[var(--surface-700)]">Light</span></>
                        )}
                    </button>
                </div>
                {/* Theme Grid */}
                <div className="grid grid-cols-5 gap-3">
                    {themeList.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => setTheme(theme.id)}
                            className={cn(
                                "relative group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200",
                                themeId === theme.id
                                    ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                                    : "border-[var(--surface-300)] hover:border-[var(--surface-400)] hover:bg-[var(--surface-100)]"
                            )}
                        >
                            <div
                                className="relative w-10 h-10 rounded-full overflow-hidden shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.preview.primary} 0%, ${theme.preview.secondary} 100%)`,
                                    boxShadow: themeId === theme.id
                                        ? `0 0 20px ${theme.preview.primary}40`
                                        : 'none',
                                }}
                            >
                                {themeId === theme.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Check className="w-5 h-5 text-white drop-shadow-lg" />
                                    </div>
                                )}
                            </div>
                            <span className={cn(
                                "text-xs font-medium transition-colors",
                                themeId === theme.id
                                    ? "text-[var(--primary)]"
                                    : "text-[var(--surface-600)] group-hover:text-[var(--surface-800)]"
                            )}>
                                {theme.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Dropdown variant (for header)
    return (
        <div className="relative flex items-center gap-1">
            {/* Dark/Light Toggle */}
            <button
                onClick={toggleMode}
                className="p-2.5 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-600)] hover:text-[var(--surface-800)] hover:bg-[var(--surface-200)] transition-all"
                title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {mode === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Theme Selector */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] hover:bg-[var(--surface-200)] transition-all"
                title="Change Theme"
            >
                <div
                    className="w-5 h-5 rounded-full"
                    style={{
                        background: `linear-gradient(135deg, ${themeList.find(t => t.id === themeId)?.preview.primary} 0%, ${themeList.find(t => t.id === themeId)?.preview.secondary} 100%)`,
                    }}
                />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 p-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] shadow-2xl z-50">
                        <p className="text-xs font-medium text-[var(--surface-600)] mb-3 px-1">
                            Select Theme
                        </p>
                        <div className="space-y-1">
                            {themeList.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        setTheme(theme.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                        themeId === theme.id
                                            ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                                            : "hover:bg-[var(--surface-200)] text-[var(--surface-700)]"
                                    )}
                                >
                                    <div
                                        className="w-7 h-7 rounded-full shrink-0 border-2"
                                        style={{
                                            background: `linear-gradient(135deg, ${theme.preview.primary} 0%, ${theme.preview.secondary} 100%)`,
                                            borderColor: themeId === theme.id ? 'var(--primary)' : 'transparent',
                                            boxShadow: themeId === theme.id
                                                ? `0 0 12px ${theme.preview.primary}50`
                                                : 'none',
                                        }}
                                    />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium">{theme.name}</p>
                                        <p className="text-xs text-[var(--surface-500)] truncate">
                                            {theme.description}
                                        </p>
                                    </div>
                                    {themeId === theme.id && (
                                        <Check className="w-4 h-4 text-[var(--primary)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
