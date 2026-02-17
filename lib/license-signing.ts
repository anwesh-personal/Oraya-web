/**
 * ORAYA LICENSE SIGNING UTILITY
 *
 * Creates Ed25519-signed license tokens (Oraya License Tokens / OLTs).
 * These JWTs are verified offline by the desktop app using the embedded public key.
 *
 * SECURITY: The private key is loaded from the LICENSE_SIGNING_PRIVATE_KEY
 * environment variable and NEVER logged, returned in responses, or exposed.
 *
 * Algorithm: Ed25519 (EdDSA) via the `jose` library
 * Token format: JWT (RFC 7519) with custom OLT claims
 *
 * @module lib/license-signing
 */

import { SignJWT, importPKCS8, type KeyLike } from "jose";
import { randomUUID } from "crypto";
import { GRACE_MODE_FEATURES } from "@/lib/desktop-auth";

// =============================================================================
// TYPES
// =============================================================================

/** The claims embedded in an Oraya License Token */
export interface LicenseTokenClaims {
    // ── Identity ──
    /** Supabase auth.users.id */
    sub: string;
    /** User's email */
    email: string;
    /** Organization ID (optional) */
    org_id?: string;

    // ── License ──
    /** user_licenses.id */
    lic_id: string;
    /** License key (e.g. "ORA-A1B2C3D4E5F6...") */
    lic_key: string;
    /** Plan ID (e.g. "free", "pro", "team", "enterprise") */
    plan: string;
    /** Plan display name */
    plan_name: string;
    /** List of plan features */
    plan_features: string[];

    // ── Limits ──
    max_agents: number;
    max_devices: number;
    max_ai_calls: number;
    max_tokens: number;

    // ── Device binding ──
    /** SHA-256 hash of device hardware ID */
    dev_id: string;
    /** Human-readable device name */
    dev_name: string;
    /** Platform (e.g. "macos") */
    dev_platform: string;
    /** license_activations.id */
    activation_id: string;

    // ── Managed AI ──
    managed_ai?: ManagedAiClaims;

    // ── Timing ──
    /** Issued at (Unix timestamp) — set automatically */
    iat: number;
    /** Expires at (Unix timestamp) */
    exp: number;
    /** Soft refresh deadline (Unix timestamp) */
    refresh_by: number;
    /** When the subscription itself ends */
    plan_expires_at: number;

    // ── Grace configuration ──
    /** Max offline days after token expiry */
    offline_grace_days: number;
    /** Features available in degraded mode */
    grace_mode_features: string[];

    // ── JWT standard ──
    /** Unique token ID for revocation */
    jti: string;
}

/** Managed AI authorization claims */
export interface ManagedAiClaims {
    enabled: boolean;
    allowed_providers: string[];
    allowed_models: string[];
    max_ai_calls_remaining: number;
    max_tokens_remaining: number;
    daily_limit_usd: number;
    monthly_limit_usd: number;
}

/** Input for creating a license token */
export interface CreateTokenInput {
    // User
    userId: string;
    email: string;
    orgId?: string;

    // License
    licenseId: string;
    licenseKey: string;
    planId: string;
    planName: string;
    planFeatures: string[];

    // Limits
    maxAgents: number;
    maxDevices: number;
    maxAiCalls: number;
    maxTokens: number;

    // Device
    deviceId: string;
    deviceName: string;
    devicePlatform: string;
    activationId: string;

    // Managed AI (optional)
    managedAi?: ManagedAiClaims;

