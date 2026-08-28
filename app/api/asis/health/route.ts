import { NextResponse } from "next/server";
import { asisClient } from "@/lib/asis-client";

export async function GET() {
    try {
        const health = await asisClient.getHealth();
        if (!health) {
            return NextResponse.json(
                { success: false, error: "ASIS sovereign engine is offline" },
                { status: 503 }
            );
        }
        return NextResponse.json({ success: true, data: health });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || "Internal error" },
            { status: 500 }
        );
    }
}
