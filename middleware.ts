import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { isPlatformAdminRole } from "@/lib/platform-admin-roles";
import { decideSaaSApiAccess } from "@/lib/saas-rbac";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

async function peekSaaSRole(token: string): Promise<unknown | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = (payload as { role?: unknown }).role;
        return isPlatformAdminRole(role) ? role : null;
    } catch {
        return null;
    }
}

async function enforceSaaSSuperadminApi(request: NextRequest): Promise<NextResponse> {
    const token = request.headers.get("Authorization")?.startsWith("Bearer ")
        ? request.headers.get("Authorization")!.slice(7)
        : request.cookies.get("superadmin_session")?.value;

    let role: unknown = null;
    if (token) {
        role = await peekSaaSRole(token);
    }

    const decision = decideSaaSApiAccess({
        pathname: request.nextUrl.pathname,
        method: request.method,
        role,
    });

    if (!decision.ok) {
        return NextResponse.json(
            { error: decision.error },
            { status: decision.status }
        );
    }

    return NextResponse.next();
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/api/superadmin")) {
        return enforceSaaSSuperadminApi(request);
    }

    // Skip middleware for static files, other APIs, auth callback
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/auth") ||
        pathname.includes(".") ||
        pathname.startsWith("/superadmin")
    ) {
        return NextResponse.next();
    }

    // Only protect /dashboard routes
    if (!pathname.startsWith("/dashboard")) {
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: "", ...options });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({ name, value: "", ...options });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // If no user and trying to access dashboard, redirect to login
    if (!user && pathname.startsWith("/dashboard")) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If user is logged in and visiting login/register, redirect to dashboard
    if (user && (pathname === "/login" || pathname === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/login",
        "/register",
        "/api/superadmin/:path*",
    ],
};
