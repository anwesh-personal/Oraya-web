import { NextRequest } from "next/server";
import { verifySession, type SessionPayload } from "./auth";

export interface AuthResult {
    session?: SessionPayload;
    error?: string;
}

/**
 * Verify superadmin token from Authorization header or cookie
 * For use in API routes
 */
export async function verifySuperadminToken(request: NextRequest): Promise<AuthResult> {
    // First try Authorization header (for client-side API calls)
    const authHeader = request.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const session = await verifySession(token);

        if (!session) {
            return { error: "Invalid or expired token" };
        }

        return { session };
    }

    // Fallback to cookie
    const cookieToken = request.cookies.get("superadmin_session")?.value;

    if (cookieToken) {
        const session = await verifySession(cookieToken);

        if (!session) {
            return { error: "Invalid or expired session" };
        }

        return { session };
    }

    return { error: "Authentication required" };
}

/**
 * Require a specific role or higher
 */
export async function requireRole(
    request: NextRequest,
    requiredRole: "superadmin" | "admin" | "support" | "readonly"
): Promise<AuthResult> {
    const authResult = await verifySuperadminToken(request);

    if (authResult.error) {
        return authResult;
    }

    const roleHierarchy = {
        superadmin: 4,
        admin: 3,
        support: 2,
        readonly: 1,
    };

    const userLevel = roleHierarchy[authResult.session!.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
        return { error: `Requires ${requiredRole} role or higher` };
    }

    return authResult;
}

/**
 * Require a specific permission
 */
export async function requirePermission(
    request: NextRequest,
    permission: string
): Promise<AuthResult> {
    const authResult = await verifySuperadminToken(request);

    if (authResult.error) {
        return authResult;
    }

    const session = authResult.session!;

    // Superadmin has all permissions
    if (session.role === "superadmin") {
        return authResult;
    }

    if (!session.permissions?.[permission]) {
        return { error: `Missing permission: ${permission}` };
    }

    return authResult;
}
