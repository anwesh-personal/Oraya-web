import { NextRequest, NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";
import { verifySuperadminToken } from "./superadmin-middleware";
import { assertSaaSAccess, type SaaSAccess } from "./saas-rbac";

export type SaaSGuard =
    | { session: SessionPayload }
    | { response: NextResponse };

/**
 * Route-level SaaS gate. Prefer passing `request` so Bearer and cookie
 * both work. Cookie-only handlers (no NextRequest) fall back to getSession.
 */
export async function requireSaaSSession(
    access: SaaSAccess,
    request?: NextRequest
): Promise<SaaSGuard> {
    const session = request
        ? (await verifySuperadminToken(request)).session ?? null
        : await getSession();
    const gate = assertSaaSAccess(session, access);
    if (!gate.ok) {
        return {
            response: NextResponse.json(
                { error: gate.error },
                { status: gate.status }
            ),
        };
    }
    return { session: session as SessionPayload };
}
