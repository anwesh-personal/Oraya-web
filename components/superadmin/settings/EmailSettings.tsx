"use client";

import { useState, useEffect } from "react";
import { Mail, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface SmtpField {
    key: string;
    label: string;
    type: "text" | "number" | "password" | "email" | "toggle";
    placeholder: string;
    description: string;
    sensitive?: boolean;
}

const SMTP_FIELDS: SmtpField[] = [
    {
        key: "smtp_enabled",
        label: "Enable Custom SMTP",
        type: "toggle",
        placeholder: "",
        description: "When disabled, emails are sent through Supabase's built-in email provider.",
    },
    {
        key: "smtp_host",
        label: "SMTP Host",
        type: "text",
        placeholder: "smtp.gmail.com",
        description: "The hostname of your SMTP server.",
    },
    {
        key: "smtp_port",
        label: "SMTP Port",
        type: "number",
        placeholder: "587",
        description: "Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted).",
    },
    {
        key: "smtp_user",
        label: "SMTP Username",
        type: "text",
        placeholder: "noreply@yourdomain.com",
        description: "Usually your email address or app-specific username.",
    },
    {
        key: "smtp_pass",
        label: "SMTP Password",
        type: "password",
        placeholder: "••••••••",
        description: "App password or API key for authentication.",
        sensitive: true,
    },
    {
        key: "smtp_from",
        label: "From Email",
        type: "email",
        placeholder: '"Oraya" <noreply@yourdomain.com>',
        description: 'The sender address and display name, e.g. "Oraya" <noreply@oraya.ai>',
    },
];

export function EmailSettings() {
    const [values, setValues] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testEmail, setTestEmail] = useState("");

    // Fetch current SMTP settings
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/superadmin/settings?category=email");
            if (res.ok) {
                const data = await res.json();
                const settingsMap: Record<string, string> = {};
                (data.settings || []).forEach((s: any) => {
                    try {
                        settingsMap[s.key] = JSON.parse(s.value);
                    } catch {
                        settingsMap[s.key] = s.value;
                    }
                });
                setValues(settingsMap);
            }
        } catch {
            toast.error("Failed to load email settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleToggle = (key: string) => {
        const current = values[key];
        const newVal = current === "true" ? "false" : "true";
        setValues((prev) => ({ ...prev, [key]: newVal }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settings = SMTP_FIELDS.map((field) => ({
                key: field.key,
                value: values[field.key] || "",
                category: "email",
                description: field.description,
                is_sensitive: field.sensitive || false,
            }));

            const res = await fetch("/api/superadmin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings }),
            });

            if (res.ok) {
                toast.success("SMTP settings saved");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to save settings");
            }
        } catch {
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            toast.error("Enter a test email address");
            return;
        }
        setIsTesting(true);
        try {
            const res = await fetch("/api/superadmin/email/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to: testEmail }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Test email sent to ${testEmail}`);
            } else {
                toast.error(data.error || "Failed to send test email");
            }
        } catch {
            toast.error("Failed to send test email");
        } finally {
            setIsTesting(false);
        }
    };

    const smtpEnabled = values.smtp_enabled === "true";

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-[var(--surface-900)]">Email Configuration</p>
                    <p className="text-xs text-[var(--surface-600)] mt-1">
                        By default, Oraya uses Supabase&apos;s built-in email service for password resets and notifications.
                        Configure a custom SMTP server below for production use (recommended for better deliverability).
                    </p>
                </div>
            </div>

            {/* Settings Card */}
            <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)] overflow-hidden">
                {SMTP_FIELDS.map((field, index) => {
                    if (field.type === "toggle") {
                        return (
                            <div key={field.key} className={`p-4 sm:p-5 flex items-center justify-between gap-4 ${index > 0 ? "border-t border-[var(--surface-200)]" : ""}`}>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-[var(--surface-900)]">{field.label}</p>
                                    <p className="text-xs text-[var(--surface-500)] mt-0.5">{field.description}</p>
                                </div>
                                <button
                                    onClick={() => handleToggle(field.key)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${smtpEnabled ? "bg-[var(--primary)]" : "bg-[var(--surface-300)]"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${smtpEnabled ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={field.key}
                            className={`p-4 sm:p-5 ${index > 0 ? "border-t border-[var(--surface-200)]" : ""} ${!smtpEnabled && field.key !== "smtp_enabled" ? "opacity-50 pointer-events-none" : ""}`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                                <div className="sm:w-48 shrink-0">
                                    <label className="text-sm font-medium text-[var(--surface-700)]">{field.label}</label>
                                    <p className="text-xs text-[var(--surface-500)] mt-0.5 hidden sm:block">{field.description}</p>
                                </div>
                                <div className="flex-1">
                                    {field.type === "password" ? (
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={values[field.key] || ""}
                                                onChange={(e) => handleChange(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--surface-500)] hover:text-[var(--surface-700)]"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type}
                                            value={values[field.key] || ""}
                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                                        />
                                    )}
                                    <p className="text-xs text-[var(--surface-500)] mt-1 sm:hidden">{field.description}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Save Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50 shadow-lg"
                    style={{ background: 'var(--gradient-primary)' }}
                >
                    {isSaving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                        <><CheckCircle className="w-4 h-4" /> Save SMTP Settings</>
                    )}
                </button>
            </div>

            {/* Test Email Section */}
            {smtpEnabled && (
                <div className="rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-200)] p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Send className="w-4 h-4 text-[var(--surface-500)]" />
                        <p className="text-sm font-medium text-[var(--surface-900)]">Test Email</p>
                    </div>
                    <p className="text-xs text-[var(--surface-500)] mb-3">Send a test email to verify your SMTP configuration is working correctly.</p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="test@example.com"
                            className="flex-1 px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                        />
                        <button
                            onClick={handleTestEmail}
                            disabled={isTesting || !testEmail}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--surface-300)] text-sm font-medium text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-all disabled:opacity-50"
                        >
                            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send Test
                        </button>
                    </div>
                </div>
            )}

            {/* Supabase Default Note */}
            {!smtpEnabled && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-[var(--surface-900)]">Using Supabase Email</p>
                        <p className="text-xs text-[var(--surface-600)] mt-1">
                            Password reset emails and notifications will be sent through Supabase&apos;s built-in SMTP.
                            This is fine for development but has rate limits. For production, we recommend configuring a custom SMTP provider
                            like SendGrid, Mailgun, or AWS SES.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
