// ============================================================================
// lib/asis-honesty.ts — SaaS-local honesty helpers (061 §B.2)
// ============================================================================
// Mirror of Warroom `@orakhos/asis-ui` honesty.ts + partner coerceVerifyForHonesty.
// This fork does not import the package; keep the invariant identical:
// while prover_mode ∈ {mock, offline, unknown}, NEVER claim verified / ZKP /
// STARK / CISO-ready. Presence of an envelope is not a proof.
// ============================================================================

export type ProverMode = "mock" | "cpu" | "cuda" | "unknown" | "offline";

export interface HonestyState {
    engineReachable: boolean;
    proverMode: ProverMode;
}

/** Host default until /api/asis/health returns. Never invent cpu/cuda. */
export const DEFAULT_HONESTY: HonestyState = {
    engineReachable: false,
    proverMode: "offline",
};

export const ASIS_NOT_ON_THIS_PLANE = "ASIS engine offline";
export const LEAVES_DISCLAIMER = "governance leaves / attestations, not ZKP proofs";
export const PROOFS_PENDING = "attestation proofs pending real prover";

const REAL_PROVER = new Set<ProverMode>(["cpu", "cuda"]);
const MOCKISH = new Set<ProverMode>(["mock", "offline", "unknown"]);

export function isRealProver(mode: ProverMode): boolean {
    return REAL_PROVER.has(mode);
}

export function isMockOrOffline(mode: ProverMode): boolean {
    return MOCKISH.has(mode);
}

export function parseProverMode(raw: unknown): ProverMode {
    if (raw === "mock" || raw === "cpu" || raw === "cuda" || raw === "offline" || raw === "unknown") {
        return raw;
    }
    if (typeof raw === "string" && raw.trim()) return "unknown";
    return "offline";
}

/** Host-computed honesty. Never invent cpu/cuda. Missing field → offline. */
export function honestyFromHealth(data: unknown): HonestyState {
    if (data == null || typeof data !== "object") return { ...DEFAULT_HONESTY };
    const obj = data as Record<string, unknown>;
    const inner =
        obj.data != null && typeof obj.data === "object" && !Array.isArray(obj.data)
            ? (obj.data as Record<string, unknown>)
            : obj;
    const mode = parseProverMode(inner.prover_mode ?? inner.proverMode);
    return { engineReachable: true, proverMode: mode };
}

/** Parse `/api/asis/health` (or verify) JSON — fail-open body or legacy shape. */
export function honestyFromApiBody(body: unknown): HonestyState {
    if (body == null || typeof body !== "object") return { ...DEFAULT_HONESTY };
    const obj = body as Record<string, unknown>;

    if (obj.honesty != null && typeof obj.honesty === "object") {
        const h = obj.honesty as Record<string, unknown>;
        const mode = parseProverMode(h.proverMode ?? h.prover_mode);
        const reachable = h.engineReachable === true;
        return { engineReachable: reachable, proverMode: reachable ? mode : "offline" };
    }

    if (obj.offline === true) {
        return { ...DEFAULT_HONESTY };
    }

    const data = obj.data != null && typeof obj.data === "object" ? obj.data : obj;
    const mode = parseProverMode(
        (data as Record<string, unknown>).prover_mode ?? (data as Record<string, unknown>).proverMode,
    );
    if (mode === "offline") return { engineReachable: false, proverMode: "offline" };
    return { engineReachable: true, proverMode: mode };
}

export type ProofStatus =
    | "verified"
    | "pending"
    | "invalid"
    | "unattested"
    | "mock"
    | "offline";

export interface ProofStatusFields {
    verification_status: "pending" | "verified_valid" | "verified_invalid" | "unattested" | string;
    pqc_valid: boolean;
    zkp_valid: boolean | null;
}

/**
 * Derive the honest display status for an attestation row.
 * Rule (061 §B.2): while prover_mode ∈ {mock, offline, unknown},
 * NOTHING renders "verified / ZKP / STARK valid / CISO-ready".
 */
