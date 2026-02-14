"use client";

import { useState, useEffect, useCallback } from "react";
import {
    User,
    Mail,
    Building2,
    Globe,
    Save,
    Check,
    Key,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    Shield,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ProfileData {
    id: string;
    email: string;
    full_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
    organization: string | null;
    bio: string | null;
    timezone: string | null;
    locale: string | null;
    referral_code: string | null;
    created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<"profile" | "security" | "appearance" | "danger">("profile");

    // Form state
    const [fullName, setFullName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [organization, setOrganization] = useState("");
    const [bio, setBio] = useState("");
    const [timezone, setTimezone] = useState("");

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/members/profile");
            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
                setFullName(data.profile.full_name || "");
                setDisplayName(data.profile.display_name || "");
                setOrganization(data.profile.organization || "");
                setBio(data.profile.bio || "");
                setTimezone(data.profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch("/api/members/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: fullName,
                    display_name: displayName,
                    organization: organization,
                    bio: bio,
                    timezone: timezone,
                }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error("Failed to save profile:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess(false);

        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }

        setPasswordSaving(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });
            if (res.ok) {
                setPasswordSuccess(true);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => setPasswordSuccess(false), 3000);
            } else {
                const data = await res.json();
                setPasswordError(data.error || "Failed to change password.");
            }
        } catch {
            setPasswordError("Something went wrong. Please try again.");
        } finally {
            setPasswordSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    const sections = [
        { key: "profile" as const, label: "Profile", icon: User },
        { key: "security" as const, label: "Security", icon: Shield },
        { key: "appearance" as const, label: "Appearance", icon: Globe },
        { key: "danger" as const, label: "Danger Zone", icon: AlertTriangle },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            {/* ── Header ── */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--surface-900)] font-display">
                    Settings
                </h1>
                <p className="text-[var(--surface-600)] mt-1">
                    Manage your account settings, security, and preferences.
                </p>
            </div>

            <div className="flex gap-8 flex-col lg:flex-row">
                {/* ── Sidebar Nav ── */}
                <nav className="w-full lg:w-48 flex-shrink-0">
                    <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
                        {sections.map((section) => (
                            <li key={section.key}>
                                <button
                                    onClick={() => setActiveSection(section.key)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all w-full whitespace-nowrap",
                                        activeSection === section.key
                                            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                            : "text-[var(--surface-600)] hover:text-[var(--surface-800)] hover:bg-[var(--surface-100)]",
                                        section.key === "danger" && "text-[var(--error)] hover:text-[var(--error)]"
                                    )}
                                >
                                    <section.icon className="w-4 h-4" />
                                    {section.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* ── Content ── */}
                <div className="flex-1 min-w-0">
                    {/* Profile Section */}
                    {activeSection === "profile" && (
                        <form onSubmit={handleSaveProfile}>
                            <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                                <h2 className="text-lg font-semibold text-[var(--surface-800)] mb-6">
                                    Profile Information
                                </h2>

                                <div className="space-y-5">
                                    {/* Email (read-only) */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            Email
                                        </label>
                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-200)] text-[var(--surface-500)]">
                                            <Mail className="w-4 h-4" />
                                            <span className="text-sm">{profile?.email}</span>
                                        </div>
                                    </div>

                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your full name"
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 text-sm transition-all"
                                        />
                                    </div>

                                    {/* Display Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="How you want to be addressed"
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 text-sm transition-all"
                                        />
                                    </div>

                                    {/* Organization */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            Organization
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                                            <input
                                                type="text"
                                                value={organization}
                                                onChange={(e) => setOrganization(e.target.value)}
                                                placeholder="Company or team name"
                                                className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 text-sm transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            Bio
                                        </label>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Tell us about yourself..."
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 text-sm transition-all resize-none"
                                        />
                                    </div>

                                    {/* Timezone */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                            Timezone
                                        </label>
                                        <select
                                            value={timezone}
                                            onChange={(e) => setTimezone(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 text-sm"
                                        >
                                            {Intl.supportedValuesOf("timeZone").map((tz) => (
                                                <option key={tz} value={tz}>
                                                    {tz}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Referral Code (read-only) */}
                                    {profile?.referral_code && (
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                                Your Referral Code
                                            </label>
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-200)] text-[var(--surface-600)]">
                                                <Key className="w-4 h-4" />
                                                <span className="text-sm font-mono">{profile.referral_code}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Save Button */}
                                <div className="mt-6 flex items-center justify-end gap-3">
                                    {saved && (
                                        <span className="flex items-center gap-1 text-sm text-[var(--success)]">
                                            <Check className="w-4 h-4" />
                                            Saved
                                        </span>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Security Section */}
                    {activeSection === "security" && (
                        <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                            <h2 className="text-lg font-semibold text-[var(--surface-800)] mb-6">
                                Change Password
                            </h2>
                            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-400)]" />
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-10 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--surface-400)]"
                                        >
                                            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                        New Password
                                    </label>
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="w-full px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--surface-700)] mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type={showPasswords ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-[var(--surface-100)] rounded-xl border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 text-sm"
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-sm text-[var(--error)]">{passwordError}</p>
                                )}
                                {passwordSuccess && (
                                    <p className="flex items-center gap-1 text-sm text-[var(--success)]">
                                        <Check className="w-4 h-4" />
                                        Password changed successfully
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={passwordSaving}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {passwordSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Lock className="w-4 h-4" />
                                    )}
                                    {passwordSaving ? "Changing..." : "Change Password"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Appearance Section */}
                    {activeSection === "appearance" && (
                        <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)]">
                            <h2 className="text-lg font-semibold text-[var(--surface-800)] mb-6">
                                Appearance
                            </h2>
                            <ThemeSwitcher variant="panel" />
                        </div>
                    )}

                    {/* Danger Zone */}
                    {activeSection === "danger" && (
                        <div className="p-6 rounded-2xl bg-[var(--surface-50)] border border-[var(--error)]/30">
                            <h2 className="text-lg font-semibold text-[var(--error)] mb-2">
                                Danger Zone
                            </h2>
                            <p className="text-sm text-[var(--surface-600)] mb-6">
                                These actions are permanent and cannot be undone.
                            </p>
                            <div className="p-4 rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-[var(--surface-800)]">
                                            Delete Account
                                        </p>
                                        <p className="text-xs text-[var(--surface-500)] mt-0.5">
                                            Permanently delete your account, all data, agents, and revoke all licenses.
                                        </p>
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--error)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
