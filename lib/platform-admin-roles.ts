/**
 * platform_admins.role values that match the CHECK constraint
 * (migration 002: superadmin | admin | support | readonly).
 *
 * Create/update paths MUST use parsePlatformAdminRole. Never remap an
 * unknown label (e.g. "moderator", "super_admin") to "admin".
 */

export const PLATFORM_ADMIN_ROLES = [
    "superadmin",
    "admin",
    "support",
    "readonly",
] as const;

export type PlatformAdminRole = (typeof PLATFORM_ADMIN_ROLES)[number];

export const PLATFORM_ADMIN_ROLE_OPTIONS: ReadonlyArray<{
    value: PlatformAdminRole;
    label: string;
}> = [
    { value: "superadmin", label: "Superadmin" },
    { value: "admin", label: "Admin" },
    { value: "support", label: "Support" },
    { value: "readonly", label: "Read-only" },
];

export const INVALID_PLATFORM_ADMIN_ROLE =
    "Invalid role. Must be one of: superadmin, admin, support, readonly";

export function isPlatformAdminRole(value: unknown): value is PlatformAdminRole {
    return (
        typeof value === "string" &&
        (PLATFORM_ADMIN_ROLES as readonly string[]).includes(value)
    );
}

export function parsePlatformAdminRole(
    role: unknown
):
    | { ok: true; role: PlatformAdminRole }
    | { ok: false; status: 400; error: string } {
    if (!isPlatformAdminRole(role)) {
        return { ok: false, status: 400, error: INVALID_PLATFORM_ADMIN_ROLE };
    }
    return { ok: true, role };
}

/** Row fields written on create. `role` is stored exactly as validated — no aliases. */
export function createAdminInsertPayload(input: {
    email: string;
    name: string;
    passwordHash: string;
    role: PlatformAdminRole;
}): {
    email: string;
    full_name: string;
    password_hash: string;
    role: PlatformAdminRole;
    is_active: true;
} {
    return {
        email: input.email,
        full_name: input.name,
        password_hash: input.passwordHash,
        role: input.role,
        is_active: true,
    };
}

export function platformAdminDisplayName(admin: {
    full_name?: string | null;
    name?: string | null;
}): string {
    return (admin.full_name || admin.name || "").trim();
}

export function platformAdminRoleLabel(role: string): string {
    return (
        PLATFORM_ADMIN_ROLE_OPTIONS.find((option) => option.value === role)?.label ??
        role
    );
}
