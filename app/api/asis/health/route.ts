import { NextResponse } from "next/server";
import { asisClient } from "@/lib/asis-client";
import {
    ASIS_NOT_ON_THIS_PLANE,
    DEFAULT_HONESTY,
    LEAVES_DISCLAIMER,
    honestyFromHealth,
    PROOFS_PENDING,
} from "@/lib/asis-honesty";

export const dynamic = "force-dynamic";

const OFFLINE_DATA = {
    status: "offline",
    algorithm: "",
    public_key_hex: "",
    prover_mode: "offline" as const,
    uptime_seconds: 0,
};

/**
 * Fail-open like partner: engine down → 200 + honest offline, never 503 the dashboard.
 */
export async function GET() {
    try {
        const health = await asisClient.getHealth();
        if (!health) {
            return NextResponse.json({
                success: true,
                offline: true,
                honesty: DEFAULT_HONESTY,
                data: OFFLINE_DATA,
                error: ASIS_NOT_ON_THIS_PLANE,
                kind: "governance_leaves",
                disclaimer: LEAVES_DISCLAIMER,
                proofsPending: PROOFS_PENDING,
            });
        }
        const honesty = honestyFromHealth(health);
        return NextResponse.json({
            success: true,
            offline: !honesty.engineReachable,
            honesty,
            data: {
                ...health,
                prover_mode: honesty.proverMode,
            },
            kind: "governance_leaves",
            disclaimer: LEAVES_DISCLAIMER,
        });
    } catch {
        return NextResponse.json({
            success: true,
            offline: true,
            honesty: DEFAULT_HONESTY,
            data: OFFLINE_DATA,
            error: ASIS_NOT_ON_THIS_PLANE,
            kind: "governance_leaves",
            disclaimer: LEAVES_DISCLAIMER,
            proofsPending: PROOFS_PENDING,
        });
    }
}
