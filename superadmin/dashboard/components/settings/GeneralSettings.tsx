"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Save,
    Globe,
    Mail,
    CheckCircle,
    AlertCircle,
    Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface PlatformSetting {
    key: string;
    value: string;
    category: string;
    description: string | null;
    is_sensitive: boolean;
    has_value?: boolean;
    updated_at: string | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function parseSettingValue(raw: string | null | undefined): string {
    if (!raw) return "";
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed === "string" ? parsed : String(parsed);
    } catch {
        return String(raw);
    }
}

function parseBoolSetting(raw: string | null | undefined): boolean {
    if (!raw) return false;
    try {
        return JSON.parse(raw) === true || raw === "true";
    } catch {
        return raw === "true";
    }
}

function getToken(): string {
    return localStorage.getItem("oraya-superadmin-token") || "";
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function GeneralSettings() {
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const [platformName, setPlatformName] = useState("Oraya");
    const [supportEmail, setSupportEmail] = useState("support@oraya.ai");
    const [websiteUrl, setWebsiteUrl] = useState("https://oraya.ai");
    const [appUrl, setAppUrl] = useState("http://localhost:3000");
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [signupsEnabled, setSignupsEnabled] = useState(true);
    const [requireEmailVerification, setRequireEmailVerification] = useState(true);

    // ── Load ──
    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            // Load general + system + branding + support categories
            const [genRes, sysRes, brandRes, supRes] = await Promise.all([
                fetch("/api/superadmin/settings?category=general", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/superadmin/settings?category=system", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/superadmin/settings?category=branding", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/superadmin/settings?category=support", { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const merge = async (res: Response) => {
                if (!res.ok) return [];
                const { settings } = await res.json() as { settings: PlatformSetting[] };
                return settings || [];
            };

            const all = [
                ...(await merge(genRes)),
                ...(await merge(sysRes)),
                ...(await merge(brandRes)),
                ...(await merge(supRes)),
            ];

            const lookup = new Map<string, PlatformSetting>();
            all.forEach((s) => lookup.set(s.key, s));

            // Map settings to state
            const pn = lookup.get("platform.name");
            if (pn) setPlatformName(parseSettingValue(pn.value));

            const se = lookup.get("support.email");
            if (se) setSupportEmail(parseSettingValue(se.value));

            const wu = lookup.get("platform.website_url");
            if (wu) setWebsiteUrl(parseSettingValue(wu.value));

            const au = lookup.get("platform.app_url");
            if (au) setAppUrl(parseSettingValue(au.value));

            const mm = lookup.get("platform.maintenance_mode");
            if (mm) setMaintenanceMode(parseBoolSetting(mm.value));

            const ns = lookup.get("platform.new_signups_enabled");
            if (ns) setSignupsEnabled(parseBoolSetting(ns.value));

            const ev = lookup.get("platform.require_email_verification");
            if (ev) setRequireEmailVerification(parseBoolSetting(ev.value));
        } catch (err) {
            console.error("Failed to load general settings:", err);
            setErrorMessage("Failed to load settings from database");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSettings(); }, [loadSettings]);

    // ── Save ──
    const handleSave = async () => {
        setSaveStatus("saving");
        setErrorMessage("");

        try {
            const token = getToken();

            const settings = [
                { key: "platform.name", value: platformName, category: "branding", description: "Platform name" },
                { key: "support.email", value: supportEmail, category: "support", description: "Support email address" },
                { key: "platform.website_url", value: websiteUrl, category: "general", description: "Platform website URL" },
                { key: "platform.app_url", value: appUrl, category: "general", description: "Application URL for redirects" },
                { key: "platform.maintenance_mode", value: maintenanceMode, category: "system", description: "Enable maintenance mode" },
                { key: "platform.new_signups_enabled", value: signupsEnabled, category: "system", description: "Allow new user registrations" },
                { key: "platform.require_email_verification", value: requireEmailVerification, category: "system", description: "Require email verification" },
            ];

            const response = await fetch("/api/superadmin/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ settings }),
            });

            if (!response.ok) throw new Error("Failed to save settings");

            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (err) {
            console.error("Failed to save general settings:", err);
            setSaveStatus("error");
            setErrorMessage("Failed to save settings.");
        }
    };

    // ── Render ──
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                <span className="ml-3 text-[var(--surface-600)]">Loading settings...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{errorMessage}</p>
                </div>
            )}

            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <Globe className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--surface-900)]">Platform Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            Platform Name
                        </label>
                        <input
                            type="text"
                            value={platformName}
                            onChange={(e) => setPlatformName(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            <Mail className="w-3.5 h-3.5 inline mr-1" />
                            Support Email
                        </label>
                        <input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            Website URL
                        </label>
                        <input
                            type="url"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--surface-600)] mb-2">
                            Application URL
                        </label>
                        <input
                            type="url"
                            value={appUrl}
                            onChange={(e) => setAppUrl(e.target.value)}
                            placeholder="https://app.oraya.ai"
                            className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)]">
                <h3 className="text-lg font-semibold text-[var(--surface-900)] mb-6">Access Controls</h3>

                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] cursor-pointer hover:bg-[var(--surface-200)] transition-colors">
                        <div>
                            <p className="font-medium text-[var(--surface-900)]">Maintenance Mode</p>
                            <p className="text-sm text-[var(--surface-500)]">Disable access for all non-admin users</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={maintenanceMode}
                            onChange={(e) => setMaintenanceMode(e.target.checked)}
                            className="w-5 h-5 rounded border-[var(--surface-300)] bg-[var(--surface-100)] text-violet-600 focus:ring-violet-500"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] cursor-pointer hover:bg-[var(--surface-200)] transition-colors">
                        <div>
                            <p className="font-medium text-[var(--surface-900)]">New Signups Enabled</p>
                            <p className="text-sm text-[var(--surface-500)]">Allow new users to register</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={signupsEnabled}
                            onChange={(e) => setSignupsEnabled(e.target.checked)}
                            className="w-5 h-5 rounded border-[var(--surface-300)] bg-[var(--surface-100)] text-violet-600 focus:ring-violet-500"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-200)] cursor-pointer hover:bg-[var(--surface-200)] transition-colors">
                        <div>
                            <p className="font-medium text-[var(--surface-900)]">Require Email Verification</p>
                            <p className="text-sm text-[var(--surface-500)]">Users must verify email before access</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={requireEmailVerification}
                            onChange={(e) => setRequireEmailVerification(e.target.checked)}
                            className="w-5 h-5 rounded border-[var(--surface-300)] bg-[var(--surface-100)] text-violet-600 focus:ring-violet-500"
                        />
                    </label>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-[var(--surface-500)]">
                    {saveStatus === "saved" && (
                        <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-4 h-4" /> Settings saved to database
                        </span>
                    )}
                    {saveStatus === "error" && (
                        <span className="flex items-center gap-1 text-red-400">
                            <AlertCircle className="w-4 h-4" /> Failed to save
                        </span>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saveStatus === "saving"}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
                >
                    {saveStatus === "saving" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