export function deriveProofStatus(
    record: ProofStatusFields,
    honesty: HonestyState,
): ProofStatus {
    if (!honesty.engineReachable) return "offline";
    if (isMockOrOffline(honesty.proverMode)) return "mock";

    switch (record.verification_status) {
        case "unattested":
            return "unattested";
        case "pending":
            return "pending";
        case "verified_invalid":
            return "invalid";
        case "verified_valid":
            if (record.pqc_valid && record.zkp_valid === true) return "verified";
            if (record.zkp_valid === null) return "pending";
            return "invalid";
        default:
            return "pending";
    }
}

export type VerifyHonestyFields = {
    pqc_valid: boolean;
    zkp_valid: boolean | null;
};

/**
 * Honesty invariant: mock|offline|unknown (or unreachable) → zkp_valid stays null.
 * Presence of an envelope is not a proof.
 */
export function coerceVerifyForHonesty<T extends VerifyHonestyFields>(
    result: T,
    honesty: HonestyState,
): T {
    if (!honesty.engineReachable || isMockOrOffline(honesty.proverMode)) {
        return { ...result, zkp_valid: null };
    }
    return result;
}

export function offlineVerifyResult(): VerifyHonestyFields {
    return {
        pqc_valid: false,
        zkp_valid: null,
    };
}

export function proofStatusLabel(status: ProofStatus): string {
    switch (status) {
        case "verified":
            return "Verified";
        case "pending":
            return "Pending Verification";
        case "invalid":
            return "Verification Failed";
        case "unattested":
            return "Not Attested";
        case "mock":
            return "Mock — Not Proven";
        case "offline":
            return "Engine Offline";
    }
}

export function proofStatusVariant(status: ProofStatus): "ok" | "accent" | "err" | "muted" | "warn" {
    switch (status) {
        case "verified":
            return "ok";
        case "pending":
            return "accent";
        case "invalid":
            return "err";
        case "unattested":
            return "muted";
        case "mock":
            return "warn";
        case "offline":
            return "err";
    }
}

export function proverModeLabel(mode: ProverMode): string {
    switch (mode) {
        case "cpu":
            return "CPU Prover";
        case "cuda":
            return "CUDA/GPU Prover";
        case "mock":
            return "Mock Prover (no real proofs)";
        case "offline":
            return "Engine Offline";
        case "unknown":
            return "Unknown Prover State";
    }
}

/** Config / seed rows are declared targets unless a real prover is live. */
export function configClaimKind(honesty: HonestyState): "live" | "target" {
    return honesty.engineReachable && isRealProver(honesty.proverMode) ? "live" : "target";
}

/**
 * Strip certification-shaped fields from engine config before a CISO sees an export.
 * Seeded SOC2 / ISO 27001 / NIST mappings are targets, not achieved compliance.
 */
export function sanitizeEngineConfigForExport(
    config: Record<string, { value?: unknown } | undefined> | null,
): Record<string, unknown> | null {
    if (!config) return null;
    const out: Record<string, unknown> = structuredClone(config);
    const policy = out["policy.attestation_protocol"] as { value?: Record<string, unknown> } | undefined;
    const value = policy?.value;
    if (value && typeof value === "object" && Array.isArray(value.compliance_frameworks)) {
        value.compliance_frameworks_target = value.compliance_frameworks;
        delete value.compliance_frameworks;
        value.compliance_certified = false;
        value.compliance_note = "Target mappings only — not achieved certification.";
    }
    return out;
}

export async function fetchAsisHonesty(doFetch: typeof fetch = fetch): Promise<HonestyState> {
    try {
        const res = await doFetch("/api/asis/health");
        const body: unknown = await res.json().catch(() => null);
        return honestyFromApiBody(body);
    } catch {
        return { ...DEFAULT_HONESTY };
    }
}
