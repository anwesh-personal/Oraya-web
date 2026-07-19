// ============================================================================
// agent-runtime / crypto-keys — BYOK provider key decryption.
// ============================================================================
// Extracted VERBATIM from app/api/embed/chat/route.ts + chat/stream/route.ts so
// the decryption behaviour is byte-for-byte identical (same key-resolution
// fallback chain, same aes-256-cbc scheme). Changing the key resolution here
// would break decryption of already-stored user provider keys, so it is frozen.
//
// NOTE: the hardcoded default fallback is a KNOWN latent gap (plan 029 F6). It
// is preserved as-is in this pure refactor to avoid a behavioural change;
// hardening it belongs to the secrets-custody work, not this phase.
// ============================================================================

import crypto from "crypto";

const ENCRYPTION_KEY =
    process.env.AI_PROVIDER_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "oraya-default-key-change-in-production-32c";

function getEncKey(): Buffer {
    return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

/** Decrypts an `iv:data` hex payload. Returns "" on any failure (as before). */
export function decryptKey(encrypted: string): string {
    try {
        const [ivHex, data] = encrypted.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", getEncKey(), iv);
        let decrypted = decipher.update(data, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch {
        return "";
    }
}
