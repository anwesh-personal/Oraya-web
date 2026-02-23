import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
    authenticateDesktopRequest,
    isAuthError,
} from "@/lib/desktop-auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateDesktopRequest(request);
        if (isAuthError(authResult)) {
            return authResult;
        }

        const userId = authResult.userId;
        const supabase = createServiceRoleClient();

        // Fetch agents available to this user (Push + Entitled based on Plan)
        const { data, error } = await (supabase.rpc as any)("get_user_accessible_agents", {
            p_user_id: userId,
        });

        if (error) {
            throw error;
        }

        let pushAgents: any[] = [];
        if (data) {
            pushAgents = data
                .filter((a: any) => a.assignment_type === "push")
                .map((a: any) => ({
                    id: a.template_id,
                    name: a.template_name,
                    emoji: a.template_emoji,
                    tagline: a.template_tagline,
                    description: a.template_description,
                    category: a.template_category,
                    plan_tier: a.template_plan_tier,
                    version: a.template_version,
                    tags: a.template_tags,
                    personality_config: a.template_personality,
                    core_prompt: a.config_overrides?.core_prompt || "", // Fallback
                    role: a.config_overrides?.role || "assistant", // Fallback
                    factory_version: a.factory_version,
                    icon_url: a.template_icon_url,
                }));
        }

        return NextResponse.json({
            ok: true,
            push_agents: pushAgents,
        });
    } catch (error) {
        logger.error("Sync agents failed", error, { endpoint: "sync-agents" });
        return NextResponse.json(
            { error: "Internal server error", code: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
