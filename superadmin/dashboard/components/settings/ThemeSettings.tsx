"use client";

import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { useThemeStore } from "@/stores/theme-store";
import { themes } from "@/lib/themes";
import { Palette, Sparkles, Eye } from "lucide-react";

export function ThemeSettings() {
    const { themeId } = useThemeStore();
    const currentTheme = themes[themeId];

    return (
        <div className="space-y-6">
            {/* Theme Selection Panel */}
            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-[var(--primary)]/10">
                        <Palette className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--surface-900)]">Theme Selection</h3>
                        <p className="text-sm text-[var(--surface-600)]">Choose from 5 premium themes</p>
                    </div>
                </div>

                <ThemeSwitcher variant="panel" />
            </div>

            {/* Current Theme Preview */}
            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-[var(--secondary)]/10">
                        <Eye className="w-5 h-5 text-[var(--secondary)]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--surface-900)]">Current Theme Preview</h3>
                        <p className="text-sm text-[var(--surface-600)]">{currentTheme.name} - {currentTheme.description}</p>
                    </div>
                </div>

                {/* Color Palette Preview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-[var(--surface-500)]">Primary</p>
                        <div
                            className="h-12 rounded-xl shadow-lg"
                            style={{
                                background: 'var(--gradient-primary)',
                                boxShadow: '0 4px 20px -4px var(--primary-glow)'
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-[var(--surface-500)]">Secondary</p>
                        <div
                            className="h-12 rounded-xl shadow-lg"
                            style={{
                                background: 'var(--gradient-secondary)',
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-[var(--surface-500)]">Accent</p>
                        <div
                            className="h-12 rounded-xl shadow-lg"
                            style={{
                                background: 'var(--gradient-accent)',
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-[var(--surface-500)]">Surfaces</p>
                        <div className="h-12 rounded-xl flex overflow-hidden border border-[var(--surface-300)]">
                            <div className="flex-1" style={{ background: 'var(--surface-100)' }} />
                            <div className="flex-1" style={{ background: 'var(--surface-200)' }} />
                            <div className="flex-1" style={{ background: 'var(--surface-300)' }} />
                            <div className="flex-1" style={{ background: 'var(--surface-400)' }} />
                        </div>
                    </div>
                </div>

                {/* Status Colors */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(var(--success), 0.1)' }}>
                        <div
                            className="w-6 h-6 rounded-full mx-auto mb-2"
                            style={{
                                background: 'var(--success)',
                                boxShadow: '0 0 12px var(--success-glow)'
                            }}
                        />
                        <p className="text-xs text-[var(--success)]">Success</p>
                    </div>
                    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(var(--warning), 0.1)' }}>
                        <div
                            className="w-6 h-6 rounded-full mx-auto mb-2"
                            style={{
                                background: 'var(--warning)',
                                boxShadow: '0 0 12px var(--warning-glow)'
                            }}
                        />
                        <p className="text-xs text-[var(--warning)]">Warning</p>
                    </div>
                    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(var(--error), 0.1)' }}>
                        <div
                            className="w-6 h-6 rounded-full mx-auto mb-2"
                            style={{
                                background: 'var(--error)',
                                boxShadow: '0 0 12px var(--error-glow)'
                            }}
                        />
                        <p className="text-xs text-[var(--error)]">Error</p>
                    </div>
                    <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(var(--info), 0.1)' }}>
                        <div
                            className="w-6 h-6 rounded-full mx-auto mb-2"
                            style={{
                                background: 'var(--info)',
                                boxShadow: '0 0 12px var(--info-glow)'
                            }}
                        />
                        <p className="text-xs text-[var(--info)]">Info</p>
                    </div>
                </div>
            </div>

            {/* Sample UI Components */}
            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl bg-[var(--success)]/10">
                        <Sparkles className="w-5 h-5 text-[var(--success)]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--surface-900)]">Component Preview</h3>
                        <p className="text-sm text-[var(--surface-600)]">See how UI elements look in this theme</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Buttons */}
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-[var(--surface-500)]">Buttons</p>
                        <button
                            className="w-full px-4 py-2.5 rounded-xl text-white font-medium transition-all hover:opacity-90"
                            style={{ background: 'var(--gradient-primary)' }}
                        >
                            Primary Button
                        </button>
                        <button className="w-full px-4 py-2.5 rounded-xl font-medium border border-[var(--surface-300)] text-[var(--surface-700)] hover:bg-[var(--surface-100)] transition-all">
                            Secondary Button
                        </button>
                    </div>

                    {/* Input */}
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-[var(--surface-500)]">Input</p>
                        <input
                            type="text"
                            placeholder="Enter text..."
                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="w-4 h-4 rounded" />
                            <span className="text-sm text-[var(--surface-700)]">Checkbox option</span>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-[var(--surface-500)]">Card</p>
                        <div className="p-4 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)]">
                            <p className="text-sm font-medium text-[var(--surface-800)]">Card Title</p>
                            <p className="text-xs text-[var(--surface-600)] mt-1">Card description text</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
