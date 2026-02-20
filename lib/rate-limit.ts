/**
 * RATE LIMITER
 *
 * In-memory sliding-window rate limiter for Next.js API routes.
 * No external dependencies — uses a Map with automatic expiry cleanup.
 *
 * For production at scale, replace with Redis-backed (e.g. @upstash/ratelimit).
 * This is perfectly fine for Vercel serverless with moderate traffic.
 *
 * @module lib/rate-limit
 */

import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// TYPES
// =============================================================================

interface RateLimitConfig {
    /** Max requests allowed within the window */
    limit: number;
    /** Time window in seconds */
    windowSeconds: number;
}

interface RateLimitEntry {
    /** Timestamps of requests within the current window */
    timestamps: number[];
    /** When this entry should be cleaned up */
    expiresAt: number;
}

// =============================================================================
// STORE
// =============================================================================

/**
 * In-memory store for rate limit state.
 * Each key (IP or user ID) maps to a list of request timestamps.
 *
 * NOTE: On Vercel serverless, each cold start gets a fresh Map.
 * This means rate limits are per-instance, not global.
 * For strict global enforcement, use Redis.
 * For our use case (desktop app clients, not web crawlers), this is fine.
 */
const store = new Map<string, RateLimitEntry>();

/** Cleanup stale entries every 60 seconds */
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000;

function cleanupStaleEntries(): void {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    for (const [key, entry] of store) {
        if (entry.expiresAt < now) {
            store.delete(key);
        }
    }
}

// =============================================================================
// CORE
// =============================================================================

/**
 * Check if a request should be rate-limited.
 *
 * @param key - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with `allowed` boolean and metadata
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig
): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
} {
    cleanupStaleEntries();

    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Get or create entry
    let entry = store.get(key);
    if (!entry) {
        entry = { timestamps: [], expiresAt: now + windowMs * 2 };
        store.set(key, entry);
    }

    // Prune timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
    entry.expiresAt = now + windowMs * 2; // Reset TTL

    if (entry.timestamps.length >= config.limit) {
        // Rate limited
        const oldestInWindow = entry.timestamps[0];
        const resetAt = oldestInWindow + windowMs;
        const retryAfterSeconds = Math.ceil((resetAt - now) / 1000);

        return {
            allowed: false,
            remaining: 0,
            resetAt,
            retryAfterSeconds: Math.max(1, retryAfterSeconds),
        };
    }

    // Allow request — record timestamp
    entry.timestamps.push(now);

    return {
        allowed: true,
        remaining: config.limit - entry.timestamps.length,
        resetAt: now + windowMs,
        retryAfterSeconds: 0,
    };
}

// =============================================================================
// PRESETS FOR DESKTOP API ENDPOINTS
// =============================================================================

/** Rate limits per endpoint type */
export const RATE_LIMITS = {
    /** Activation: 5 per minute per IP (creating DB rows) */
    activate: { limit: 5, windowSeconds: 60 } as RateLimitConfig,
    /** ORA Key Device Activation: 10 per minute per IP */
    "activate-device": { limit: 10, windowSeconds: 60 } as RateLimitConfig,
    /** Refresh: 30 per minute per IP (token renewal) */
    refresh: { limit: 30, windowSeconds: 60 } as RateLimitConfig,
    /** Heartbeat: 60 per minute per IP (lightweight ping) */
    heartbeat: { limit: 60, windowSeconds: 60 } as RateLimitConfig,
    /** Deactivate: 10 per minute per IP */
    deactivate: { limit: 10, windowSeconds: 60 } as RateLimitConfig,
    /** Updates check: 30 per minute per IP (GET, unauthenticated) */
    updates: { limit: 30, windowSeconds: 60 } as RateLimitConfig,
} as const;

// =============================================================================
// MIDDLEWARE HELPER
// =============================================================================

/**
 * Extract the client IP from a Next.js request.
 */
export function getClientIp(request: NextRequest): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

/**
 * Apply rate limiting to a request. Returns a 429 response if the limit
 * is exceeded, or null if the request is allowed.
 *
 * Usage:
 * ```ts
 * const rateLimitResponse = applyRateLimit(request, "activate");
 * if (rateLimitResponse) return rateLimitResponse;
 * ```
 */
export function applyRateLimit(
    request: NextRequest,
    endpoint: keyof typeof RATE_LIMITS
): NextResponse | null {
    const config = RATE_LIMITS[endpoint];
    const ip = getClientIp(request);
    const key = `${endpoint}:${ip}`;

    const result = checkRateLimit(key, config);

    if (!result.allowed) {
        return NextResponse.json(
            {
                error: "Too many requests. Please slow down.",
                code: "RATE_LIMITED",
                retry_after_seconds: result.retryAfterSeconds,
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(result.retryAfterSeconds),
                    "X-RateLimit-Limit": String(config.limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": String(
                        Math.ceil(result.resetAt / 1000)
                    ),
                },
            }
        );
    }

    // Request allowed — no response to return
    return null;
}
