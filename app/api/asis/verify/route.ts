import { NextRequest, NextResponse } from "next/server";
import { asisClient } from "@/lib/asis-client";
import {
    DEFAULT_HONESTY,
    coerceVerifyForHonesty,
    honestyFromHealth,
    offlineVerifyResult,
} from "@/lib/asis-honesty";

export const dynamic = "force-dynamic";

/**
 * Fail-open verify: engine down / mock prover → 200 with zkp_valid null.
 * Never paint a cryptographic pass from an offline or mock prover.
 */
export async function POST(req: NextRequest) {
    let honesty = DEFAULT_HONESTY;
    try {
        const health = await asisClient.getHealth();
        honesty = health ? honestyFromHealth(health) : DEFAULT_HONESTY;
    } catch {
        honesty = DEFAULT_HONESTY;
    }

    try {
        const body = await req.json();
        const { attestation, circuit_id } = body;

        if (!attestation) {
            return NextResponse.json(
                { success: false, error: "Missing attestation object" },
                { status: 400 },
            );
        }

        const result = await asisClient.verifyAttestation(attestation, circuit_id);
        if (!result) {
            return NextResponse.json({
                success: true,
                offline: !honesty.engineReachable,
                honesty,
                data: coerceVerifyForHonesty(
                    {
                        ...offlineVerifyResult(),
                        canonical_hash: [],
                        verified_at: new Date().toISOString(),
                        signer_public_key: "",
                        algorithm: "",
                    },
                    honesty,
                ),
            });
        }

        return NextResponse.json({
            success: true,
            honesty,
            offline: !honesty.engineReachable,
            data: coerceVerifyForHonesty(result, honesty),
        });
    } catch {
        return NextResponse.json({
            success: true,
            offline: true,
            honesty,
            data: coerceVerifyForHonesty(
                {
                    ...offlineVerifyResult(),
                    canonical_hash: [],
                    verified_at: new Date().toISOString(),
                    signer_public_key: "",
                    algorithm: "",
                },
                honesty,
            ),
        });
    }
}
