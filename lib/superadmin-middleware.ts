import { NextRequest } from "next/server";
import { verifySession, type SessionPayload } from "./auth";
import {
    assertSaaSAccess,
    decideSaaSApiAccess,
    SAAS_ROLE_HIERARCHY,
    type SaaSAccess,
} from "./saas-rbac";
import { isPlatformAdminRole, type PlatformAdminRole } from "./platform-admin-roles";

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
 * Require a specific SaaS role or higher. Unknown / MOS-only roles fail closed
 * (`undefined < 1` used to let `scoped` through).
 */
export async function requireRole(
    request: NextRequest,
    requiredRole: PlatformAdminRole
): Promise<AuthResult> {
    const authResult = await verifySuperadminToken(request);

    if (authResult.error) {
        return authResult;
    }

    const session = authResult.session;
    if (!session || !isPlatformAdminRole(session.role) || !isPlatformAdminRole(requiredRole)) {
        return { error: "This account is not permitted on this surface" };
    }

    const userLevel = SAAS_ROLE_HIERARCHY[session.role];
    const requiredLevel = SAAS_ROLE_HIERARCHY[requiredRole];

    if (userLevel < requiredLevel) {
        return { error: `Requires ${requiredRole} role or higher` };
    }

    return authResult;
}

/**
 * Coarse write / read / superadmin gate used by superadmin routes.
 */
export async function requireSaaSAccess(
    request: NextRequest,
    access: SaaSAccess
): Promise<AuthResult> {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return authResult;
    }
    const gate = assertSaaSAccess(authResult.session, access);
    if (!gate.ok) {
        return { error: gate.error };
    }
    return authResult;
}

/**
 * Require a specific permission. JSONB grants cannot elevate support/readonly
 * or MOS `scoped`. Superadmin is unrestricted. Admin may use JSONB.
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
    if (!isPlatformAdminRole(session.role)) {
        return { error: "This account is not permitted on this surface" };
    }

    if (session.role === "superadmin") {
        return authResult;
    }

    if (session.role === "support" || session.role === "readonly") {
        return { error: `Requires admin role or higher` };
    }

    if (!session.permissions?.[permission]) {
        return { error: `Missing permission: ${permission}` };
    }

    return authResult;
}

export { decideSaaSApiAccess };
