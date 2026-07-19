import { compare, hash } from "bcryptjs";

// Cost factor for superadmin password hashing.
// Must match the format of existing seeded rows ($2a$12$...) and the
// login verifier's expectations. Do NOT lower without a coordinated rehash.
export const SUPERADMIN_BCRYPT_COST = 12;

/**
 * Hash a plaintext superadmin password with bcrypt (cost 12).
 * This is the ONLY approved way to store a platform_admins password.
 */
export async function hashSuperadminPassword(password: string): Promise<string> {
    return hash(password, SUPERADMIN_BCRYPT_COST);
}

/**
 * True when the stored value is a bcrypt hash ($2a/$2b/$2y, 2-digit cost).
 * Anything else (e.g. legacy SHA256 hex) is not verifiable here.
 */
export function isBcryptHash(value: string): boolean {
    return /^\$2[aby]\$\d{2}\$/.test(value);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 *
 * Fails CLOSED for any non-bcrypt stored value: the platform_admins table has
 * no salt column, so a legacy SHA256+salt hash cannot be verified and MUST be
 * rejected (never accepted, never treated as plaintext). Such rows require an
 * explicit password reset by a superadmin.
 */
export async function verifySuperadminPassword(
    password: string,
    storedHash: string
): Promise<boolean> {
    if (!isBcryptHash(storedHash)) {
        return false;
    }
    return compare(password, storedHash);
}
