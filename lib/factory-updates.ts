/**
 * Factory-memory OTA access (Plan 065 — adjacent to T0-4).
 *
 * Same entitlement predicate as `get_user_accessible_agents`
 * (`supabase/migrations/047_structured_agent_data.sql:145`):
 *   plan_tier_rank(template.plan_tier) <= plan_tier_rank(user.plan_id)
 *   OR an explicit active assignment.
 *
 * Callers pass the RPC result as `accessibleTemplateIds` — do not
 * reimplement rank locally (ranks are `plans.display_order`, dynamic).
 *
 * Desktop caller (FactoryPatchDaemon): POST `{ agents: [{ template_id,
 * current_version }] }` with Bearer. 200 body stays `{ updates: [...] }`.
 * An existing over-tier `template_id` fails the whole request (403, no
 * memories) — same fail-closed class as template download.
 */

import { decideTemplateDownloadAccess } from "@/lib/template-download";

export type FactoryAgentVersion = {
    template_id: string;
    current_version: number;
};

export type FactoryTemplateMeta = {
    id: string;
    name: string;
    factory_version: number | null;
    factory_published_at: string | null;
};

export type FactoryMemoryRow = {
    factory_id: string;
    category: string;
    content: string;
    importance: number;
    tags: string[] | null;
    version_added: number;
};

export type FactoryUpdate = {
    template_id: string;
    template_name: string;
    from_version: number;
    latest_version: number;
    published_at: string | null;
    memories: FactoryMemoryRow[];
};

export type FactoryUpdatesResult =
    | { status: 401; body: { error: string } }
    | { status: 403; body: { error: string } }
    | { status: 200; body: { updates: FactoryUpdate[] } };

export async function runFactoryUpdates(opts: {
    userId: string | null;
    agents: ReadonlyArray<FactoryAgentVersion>;
    loadAccessibleTemplateIds: (userId: string) => Promise<string[]>;
    loadTemplate: (id: string) => Promise<FactoryTemplateMeta | null>;
    loadMemories: (templateId: string) => Promise<FactoryMemoryRow[] | null>;
}): Promise<FactoryUpdatesResult> {
    if (!opts.userId) {
        return { status: 401, body: { error: "Unauthorized" } };
    }

    if (opts.agents.length === 0) {
        return { status: 200, body: { updates: [] } };
    }

    const accessibleTemplateIds = new Set(
        await opts.loadAccessibleTemplateIds(opts.userId)
    );

    const entitled: Array<{
        agent: FactoryAgentVersion;
        template: FactoryTemplateMeta;
    }> = [];

    for (const agent of opts.agents) {
        if (!agent.template_id) continue;

        const template = await opts.loadTemplate(agent.template_id);
        if (!template) continue;

        const decision = decideTemplateDownloadAccess({
            userId: opts.userId,
            template: { id: template.id },
            accessibleTemplateIds,
        });

        if (decision.status === 403) {
            return { status: 403, body: { error: "Forbidden" } };
        }
        if (decision.status !== 200) {
            return { status: 401, body: { error: "Unauthorized" } };
        }

        entitled.push({ agent, template });
    }

    const updates: FactoryUpdate[] = [];

    for (const { agent, template } of entitled) {
        const latestVersion = template.factory_version ?? 0;
        const clientVersion = agent.current_version ?? 0;
        if (latestVersion <= clientVersion) continue;

        const memories = await opts.loadMemories(template.id);
        if (memories === null) continue;

        updates.push({
            template_id: template.id,
            template_name: template.name,
            from_version: clientVersion,
            latest_version: latestVersion,
            published_at: template.factory_published_at,
            memories,
        });
    }

    return { status: 200, body: { updates } };
}
