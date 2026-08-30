/**
 * Coarse SaaS role enforcement: readonly/support cannot mutate;
 * scoped/unknown never pass; superadmin/admin as intended.
 *
 * Run: npx tsx --test __tests__/saas-capability-enforcement.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import {
    assertSaaSAccess,
    decideSaaSApiAccess,
    SAAS_AUTH_REQUIRED,
    SAAS_SUPERADMIN_DENIED,
    SAAS_SURFACE_REFUSED,
    SAAS_WRITE_DENIED,
} from "../lib/saas-rbac";
import { hasPermission, hasRole } from "../lib/auth";

const ROOT = join(__dirname, "..");
const SUPERADMIN_API = join(ROOT, "app/api/superadmin");

function walkRouteFiles(dir: string, acc: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walkRouteFiles(full, acc);
        else if (name === "route.ts") acc.push(full);
    }
    return acc;
}

function fileToPathname(abs: string): string {
    const rel = abs.slice(join(ROOT, "app").length).replace(/\\/g, "/");
    return rel.replace(/\/route\.ts$/, "").replace(/\[([^\]]+)\]/g, "x");
}

describe("assertSaaSAccess coarse roles", () => {
    it("lets readonly and support read, never write or mint admins", () => {
        for (const role of ["readonly", "support"] as const) {
            assert.equal(assertSaaSAccess({ role }, "read").ok, true);
            const write = assertSaaSAccess({ role }, "write");
            assert.equal(write.ok, false);
            if (!write.ok) {
                assert.equal(write.status, 403);
                assert.equal(write.error, SAAS_WRITE_DENIED);
            }
            const owner = assertSaaSAccess({ role }, "superadmin");
            assert.equal(owner.ok, false);
            if (!owner.ok) assert.equal(owner.error, SAAS_SUPERADMIN_DENIED);
        }
    });

    it("lets admin write but not create/delete admins or impersonate", () => {
        assert.equal(assertSaaSAccess({ role: "admin" }, "read").ok, true);
        assert.equal(assertSaaSAccess({ role: "admin" }, "write").ok, true);
        const owner = assertSaaSAccess({ role: "admin" }, "superadmin");
        assert.equal(owner.ok, false);
        if (!owner.ok) assert.equal(owner.error, SAAS_SUPERADMIN_DENIED);
    });

    it("lets superadmin do everything", () => {
        assert.equal(assertSaaSAccess({ role: "superadmin" }, "read").ok, true);
        assert.equal(assertSaaSAccess({ role: "superadmin" }, "write").ok, true);
        assert.equal(assertSaaSAccess({ role: "superadmin" }, "superadmin").ok, true);
    });

    it("refuses scoped / unknown even when JSONB claims every permission", () => {
        for (const role of ["scoped", "operator", "god", "", undefined]) {
            const denied = assertSaaSAccess({ role }, "read");
            assert.equal(denied.ok, false, `read ${String(role)}`);
            if (!denied.ok) {
                assert.equal(denied.status, role == null ? 403 : 403);
                assert.equal(denied.error, SAAS_SURFACE_REFUSED);
            }
            assert.equal(assertSaaSAccess({ role }, "write").ok, false);
        }
        assert.equal(assertSaaSAccess(null, "read").ok, false);
        const missing = assertSaaSAccess(null, "write");
        if (!missing.ok) {
            assert.equal(missing.status, 401);
            assert.equal(missing.error, SAAS_AUTH_REQUIRED);
        }
    });

    it("hasRole fails closed for scoped (no undefined < 1 pass)", () => {
        const scoped = { role: "scoped" } as never;
        assert.equal(hasRole(scoped, "readonly"), false);
        assert.equal(hasRole(scoped, "admin"), false);
        assert.equal(hasRole({ role: "superadmin", adminId: "1", email: "a", permissions: {} }, "admin"), true);
        assert.equal(hasRole({ role: "readonly", adminId: "1", email: "a", permissions: {} }, "admin"), false);
    });

    it("JSONB permissions cannot elevate support or readonly", () => {
        const support = {
            adminId: "s",
            email: "s@test",
            role: "support" as const,
            permissions: { "admins.create": true, "everything": true },
        };
        assert.equal(hasPermission(support, "admins.create"), false);
        const admin = { ...support, role: "admin" as const };
        assert.equal(hasPermission(admin, "admins.create"), true);
        const scoped = { ...support, role: "scoped" as never };
        assert.equal(hasPermission(scoped, "everything"), false);
    });
});

describe("decideSaaSApiAccess covers every superadmin route", () => {
    const routes = walkRouteFiles(SUPERADMIN_API);
    assert.ok(routes.length >= 20, "expected the live superadmin API tree");

    it("readonly and support cannot hit any mutating handler", () => {
        for (const file of routes) {
            const src = readFileSync(file, "utf8");
            const pathname = fileToPathname(file);
            for (const method of ["POST", "PUT", "PATCH", "DELETE"] as const) {
                if (!src.includes(`export async function ${method}`)) continue;
                if (pathname.endsWith("/auth/login") || pathname.endsWith("/auth/logout")) {
                    continue;
                }
                for (const role of ["readonly", "support", "scoped", "moderator"]) {
                    const decision = decideSaaSApiAccess({ pathname, method, role });
                    assert.equal(
                        decision.ok,
                        false,
                        `${method} ${pathname} must refuse ${role}`
                    );
                }
                const admin = decideSaaSApiAccess({
                    pathname,
                    method,
                    role: "admin",
                });
                const owner = decideSaaSApiAccess({
                    pathname,
                    method,
                    role: "superadmin",
                });
                const privileged =
                    pathname === "/api/superadmin/admins" ||
                    pathname.startsWith("/api/superadmin/admins/") ||
                    pathname.includes("/impersonate");
                if (privileged) {
                    assert.equal(admin.ok, false, `admin must not ${method} ${pathname}`);
                    assert.equal(owner.ok, true, `superadmin must ${method} ${pathname}`);
                } else {
                    assert.equal(admin.ok, true, `admin must ${method} ${pathname}`);
                    assert.equal(owner.ok, true, `superadmin must ${method} ${pathname}`);
                }
            }
        }
    });

    it("valid SaaS roles can still GET, scoped cannot", () => {
        for (const file of routes) {
            const src = readFileSync(file, "utf8");
            if (!src.includes("export async function GET")) continue;
            const pathname = fileToPathname(file);
            for (const role of ["readonly", "support", "admin", "superadmin"]) {
                assert.equal(
                    decideSaaSApiAccess({ pathname, method: "GET", role }).ok,
                    true,
                    `GET ${pathname} ${role}`
                );
            }
            assert.equal(
                decideSaaSApiAccess({ pathname, method: "GET", role: "scoped" }).ok,
                false,
                `GET ${pathname} scoped`
            );
        }
    });

    it("login stays public; unauthenticated mutations are 401", () => {
        assert.equal(
            decideSaaSApiAccess({
                pathname: "/api/superadmin/auth/login",
                method: "POST",
                role: null,
            }).ok,
            true
        );
        const denied = decideSaaSApiAccess({
            pathname: "/api/superadmin/admins",
            method: "POST",
            role: null,
        });
        assert.equal(denied.ok, false);
        if (!denied.ok) assert.equal(denied.status, 401);
    });
});

describe("middleware and critical routes actually call the gate", () => {
    it("middleware matcher covers /api/superadmin and calls decideSaaSApiAccess", () => {
        const src = readFileSync(join(ROOT, "middleware.ts"), "utf8");
        assert.match(src, /decideSaaSApiAccess/);
        assert.match(src, /\/api\/superadmin\/:path\*/);
        assert.match(src, /enforceSaaSSuperadminApi/);
    });

    it("admins create/delete stay superadmin-only in the route", () => {
        const src = readFileSync(
            join(ROOT, "app/api/superadmin/admins/route.ts"),
            "utf8"
        );
        assert.match(src, /requireSaaSSession\("superadmin"/);
        assert.match(src, /Only superadmins can create new admins|requireSaaSSession/);
    });

    it("every mutating superadmin route calls a coarse role gate", () => {
        for (const file of walkRouteFiles(SUPERADMIN_API)) {
            const src = readFileSync(file, "utf8");
            const pathname = fileToPathname(file);
            if (pathname.endsWith("/auth/login") || pathname.endsWith("/auth/logout")) {
                continue;
            }
            const mutates = ["POST", "PUT", "PATCH", "DELETE"].some((method) =>
                src.includes(`export async function ${method}`)
            );
            if (!mutates) continue;
            assert.match(
                src,
                /requireSaaSSession|requireSuperadmin|requireRole|requireSaaSAccess/,
                `${pathname} must call a role gate`
            );
        }
    });
});
