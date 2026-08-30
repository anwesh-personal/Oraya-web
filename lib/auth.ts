import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
    decideSaaSLoginRole,
    SAAS_ROLE_HIERARCHY,
} from "./saas-rbac";
import {
    isPlatformAdminRole,
    type PlatformAdminRole,
} from "./platform-admin-roles";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

const COOKIE_NAME = "superadmin_session";

export interface SessionPayload {
    adminId: string;
    email: string;
    role: PlatformAdminRole;
    permissions: Record<string, boolean>;
    iat?: number;
    exp?: number;
}

export class SaaSSessionRoleError extends Error {
    constructor(message = "createSession refused a non-SaaS role") {
        super(message);
        this.name = "SaaSSessionRoleError";
    }
}

// Create a signed JWT token. MOS `scoped` / unknown roles are refused.
export async function createSession(payload: Omit<SessionPayload, "iat" | "exp">) {
    const allowed = decideSaaSLoginRole(payload.role);
    if (!allowed.ok) {
        throw new SaaSSessionRoleError();
    }
    const token = await new SignJWT({ ...payload, role: allowed.role })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

    return token;
}

// Verify and decode a JWT token. Unknown / MOS-only roles are not sessions.
export async function verifySession(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = (payload as { role?: unknown }).role;
        if (!isPlatformAdminRole(role)) {
            return null;
        }
        return payload as unknown as SessionPayload;
    } catch (error) {
        return null;
    }
}

// Get session from cookies
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    return verifySession(token);
}

// Set session cookie
export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
    });
}

// Clear session cookie
export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

// Check if user has required role. Unknown / MOS-only roles fail closed.
export function hasRole(
    session: SessionPayload | null,
    requiredRole: PlatformAdminRole
): boolean {
    if (!session || !isPlatformAdminRole(session.role)) return false;
    if (!isPlatformAdminRole(requiredRole)) return false;
    return SAAS_ROLE_HIERARCHY[session.role] >= SAAS_ROLE_HIERARCHY[requiredRole];
}

// Granular JSONB cannot elevate support / readonly / unknown roles.
export function hasPermission(
    session: SessionPayload | null,
    permission: string
): boolean {
    if (!session || !isPlatformAdminRole(session.role)) return false;
    if (session.role === "superadmin") return true;
    if (session.role === "support" || session.role === "readonly") return false;
    return session.permissions?.[permission] === true;
}

/**
 * Server-side route guard for superadmin API routes.
 * Call `await requireSuperadmin()` at the top of any handler that must be
 * restricted to superadmin sessions. Throws a NextResponse with status 401
 * if the caller is not authenticated or does not hold the superadmin role.
 */
export async function requireSuperadmin(): Promise<SessionPayload> {
    const session = await getSession();
    if (!session || !hasRole(session, "superadmin")) {
        // Throw a Response so Next.js route handlers surface it as a real HTTP error
        throw new Response(
            JSON.stringify({ error: "Unauthorized: superadmin access required" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        );
    }
    return session;
}
