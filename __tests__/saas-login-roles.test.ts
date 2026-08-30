/**
 * oraya.dev login must accept only SaaS roles and refuse MOS `scoped`
 * / unknown. A valid superadmin still issues a session.
 *
 * Run: npx tsx --test __tests__/saas-login-roles.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import {
    decideSaaSLoginRole,
    SAAS_SURFACE_REFUSED,
} from "../lib/saas-rbac";
import { PLATFORM_ADMIN_ROLES } from "../lib/platform-admin-roles";
import {
    createSession,
    SaaSSessionRoleError,
    verifySession,
} from "../lib/auth";

const ROOT = join(__dirname, "..");

describe("SaaS login role allowlist", () => {
    it("accepts every valid SaaS role, including superadmin", () => {
        for (const role of PLATFORM_ADMIN_ROLES) {
            const decided = decideSaaSLoginRole(role);
            assert.equal(decided.ok, true, `${role} must be accepted`);
            if (decided.ok) assert.equal(decided.role, role);
        }
    });

    it("refuses MOS scoped and unknown roles", () => {
        for (const role of ["scoped", "operator", "moderator", "super_admin", "", null, undefined, 1]) {
            const decided = decideSaaSLoginRole(role);
            assert.equal(decided.ok, false, `${String(role)} must be refused`);
            if (decided.ok) continue;
            assert.equal(decided.status, 403);
            assert.equal(decided.error, SAAS_SURFACE_REFUSED);
            assert.doesNotMatch(decided.error, /scoped/i);
        }
    });

    it("login route gates the role after password verify and before createSession", () => {
        const src = readFileSync(
            join(ROOT, "app/api/superadmin/auth/login/route.ts"),
            "utf8"
        );
        assert.match(src, /decideSaaSLoginRole\(admin\.role\)/);
        assert.match(src, /createSession/);
        const afterPassword = src.indexOf("if (!passwordValid)");
        const decideAt = src.indexOf("decideSaaSLoginRole(admin.role)");
        const createAt = src.indexOf("const token = await createSession");
        assert.ok(afterPassword > 0 && decideAt > afterPassword);
        assert.ok(createAt > decideAt);
        assert.doesNotMatch(src, /role: admin\.role as /);
    });

    it("createSession issues a JWT for superadmin and refuses scoped", async () => {
        const token = await createSession({
            adminId: "founder-1",
            email: "founder@oraya.test",
            role: "superadmin",
            permissions: {},
        });
        const session = await verifySession(token);
        assert.ok(session);
        assert.equal(session?.role, "superadmin");
        assert.equal(session?.email, "founder@oraya.test");

        await assert.rejects(
            () =>
                createSession({
                    adminId: "mos-op",
                    email: "scoped@mos.test",
                    role: "scoped" as never,
                    permissions: { "mos.models.write": true },
                }),
            SaaSSessionRoleError
        );
    });

    it("verifySession drops a JWT whose role is scoped even if the signature is valid", async () => {
        const { SignJWT } = await import("jose");
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "fallback-secret-change-in-production"
        );
        const forged = await new SignJWT({
            adminId: "mos-op",
            email: "scoped@mos.test",
            role: "scoped",
            permissions: { "everything": true },
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(secret);

        assert.equal(await verifySession(forged), null);
    });
});
