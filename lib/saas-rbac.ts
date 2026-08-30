/**
 * Coarse SaaS RBAC for oraya.dev.
 *
 * MOS Operators (role=scoped + 67-cap grants) share the platform_admins
 * table. They must never receive an oraya.dev session, and a leftover
 * scoped/unknown JWT must not pass any SaaS gate.
 *
 * Granular JSONB capabilities stay MOS-only. This module enforces the
 * four SaaS roles: superadmin | admin | support | readonly.
 */
import {
    isPlatformAdminRole,
    type PlatformAdminRole,
} from "./platform-admin-roles";

export const SAAS_ROLE_HIERARCHY: Record<PlatformAdminRole, number> = {
    superadmin: 4,
    admin: 3,
    support: 2,
    readonly: 1,
};

export const SAAS_SURFACE_REFUSED =
    "This account is not permitted on this surface";

export const SAAS_AUTH_REQUIRED = "Authentication required";

export const SAAS_WRITE_DENIED =
    "Requires admin role or higher";

export const SAAS_SUPERADMIN_DENIED =
    "Requires superadmin role";

export type SaaSAccess = "read" | "write" | "superadmin";

export type SaaSDecision =
    | { ok: true }
    | { ok: false; status: 401 | 403; error: string };

export function saasRoleLevel(role: unknown): number | null {
    if (!isPlatformAdminRole(role)) return null;
    return SAAS_ROLE_HIERARCHY[role];
}

export function decideSaaSLoginRole(
    role: unknown
):
    | { ok: true; role: PlatformAdminRole }
    | { ok: false; status: 403; error: string } {
    if (!isPlatformAdminRole(role)) {
        return { ok: false, status: 403, error: SAAS_SURFACE_REFUSED };
    }
    return { ok: true, role };
}

export function assertSaaSAccess(
    session: { role?: unknown } | null | undefined,
    access: SaaSAccess
): SaaSDecision {
    if (!session) {
        return { ok: false, status: 401, error: SAAS_AUTH_REQUIRED };
    }
    const level = saasRoleLevel(session.role);
    if (level === null) {
        return { ok: false, status: 403, error: SAAS_SURFACE_REFUSED };
    }
    if (access === "read") {
        return { ok: true };
    }
    if (access === "write") {
        return level >= SAAS_ROLE_HIERARCHY.admin
            ? { ok: true }
            : { ok: false, status: 403, error: SAAS_WRITE_DENIED };
    }
    return session.role === "superadmin"
        ? { ok: true }
        : { ok: false, status: 403, error: SAAS_SUPERADMIN_DENIED };
}

export function normalizeSaaSPath(pathname: string): string {
    const noQuery = pathname.split("?")[0] ?? pathname;
    const trimmed = noQuery.replace(/\/+$/, "");
    return trimmed || "/";
}

function isPublicSaaSAuthPath(pathname: string, method: string): boolean {
    const path = normalizeSaaSPath(pathname);
    const verb = method.toUpperCase();
    if (verb === "OPTIONS") return true;
    if (path === "/api/superadmin/auth/login" && verb === "POST") return true;
    if (path === "/api/superadmin/auth/logout" && verb === "POST") return true;
    return false;
}

function mutationAccessForPath(pathname: string): SaaSAccess {
    const path = normalizeSaaSPath(pathname);
    if (path === "/api/superadmin/admins" || path.startsWith("/api/superadmin/admins/")) {
        return "superadmin";
    }
    if (
        path === "/api/superadmin/impersonate" ||
        path.startsWith("/api/superadmin/impersonate/")
    ) {
        return "superadmin";
    }
    return "write";
}

/**
 * Fail-closed gate for every /api/superadmin/* request.
 * Login/logout stay public. Reads need any valid SaaS role.
 * Mutations need admin+ (admins + impersonate stay superadmin-only).
 * MOS `scoped` and any unknown role are refused.
 */
export function decideSaaSApiAccess(input: {
    pathname: string;
    method: string;
    role: unknown | null;
}): SaaSDecision {
    if (isPublicSaaSAuthPath(input.pathname, input.method)) {
        return { ok: true };
    }

    const verb = input.method.toUpperCase();
    const isRead = verb === "GET" || verb === "HEAD";
    const access: SaaSAccess = isRead
        ? "read"
        : mutationAccessForPath(input.pathname);

    if (input.role == null) {
        return { ok: false, status: 401, error: SAAS_AUTH_REQUIRED };
    }
    return assertSaaSAccess({ role: input.role }, access);
}
