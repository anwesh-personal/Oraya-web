// ============================================================================
// agent-runtime / types — shared shapes for the web chatbot runtime.
// ============================================================================
// The single authoritative types for prompt composition + inference dispatch,
// shared by the embed chat routes (blocking + streaming) and, later, by the
// omnichannel adapters and proactive worker. Kept intentionally minimal and
// derived from the REAL widget_deployments columns (migration 049) + config
// JSONB (051) so nothing here is speculative.
// ============================================================================

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
    role: ChatRole;
    content: string;
    /** Optional client-side timestamp preserved in the session JSONB. */
    ts?: number;
}

/**
 * The subset of a widget_deployments row (joined with agent_templates) that the
 * runtime needs. We keep it permissive (`[key: string]: any`) because the route
 * fetches `select("*")` and we don't want to fight the generated DB types here —
 * the fields we actually read are enumerated for clarity + safety.
 */
export interface WidgetRuntimeRow {
    id: string;
    user_id: string;
    template_id: string | null;
    api_key: string;

    system_prompt_override: string | null;
    model_override: string | null;
    temperature: number;
    max_tokens: number;
    max_history: number;

    prompt_stack: any[] | null;
    training_data: any[] | null;
    knowledge_base: any[] | null;
    rules: any[] | null;

    user_provider_id: string | null;
    config: Record<string, any> | null;

    agent_templates?: {
        id: string;
        name: string;
        emoji?: string | null;
        core_prompt?: string | null;
        personality_config?: any;
    } | null;

    [key: string]: any;
}

/** A grounded knowledge-base chunk retrieved for the current turn. */
export interface RetrievedChunk {
    chunk_id: string;
    source_id: string;
    content: string;
    source_title: string;
    source_url: string | null;
    score: number;
}

/** A citation surfaced to the widget client (deduped by source). */
export interface Citation {
    source_id: string;
    title: string;
    url: string | null;
}

export type RagStatus =
    | "off"        // no KB configured for this deployment
    | "grounded"   // retrieval succeeded, context injected
    | "empty"      // KB exists but no relevant chunk cleared the threshold
    | "degraded";  // embedder/retrieval failed — answered WITHOUT grounding (honest)

export interface RagResult {
    status: RagStatus;
    chunks: RetrievedChunk[];
    citations: Citation[];
    /** Human-readable reason when status is 'degraded' (never hidden). */
    error?: string;
}

export type MemoryStatus = "off" | "active" | "degraded";

export interface ResolvedIdentity {
    endUserId: string;
    channelIdentityId: string;
    conversationId: string;
    memoryThreadId: string;
}

export interface MemoryResult {
    status: MemoryStatus;
    /** Recalled memory rendered as a prompt block, or null if nothing recalled. */
    context: string | null;
    identity: ResolvedIdentity | null;
    error?: string;
}

/** Where a resolved inference credential came from (for logging + lineage). */
export type InferenceSource = "sovereign-gateway" | "byok" | "managed";

export interface InferenceCandidate {
    source: InferenceSource;
    provider: string;      // openai | anthropic | google | oraya | custom | ...
    apiKey: string;
    baseUrl?: string;
    /** Fully-qualified endpoint (used by the sovereign gateway's /api/v1 path). */
    endpointUrl?: string;
    /** True for the ENV-configured sovereign orchestrated gateway. */
    isGateway?: boolean;
}

export interface InferencePlan {
    candidates: InferenceCandidate[];
    model: string;
    temperature: number;
    maxTokens: number;
}

export interface BlockingInferenceResult {
    content: string;
    totalTokens: number;
    source: InferenceSource;
    provider: string;
    model: string;
}