    // Timing overrides (optional — uses env defaults if not provided)
    tokenLifetimeDays?: number;
    refreshIntervalHours?: number;
    offlineGraceDays?: number;
    planExpiresAt?: Date;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Get the signing key ID from environment */
function getKeyId(): string {
    return process.env.LICENSE_SIGNING_KEY_ID || "v1";
}

/** Get the offline grace days from environment */
function getOfflineGraceDays(): number {
    return parseInt(process.env.LICENSE_OFFLINE_GRACE_DAYS || "30", 10);
}

/** Get the refresh interval in hours from environment */
function getRefreshIntervalHours(): number {
    return parseInt(process.env.LICENSE_REFRESH_INTERVAL_HOURS || "24", 10);
}

/**
 * Import the Ed25519 private key from environment.
 * Caches the key in memory after first import.
 */
let _cachedKey: KeyLike | null = null;

async function getSigningKey(): Promise<KeyLike> {
    if (_cachedKey) return _cachedKey;

    const privateKeyPem = process.env.LICENSE_SIGNING_PRIVATE_KEY;
    if (!privateKeyPem) {
        throw new Error(
            "LICENSE_SIGNING_PRIVATE_KEY environment variable is not set. " +
            "Generate an Ed25519 keypair and add the private key PEM to your environment."
        );
    }

    // The env var can be either:
    // 1. Raw PEM (with newlines)
    // 2. Base64-encoded PEM (for environments that don't support newlines in env vars)
    let pem = privateKeyPem;
    if (!pem.includes("-----BEGIN")) {
        // Assume base64-encoded PEM
        pem = Buffer.from(pem, "base64").toString("utf-8");
    }

    try {
        _cachedKey = await importPKCS8(pem, "EdDSA");
        return _cachedKey!;
    } catch (error) {
        throw new Error(
            `Failed to import Ed25519 private key: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

// =============================================================================
// TOKEN CREATION
// =============================================================================

/**
 * Create a signed Oraya License Token (OLT).
 *
 * This is the ONLY function that should create license tokens.
 * It signs the JWT with the Ed25519 private key.
 *
 * @param input - Token creation parameters
 * @returns The signed JWT string
 */
export async function createLicenseToken(input: CreateTokenInput): Promise<string> {
    const signingKey = await getSigningKey();
    const keyId = getKeyId();

    const now = Math.floor(Date.now() / 1000);
    const tokenLifetimeDays = input.tokenLifetimeDays ?? 30;
    const refreshIntervalHours = input.refreshIntervalHours ?? getRefreshIntervalHours();
    const offlineGraceDays = input.offlineGraceDays ?? getOfflineGraceDays();

    const expiresAt = now + tokenLifetimeDays * 86400;
    const refreshBy = now + refreshIntervalHours * 3600;
    const planExpiresAt = input.planExpiresAt
        ? Math.floor(input.planExpiresAt.getTime() / 1000)
        : expiresAt;

    const jti = randomUUID();

    // Build claims payload — iat and exp are set by SignJWT methods below
    const claims: Record<string, unknown> = {
        // Identity
        sub: input.userId,
        email: input.email,
        ...(input.orgId && { org_id: input.orgId }),

        // License
        lic_id: input.licenseId,
        lic_key: input.licenseKey,
        plan: input.planId,
        plan_name: input.planName,
        plan_features: input.planFeatures,

        // Limits
        max_agents: input.maxAgents,
        max_devices: input.maxDevices,
        max_ai_calls: input.maxAiCalls,
        max_tokens: input.maxTokens,

        // Device binding
        dev_id: input.deviceId,
        dev_name: input.deviceName,
        dev_platform: input.devicePlatform,
        activation_id: input.activationId,

        // Managed AI
        ...(input.managedAi && { managed_ai: input.managedAi }),

        // Timing (iat + exp are set by SignJWT.setIssuedAt/setExpirationTime)
        refresh_by: refreshBy,
        plan_expires_at: planExpiresAt,

        // Grace
        offline_grace_days: offlineGraceDays,
        grace_mode_features: [...GRACE_MODE_FEATURES],

        // JWT ID
        jti,
    };

    const token = await new SignJWT(claims as unknown as Record<string, unknown>)
        .setProtectedHeader({
            alg: "EdDSA",
            typ: "OLT",
            kid: keyId,
        })
        .setIssuedAt(now)
        .setExpirationTime(expiresAt)
        .sign(signingKey);

    return token;
}

/**
 * Create a long-lived license token for offline/air-gap use.
 * Validity: 365 days. No refresh_by field (pure offline mode).
 *
 * @param input - Token creation parameters
 * @returns The signed JWT string (for .oraya-license file)
 */
export async function createOfflineLicenseToken(
    input: CreateTokenInput
): Promise<string> {
    return createLicenseToken({
        ...input,
        tokenLifetimeDays: 365,
        offlineGraceDays: 365,
    });
}

/**
 * Get the JTI (token ID) from a token creation — useful for
 * recording in desktop_license_tokens for revocation support.
 *
 * Note: This parses the token payload WITHOUT verification
 * (since we just created it). For verification, use the desktop's
 * Ed25519 public key.
 */
export function extractJtiFromToken(token: string): string {
    const parts = token.split(".");
    if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
    }
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return payload.jti;
}

/**
 * Extract the expiration time from a token.
 */
export function extractExpFromToken(token: string): number {
    const parts = token.split(".");
    if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
    }
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return payload.exp;
}
