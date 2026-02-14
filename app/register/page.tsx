"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Loader2,
    Lock,
    Mail,
    Eye,
    EyeOff,
    AlertCircle,
    ArrowRight,
    User,
    Building2,
    CheckCircle2,
    Check,
} from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [organization, setOrganization] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Password strength
    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };
    const passedChecks = Object.values(passwordChecks).filter(Boolean).length;
    const strengthLabel =
        passedChecks <= 2 ? "Weak" : passedChecks <= 3 ? "Fair" : passedChecks <= 4 ? "Good" : "Strong";
    const strengthColor =
        passedChecks <= 2
            ? "var(--error)"
            : passedChecks <= 3
                ? "var(--warning)"
                : passedChecks <= 4
                    ? "var(--info)"
                    : "var(--success)";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (passedChecks < 3) {
            setError("Password is too weak");
            return;
        }

        if (!agreedToTerms) {
            setError("You must agree to the Terms of Service");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name, organization }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            if (data.needsEmailConfirmation) {
                setSuccess(true);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Success state — email confirmation needed
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--surface-0)] p-4">
                <div className="w-full max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--success)]/10 mb-6">
                        <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--surface-900)] mb-3">Check your email</h1>
                    <p className="text-[var(--surface-600)] mb-8">
                        We've sent a verification link to <strong className="text-[var(--surface-800)]">{email}</strong>.
                        Click the link to activate your account.
                    </p>
                    <div className="p-4 rounded-xl bg-[var(--surface-50)] border border-[var(--surface-300)] text-sm text-[var(--surface-600)] mb-6">
                        Didn't get it? Check your spam folder, or{" "}
                        <button
                            onClick={() => setSuccess(false)}
                            className="text-[var(--primary)] font-medium hover:underline"
                        >
                            try again with a different email
                        </button>
                    </div>
                    <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[var(--surface-0)]">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/90 to-[var(--secondary)]">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 border border-white rounded-full" />
                    <div className="absolute bottom-40 right-10 w-96 h-96 border border-white rounded-full" />
                    <div className="absolute top-1/2 left-1/3 w-48 h-48 border border-white rounded-full" />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    <div>
                        <div className="flex items-center gap-3 mb-20">
                            <Image
                                src="/logos/oraya-light.png"
                                alt="Oraya"
                                width={48}
                                height={48}
                                className="w-12 h-12"
                            />
                            <span className="text-2xl font-bold">Oraya</span>
                        </div>

                        <h1 className="text-5xl font-bold leading-tight mb-6">
                            Start building<br />
                            in minutes.<br />
                            No limits.
                        </h1>
                        <p className="text-xl text-white/80 max-w-md">
                            Create AI agents, automate workflows, and scale your operations
                            with the most powerful AI platform.
                        </p>
                    </div>

                    <div className="space-y-4 text-white/80">
                        <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-white/60" />
                            <span>Free tier with 10,000 AI calls/month</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-white/60" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-white/60" />
                            <span>Deploy agents in under 5 minutes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Register Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Image
                            src="/logos/oraya-dark.png"
                            alt="Oraya"
                            width={56}
                            height={56}
                            className="w-14 h-14 mx-auto mb-4"
                        />
                        <h1 className="text-xl font-bold text-[var(--surface-900)]">Oraya</h1>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-[var(--surface-900)]">Create your account</h2>
                        <p className="text-[var(--surface-600)] mt-2">
                            Get started with Oraya for free
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)]">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Name */}
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="block text-sm font-medium text-[var(--surface-700)]">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--surface-400)]" />
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoComplete="name"
                                    placeholder="John Doe"
                                    className="w-full pl-12 pr-4 py-3 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-[var(--surface-700)]">
                                Work Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--surface-400)]" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    placeholder="you@company.com"
                                    className="w-full pl-12 pr-4 py-3 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Organization (optional) */}
                        <div className="space-y-1.5">
                            <label htmlFor="org" className="block text-sm font-medium text-[var(--surface-700)]">
                                Organization <span className="text-[var(--surface-500)] font-normal">(optional)</span>
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--surface-400)]" />
                                <input
                                    id="org"
                                    type="text"
                                    value={organization}
                                    onChange={(e) => setOrganization(e.target.value)}
                                    autoComplete="organization"
                                    placeholder="Acme Corp"
                                    className="w-full pl-12 pr-4 py-3 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium text-[var(--surface-700)]">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--surface-400)]" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-3 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--surface-400)] hover:text-[var(--surface-600)]"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {password.length > 0 && (
                                <div className="space-y-2 pt-1">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                                                style={{
                                                    backgroundColor:
                                                        i <= passedChecks ? strengthColor : "var(--surface-300)",
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs" style={{ color: strengthColor }}>
                                        {strengthLabel} password
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="confirm" className="block text-sm font-medium text-[var(--surface-700)]">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--surface-400)]" />
                                <input
                                    id="confirm"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className={`w-full pl-12 pr-12 py-3 bg-[var(--surface-50)] border rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:ring-2 transition-all ${confirmPassword && confirmPassword !== password
                                            ? "border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20"
                                            : confirmPassword && confirmPassword === password
                                                ? "border-[var(--success)] focus:border-[var(--success)] focus:ring-[var(--success)]/20"
                                                : "border-[var(--surface-300)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                                        }`}
                                />
                                {confirmPassword && confirmPassword === password && (
                                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--success)]" />
                                )}
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3 pt-1">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-[var(--surface-400)] text-[var(--primary)] focus:ring-[var(--primary)]"
                            />
                            <label htmlFor="terms" className="text-sm text-[var(--surface-600)]">
                                I agree to the{" "}
                                <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms of Service</Link>
                                {" "}and{" "}
                                <Link href="/privacy" className="text-[var(--primary)] hover:underline">Privacy Policy</Link>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !agreedToTerms}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-white font-semibold rounded-xl shadow-lg shadow-[var(--primary)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[var(--surface-600)]">
                            Already have an account?{" "}
                            <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
