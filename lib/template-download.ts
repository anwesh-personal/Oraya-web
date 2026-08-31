/**
 * Template-download access (Plan 065 T0-4).
 *
 * Entitlement is the same predicate as `get_user_accessible_agents`
 * (`supabase/migrations/047_structured_agent_data.sql:145`):
 *   plan_tier_rank(template.plan_tier) <= plan_tier_rank(user.plan_id)
 *   OR an explicit active assignment (push / individual override).
 *
 * Callers pass the RPC result as `accessibleTemplateIds` — do not
 * reimplement rank locally (ranks are `plans.display_order`, dynamic).
 */

export type TemplateDownloadDecision =
    | { status: 401; error: "Unauthorized" }
    | { status: 403; error: "Forbidden" }
    | { status: 404; error: "Template not found or inactive" }
    | { status: 200 };

export type TemplateRecord = {
    id: string;
    name: string;
    emoji?: string | null;
    role?: string | null;
    tagline?: string | null;
    description?: string | null;
    core_prompt?: string | null;
    personality_config?: unknown;
    plan_tier?: string | null;
    category?: string | null;
    tags?: string[] | null;
    version?: string | null;
    author?: string | null;
    factory_version?: number | null;
    factory_published_at?: string | null;
    is_active?: boolean;
};

export type TemplateDownloadPayload = {
    id: string;
    name: string;
    emoji: string | null;
    role: string | null;
    tagline: string | null;
    description: string | null;
    core_prompt: string | null;
    personality_config: unknown;
    plan_tier: string | null;
    category: string | null;
    tags: string[] | null;
    version: string | null;
    author: string | null;
    prompt_layers: unknown[];
    examples: unknown[];
    knowledge_bases: unknown[];
    rules: unknown[];
    factory_version: number;
    factory_published_at: string | null;
    factory_memories: unknown[];
    downloaded_at: string;
};

export type TemplateDownloadResult =
    | { status: 401 | 403 | 404; body: { error: string } }
    | { status: 200; body: TemplateDownloadPayload };

export function decideTemplateDownloadAccess(input: {
    userId: string | null;
    template: { id: string } | null;
    accessibleTemplateIds: ReadonlySet<string> | null;
}): TemplateDownloadDecision {
    if (!input.userId) {
        return { status: 401, error: "Unauthorized" };
    }
    if (!input.template) {
        return { status: 404, error: "Template not found or inactive" };
    }
    if (
        !input.accessibleTemplateIds ||
        !input.accessibleTemplateIds.has(input.template.id)
    ) {
        return { status: 403, error: "Forbidden" };
    }
    return { status: 200 };
}

export async function runTemplateDownload(opts: {
    userId: string | null;
    templateId: string;
    loadTemplate: (id: string) => Promise<TemplateRecord | null>;
    loadAccessibleTemplateIds: (userId: string) => Promise<string[]>;
    loadPayload: (template: TemplateRecord) => Promise<TemplateDownloadPayload>;
}): Promise<TemplateDownloadResult> {
    if (!opts.userId) {
        return { status: 401, body: { error: "Unauthorized" } };
    }

    const template = await opts.loadTemplate(opts.templateId);
    const accessibleTemplateIds = template
        ? new Set(await opts.loadAccessibleTemplateIds(opts.userId))
        : null;

    const decision = decideTemplateDownloadAccess({
        userId: opts.userId,
        template,
        accessibleTemplateIds,
    });

    if (decision.status !== 200) {
        return { status: decision.status, body: { error: decision.error } };
    }

    return { status: 200, body: await opts.loadPayload(template as TemplateRecord) };
}

export function assembleTemplateDownloadPayload(
    template: TemplateRecord,
    layers: {
        prompt_layers: unknown[];
        examples: unknown[];
        knowledge_bases: unknown[];
        rules: unknown[];
        factory_memories: unknown[];
    },
    downloadedAt: Date = new Date()
): TemplateDownloadPayload {
    return {
        id: template.id,
        name: template.name,
        emoji: template.emoji ?? null,
        role: template.role ?? null,
        tagline: template.tagline ?? null,
        description: template.description ?? null,
        core_prompt: template.core_prompt ?? null,
        personality_config: template.personality_config ?? null,
        plan_tier: template.plan_tier ?? null,
        category: template.category ?? null,
        tags: template.tags ?? null,
        version: template.version ?? null,
        author: template.author ?? null,
        prompt_layers: layers.prompt_layers,
        examples: layers.examples,
        knowledge_bases: layers.knowledge_bases,
        rules: layers.rules,
        factory_version: template.factory_version ?? 0,
        factory_published_at: template.factory_published_at ?? null,
        factory_memories: layers.factory_memories,
        downloaded_at: downloadedAt.toISOString(),
    };
}
