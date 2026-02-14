"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MemberSidebar } from "@/components/members/layout/MemberSidebar";
import { MemberHeader } from "@/components/members/layout/MemberHeader";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UserData {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
}

interface LicenseInfo {
    plan_id: string;
    plan_name: string;
    status: string;
}

interface TokenInfo {
    balance: number;
    currency: string;
}

// ─────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [license, setLicense] = useState<LicenseInfo | null>(null);
    const [tokens, setTokens] = useState<TokenInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        async function loadUserData() {
            try {
                // Fetch user profile
                const userRes = await fetch("/api/auth/me");
                if (!userRes.ok) {
                    router.replace("/login");
                    return;
                }
                const userData = await userRes.json();
                setUser(userData.user);

                // Fetch license and token data in parallel
                const [licenseRes, tokenRes] = await Promise.allSettled([
                    fetch("/api/members/license"),
                    fetch("/api/members/tokens"),
                ]);

                if (licenseRes.status === "fulfilled" && licenseRes.value.ok) {
                    const licenseData = await licenseRes.value.json();
                    setLicense(licenseData.license);
                }

                if (tokenRes.status === "fulfilled" && tokenRes.value.ok) {
                    const tokenData = await tokenRes.value.json();
                    setTokens(tokenData.wallet);
                }
            } catch {
                router.replace("/login");
            } finally {
                setLoading(false);
            }
        }

        loadUserData();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--surface-0)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
                    <p className="text-sm text-[var(--surface-500)] animate-pulse">
                        Loading your dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--surface-0)]">
            <MemberSidebar user={user} license={license} />
            <MemberHeader user={user} tokens={tokens} collapsed={collapsed} />

            {/* Main content area — offset by sidebar width */}
            <main
                className="pt-0 transition-all duration-300"
                style={{
                    marginLeft: collapsed ? "5rem" : "var(--sidebar-width)",
                }}
            >
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
