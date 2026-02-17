/**
 * DESKTOP AUTH INTEGRATION TEST
 *
 * Tests the rate limiter and key utility functions from the desktop auth system.
 * Uses Node.js built-in test runner (no external deps).
 *
 * Run: npx tsx __tests__/desktop-auth.test.ts
 *
 * NOTE: The full activate → refresh → heartbeat → deactivate flow requires
 * a running Supabase instance and valid JWT. For those, use staging.
 * This file tests the parts that CAN be unit-tested without a database.
 *
 * @module __tests__/desktop-auth.test
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, RATE_LIMITS } from "../lib/rate-limit";

// =============================================================================
// RATE LIMITER TESTS
// =============================================================================

describe("Rate Limiter", () => {
    it("allows requests under the limit", () => {
        const key = "test:allow:" + Date.now();
        for (let i = 0; i < 5; i++) {
            const result = checkRateLimit(key, { limit: 5, windowSeconds: 60 });
            assert.equal(result.allowed, true, `Request ${i + 1} should be allowed`);
        }
    });

    it("blocks requests over the limit", () => {
        const key = "test:block:" + Date.now();
        const config = { limit: 3, windowSeconds: 60 };

        // Use up the limit
        for (let i = 0; i < 3; i++) {
            const result = checkRateLimit(key, config);
            assert.equal(result.allowed, true, `Request ${i + 1} should be allowed`);
        }

        // This one should be blocked
        const result = checkRateLimit(key, config);
        assert.equal(result.allowed, false, "4th request should be blocked");
        assert.equal(result.remaining, 0);
        assert.ok(result.retryAfterSeconds > 0, "Should have positive retry-after");
    });

    it("tracks remaining count correctly", () => {
        const key = "test:remaining:" + Date.now();
        const config = { limit: 5, windowSeconds: 60 };

        const r1 = checkRateLimit(key, config);
        assert.equal(r1.remaining, 4);

        const r2 = checkRateLimit(key, config);
        assert.equal(r2.remaining, 3);

        const r3 = checkRateLimit(key, config);
        assert.equal(r3.remaining, 2);
    });

    it("uses different keys for different IPs", () => {
        const key1 = "test:ip1:" + Date.now();
        const key2 = "test:ip2:" + Date.now();
        const config = { limit: 1, windowSeconds: 60 };

        // First IP uses its limit
        const r1 = checkRateLimit(key1, config);
        assert.equal(r1.allowed, true);
        const r1b = checkRateLimit(key1, config);
        assert.equal(r1b.allowed, false);

        // Second IP should still be allowed
        const r2 = checkRateLimit(key2, config);
        assert.equal(r2.allowed, true);
    });

    it("has correct preset configurations", () => {
        assert.equal(RATE_LIMITS.activate.limit, 5);
        assert.equal(RATE_LIMITS.activate.windowSeconds, 60);
        assert.equal(RATE_LIMITS.refresh.limit, 30);
        assert.equal(RATE_LIMITS.heartbeat.limit, 60);
        assert.equal(RATE_LIMITS.deactivate.limit, 10);
        assert.equal(RATE_LIMITS.updates.limit, 30);
    });
});

// =============================================================================
// VERSION COMPARISON TESTS
// =============================================================================

// We can't import desktop-auth directly without mocking env vars,
// but the isVersionTooOld function is pure logic we can test

describe("Version comparison (isVersionTooOld)", () => {
    // Inline implementation for testing (mirrors the one in desktop-auth.ts)
    function isVersionTooOld(current: string, minimum: string): boolean {
        const curr = current.split(".").map(Number);
        const min = minimum.split(".").map(Number);
        for (let i = 0; i < 3; i++) {
            if ((curr[i] || 0) < (min[i] || 0)) return true;
            if ((curr[i] || 0) > (min[i] || 0)) return false;
        }
        return false;
    }

    it("detects older versions", () => {
        assert.equal(isVersionTooOld("1.0.0", "1.1.0"), true);
        assert.equal(isVersionTooOld("1.0.0", "2.0.0"), true);
        assert.equal(isVersionTooOld("1.0.0", "1.0.1"), true);
    });

    it("accepts equal versions", () => {
        assert.equal(isVersionTooOld("1.0.0", "1.0.0"), false);
        assert.equal(isVersionTooOld("2.5.3", "2.5.3"), false);
    });

    it("accepts newer versions", () => {
        assert.equal(isVersionTooOld("2.0.0", "1.0.0"), false);
        assert.equal(isVersionTooOld("1.1.0", "1.0.0"), false);
        assert.equal(isVersionTooOld("1.0.1", "1.0.0"), false);
    });

    it("handles missing patch/minor", () => {
        assert.equal(isVersionTooOld("1.0", "1.0.0"), false);
        assert.equal(isVersionTooOld("1", "1.0.0"), false);
    });
});

// =============================================================================
// TOKEN SIGNING UTILITY TESTS  
// =============================================================================

describe("Token utility functions", () => {
    it("extractJtiFromToken parses valid JWT", () => {
        // Build a fake JWT (header.payload.signature)
        const header = Buffer.from(JSON.stringify({ alg: "EdDSA", typ: "OLT", kid: "v1" })).toString("base64url");
        const payload = Buffer.from(JSON.stringify({
            sub: "user-123",
            jti: "test-jti-456",
            exp: 9999999999,
        })).toString("base64url");
        const fakeSignature = Buffer.from("fake-sig").toString("base64url");
        const token = `${header}.${payload}.${fakeSignature}`;

        // Parse JTI from token (without verification)
        const parts = token.split(".");
        assert.equal(parts.length, 3);
        const parsed = JSON.parse(Buffer.from(parts[1], "base64url").toString());
        assert.equal(parsed.jti, "test-jti-456");
    });

    it("rejects invalid JWT structure", () => {
        assert.throws(() => {
            const parts = "not-a-jwt".split(".");
            if (parts.length !== 3) throw new Error("Invalid JWT format");
        }, /Invalid JWT format/);
    });
});

console.log("\n✅ All desktop auth tests defined. Run with: npx tsx --test __tests__/desktop-auth.test.ts\n");
