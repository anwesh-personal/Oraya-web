"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPageWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--surface-0)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
        }>
            <MembersLoginPage />
        </Suspense>
    );
}

function MembersLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check for callback errors
    useEffect(() => {
        const callbackError = searchParams.get("error");
        if (callbackError === "auth_callback_failed") {
            setError("Email verification failed. Please try again or contact support.");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[var(--surface-0)]">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/90 to-[var(--secondary)]">
                {/* Background Pattern */}
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
                            Build smarter.<br />
                            Scale faster.<br />
                            Automate everything.
                        </h1>
                        <p className="text-xl text-white/80 max-w-md">
                            The AI-powered platform that transforms how you work.
                            From intelligent automation to predictive insights.
                        </p>
                    </div>

                    <div className="flex items-center gap-8 text-sm text-white/60">
                        <span>Trusted by 1000+ companies</span>
                        <span>•</span>
                        <span>99.9% uptime</span>
                        <span>•</span>
                        <span>Enterprise ready</span>
                    </div>
                </div>
            </div>

            {/* Right side - Login Form */}
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
                        <h2 className="text-2xl font-bold text-[var(--surface-900)]">Welcome back</h2>
                        <p className="text-[var(--surface-600)] mt-2">
                            Sign in to your account to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)]">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-[var(--surface-700)]">
                                Email
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
                                    className="w-full pl-12 pr-4 py-3.5 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-[var(--surface-700)]">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-[var(--primary)] hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--surface-400)]" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-3.5 bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-900)] placeholder:text-[var(--surface-400)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--surface-400)] hover:text-[var(--surface-600)]"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-white font-semibold rounded-xl shadow-lg shadow-[var(--primary)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[var(--surface-600)]">
                            Don't have an account?{" "}
                            <Link href="/register" className="text-[var(--primary)] font-medium hover:underline">
                                Sign up for free
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-[var(--surface-200)]">
                        <p className="text-xs text-center text-[var(--surface-500)]">
                            By signing in, you agree to our{" "}
                            <Link href="/terms" className="underline hover:text-[var(--surface-700)]">Terms of Service</Link>
                            {" "}and{" "}
                            <Link href="/privacy" className="underline hover:text-[var(--surface-700)]">Privacy Policy</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
