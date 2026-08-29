/**
 * platform_admins.role allowlist — Settings → Admins
 *
 * Proves each CHECK-valid role is accepted and persisted as written, and that
 * unrecognized values (e.g. moderator) are rejected with 400 — never coerced
 * to admin. Uses the same helpers the create API writes with.
 *
 * Run: npx tsx --test __tests__/platform-admin-roles.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    PLATFORM_ADMIN_ROLES,
    PLATFORM_ADMIN_ROLE_OPTIONS,
    createAdminInsertPayload,
    parsePlatformAdminRole,
    platformAdminDisplayName,
} from "../lib/platform-admin-roles";

/** The silent-default the create API used before this fix. */
function oldBuggyCoerce(role: unknown): string {
    const validRoles = ["superadmin", "admin", "support", "readonly"];
    return validRoles.includes(role as string) ? (role as string) : "admin";
}

describe("platform_admins role allowlist", () => {
    it("offers exactly the four CHECK-valid roles", () => {
        assert.deepEqual([...PLATFORM_ADMIN_ROLES], [
            "superadmin",
            "admin",
            "support",
            "readonly",
        ]);
        assert.deepEqual(
            PLATFORM_ADMIN_ROLE_OPTIONS.map((option) => option.value),
            [...PLATFORM_ADMIN_ROLES]
        );
        const values = PLATFORM_ADMIN_ROLE_OPTIONS.map((option) => option.value);
        assert.equal(values.includes("moderator" as never), false);
        assert.equal(values.includes("super_admin" as never), false);
    });

    it("accepts each valid role and persists it as written", () => {
        for (const role of PLATFORM_ADMIN_ROLES) {
            const parsed = parsePlatformAdminRole(role);
            assert.equal(parsed.ok, true, `${role} must be accepted`);
            if (!parsed.ok) continue;

            assert.equal(parsed.role, role);

            const row = createAdminInsertPayload({
                email: `${role}@oraya.test`,
                name: `Person ${role}`,
                passwordHash: "bcrypt-hash",
                role: parsed.role,
            });

            assert.equal(row.role, role, `${role} must be stored verbatim`);
            assert.equal(row.full_name, `Person ${role}`);
            assert.equal(row.email, `${role}@oraya.test`);
            assert.equal(row.is_active, true);
        }
    });

    it("rejects moderator with 400 and does not coerce to admin", () => {
        assert.equal(oldBuggyCoerce("moderator"), "admin");

        const parsed = parsePlatformAdminRole("moderator");
        assert.equal(parsed.ok, false);
        if (parsed.ok) return;

        assert.equal(parsed.status, 400);
        assert.match(parsed.error, /superadmin, admin, support, readonly/);
        assert.notEqual(
            "admin",
            "moderator",
            "sanity: moderator is not admin"
        );
    });

    it("rejects other aliases instead of remapping them", () => {
        for (const invalid of [
            "super_admin",
            "Super Admin",
            "Admin",
            "SUPERADMIN",
            "",
            null,
            undefined,
            1,
        ]) {
            const parsed = parsePlatformAdminRole(invalid);
            assert.equal(parsed.ok, false, `${String(invalid)} must be rejected`);
            if (parsed.ok) continue;
            assert.equal(parsed.status, 400);
        }
    });

    it("renders full_name when the list API omits name", () => {
        assert.equal(
            platformAdminDisplayName({ full_name: "Ada Lovelace", name: null }),
            "Ada Lovelace"
        );
        assert.equal(
            platformAdminDisplayName({ name: "Fallback Only" }),
            "Fallback Only"
        );
        assert.equal(platformAdminDisplayName({}), "");
    });
});
