// ============================================================================
// lib/asis-client.ts — ASIS Sovereign ZKP & ML-DSA-65 Attestation Client
// ============================================================================
// Connects Oraya SaaS to the sovereign ASIS engine running locally on GB10 / server.
// Dispatches STARK proof requests and post-quantum digital signature operations.
// ============================================================================

import { logger } from "./logger";

export interface AttestGovernanceRequest {
    model_id: string;
    timestamp: string;
    input_hash: string;
    output_hash: string;
    governance_hash?: string;
}

export interface AttestationMetadata {
    id: string;
    algorithm: string;
    signer_public_key: string;
    jurisdiction?: string;
    epoch_id?: number;
    attested_at: string;
    expires_at?: string;
}

export interface Attestation<T = any> {
    payload: T;
    stark_proof?: string; // base64 / hex serialized bytes
    public_inputs?: any;
    signature: number[];  // ML-DSA-65 signature bytes
    metadata: AttestationMetadata;
}

export interface AttestationVerificationResult {
    pqc_valid: boolean;
    zkp_valid: boolean | null;
    canonical_hash: number[];
    verified_at: string;
    signer_public_key: string;
    algorithm: string;
}

export interface AsisApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}

export class AsisClient {
    private baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || process.env.ASIS_SERVER_URL || "http://127.0.0.1:9191";
    }

    /**
     * Check health and identity of the ASIS Sovereign node.
     */
    async getHealth(): Promise<{ status: string; algorithm: string; public_key_hex: string; prover_mode: string } | null> {
        try {
            const res = await fetch(`${this.baseUrl}/api/v1/health`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.timeout(3000),
            });
            if (!res.ok) return null;
            const body: AsisApiResponse<any> = await res.json();
            return body.data || null;
        } catch {
            return null;
        }
    }

    /**
     * Generate an SP1 STARK proof and ML-DSA-65 post-quantum signature for an inference leaf.
     */
    async attestGovernance(req: AttestGovernanceRequest): Promise<Attestation | null> {
        try {
            const res = await fetch(`${this.baseUrl}/api/v1/attest/governance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req),
            });

            if (!res.ok) {
                const errText = await res.text();
                logger.warn("[asis-client] attest_governance failed", { status: res.status, error: errText });
                return null;
            }

            const body: AsisApiResponse<Attestation> = await res.json();
            return body.data || null;
        } catch (err: any) {
            logger.warn("[asis-client] connection error during attest_governance", { error: err?.message });
            return null;
        }
    }

    /**
     * Verify an attestation envelope (PQC signature + SP1 STARK proof).
     */
    async verifyAttestation(attestation: Attestation, circuitId?: string): Promise<AttestationVerificationResult | null> {
        try {
            const res = await fetch(`${this.baseUrl}/api/v1/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attestation,
                    circuit_id: circuitId,
                }),
            });

            if (!res.ok) {
                const errText = await res.text();
                logger.warn("[asis-client] verify failed", { status: res.status, error: errText });
                return null;
            }

            const body: AsisApiResponse<AttestationVerificationResult> = await res.json();
            return body.data || null;
        } catch (err: any) {
            logger.warn("[asis-client] connection error during verify", { error: err?.message });
            return null;
        }
    }
}

export const asisClient = new AsisClient();
