import { NextRequest, NextResponse } from "next/server";
import { asisClient } from "@/lib/asis-client";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { attestation, circuit_id } = body;

        if (!attestation) {
            return NextResponse.json(
                { success: false, error: "Missing attestation object" },
                { status: 400 }
            );
        }

        const result = await asisClient.verifyAttestation(attestation, circuit_id);
        if (!result) {
            return NextResponse.json(
                { success: false, error: "Verification failed on sovereign engine" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: result });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || "Internal verification error" },
            { status: 500 }
        );
    }
}
