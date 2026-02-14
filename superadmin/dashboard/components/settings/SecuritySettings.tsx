"use client";

import { useState } from "react";
import { Save, Shield, Key, Lock, AlertTriangle } from "lucide-react";

export function SecuritySettings() {
    const [settings, setSettings] = useState({
        jwtSecret: "",
        jwtExpiryHours: 24,
        requireMfa: false,
        allowedOrigins: "https://oraya.ai",
        rateLimitPerMinute: 60,
        rateLimitPerHour: 1000,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 30,
        sessionTimeoutMinutes: 60,
        requireSecurePasswords: true,
        minPasswordLength: 8,
    });

    const handleSave = () => {
        console.log("Saving security settings:", settings);
    };

    return (
        <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-6">JWT Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            JWT Secret
                        </label>
                        <input
                            type="password"
                            value={settings.jwtSecret}
                            onChange={(e) => setSettings({ ...settings, jwtSecret: e.target.value })}
                            placeholder="Enter your JWT secret"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-2">Keep this secret. Never expose in client-side code.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Token Expiry (hours)
                        </label>
                        <input
                            type="number"
                            value={settings.jwtExpiryHours}
                            onChange={(e) => setSettings({ ...settings, jwtExpiryHours: parseInt(e.target.value) })}
                            min="1"
                            max="720"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Session Timeout (minutes)
                        </label>
                        <input
                            type="number"
                            value={settings.sessionTimeoutMinutes}
                            onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) })}
                            min="5"
                            max="1440"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-6">Rate Limiting</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Requests per Minute
                        </label>
                        <input
                            type="number"
                            value={settings.rateLimitPerMinute}
                            onChange={(e) => setSettings({ ...settings, rateLimitPerMinute: parseInt(e.target.value) })}
                            min="10"
                            max="1000"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Requests per Hour
                        </label>
                        <input
                            type="number"
                            value={settings.rateLimitPerHour}
                            onChange={(e) => setSettings({ ...settings, rateLimitPerHour: parseInt(e.target.value) })}
                            min="100"
                            max="10000"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Allowed Origins (CORS)
                        </label>
                        <input
                            type="text"
                            value={settings.allowedOrigins}
                            onChange={(e) => setSettings({ ...settings, allowedOrigins: e.target.value })}
                            placeholder="https://oraya.ai, https://app.oraya.ai"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                        <p className="text-xs text-gray-500 mt-2">Comma-separated list of allowed origins</p>
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-6">Login Security</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Max Login Attempts
                        </label>
                        <input
                            type="number"
                            value={settings.maxLoginAttempts}
                            onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                            min="3"
                            max="10"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Lockout Duration (minutes)
                        </label>
                        <input
                            type="number"
                            value={settings.lockoutDurationMinutes}
                            onChange={(e) => setSettings({ ...settings, lockoutDurationMinutes: parseInt(e.target.value) })}
                            min="5"
                            max="1440"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Minimum Password Length
                        </label>
                        <input
                            type="number"
                            value={settings.minPasswordLength}
                            onChange={(e) => setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) })}
                            min="6"
                            max="32"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <div>
                            <p className="font-medium text-white">Require MFA for Admins</p>
                            <p className="text-sm text-gray-400">Force multi-factor authentication for all admin accounts</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.requireMfa}
                            onChange={(e) => setSettings({ ...settings, requireMfa: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <div>
                            <p className="font-medium text-white">Require Secure Passwords</p>
                            <p className="text-sm text-gray-400">Enforce uppercase, lowercase, numbers, and special characters</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.requireSecurePasswords}
                            onChange={(e) => setSettings({ ...settings, requireSecurePasswords: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
                        />
                    </label>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
                >
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>
        </div>
    );
}
