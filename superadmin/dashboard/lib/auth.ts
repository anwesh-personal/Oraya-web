import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

const COOKIE_NAME = "superadmin_session";

export interface SessionPayload {
    adminId: string;
    email: string;
    role: "superadmin" | "admin" | "support" | "readonly";
    permissions: Record<string, boolean>;
    iat?: number;
    exp?: number;
}

// Create a signed JWT token
export async function createSession(payload: Omit<SessionPayload, "iat" | "exp">) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

    return token;
}

// Verify and decode a JWT token
export async function verifySession(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
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

// Check if user has required role
export function hasRole(
    session: SessionPayload | null,
    requiredRole: "superadmin" | "admin" | "support" | "readonly"
): boolean {
    if (!session) return false;

    const roleHierarchy = {
        superadmin: 4,
        admin: 3,
        support: 2,
        readonly: 1,
    };

    return roleHierarchy[session.role] >= roleHierarchy[requiredRole];
}

// Check if user has specific permission
export function hasPermission(
    session: SessionPayload | null,
    permission: string
): boolean {
    if (!session) return false;
    if (session.role === "superadmin") return true; // Superadmin has all permissions
    return session.permissions?.[permission] === true;
}
