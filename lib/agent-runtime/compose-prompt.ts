// ============================================================================
// agent-runtime / compose-prompt — the single authoritative prompt builder.
// ============================================================================
// Extracts the (previously duplicated) system-prompt composition from the two
// embed chat routes into ONE function, and FIXES the long-standing quality bug:
// the widget used only the BARE `agent_templates.core_prompt` at runtime, losing
// the template's prompt-stack / examples / rules / manual-KB that desktop
// clients receive. We now seed the base prompt from the COMPILED template
// (the same `get_user_accessible_agents` RPC + migration 046 source desktop
// uses), then layer the widget's own overrides on top — identical layering to
// before, just with a correct base.
//
// RAG grounded context + recalled memory are appended as clearly-delimited
// blocks when present; when absent the prompt is byte-identical to the legacy
// composition (modulo the compiled-base fix), preserving backward compatibility.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, RagResult } from "./types";

export type SyncedBrainRuntimeConfig = {
    promptStack: Array<{ content: string; priority: number; is_active: boolean }>;
    // The widget's existing few-shot semantics are full-list injection. This is
    // intentionally distinct from desktop's relevance-selected training path.
    training: Array<{ role: "user" | "assistant"; content: string; sequence: number }>;
};

/** Fetch canonical opt-in agent configuration without copying it into widgets. */
export async function getSyncedBrainRuntimeConfig(params: {
    supabase: SupabaseClient; userId: string; agentId: string | null | undefined;
}): Promise<SyncedBrainRuntimeConfig | null> {
    const { supabase, userId, agentId } = params;
    if (!agentId) return null;
    const { data: brain } = await (supabase as any).from("agent_brains")
        .select("agent_id").eq("agent_id", agentId).eq("user_id", userId).eq("synced_brain", true).maybeSingle();
    if (!brain) return null;
    const [{ data: stack }, { data: exchanges }] = await Promise.all([
        (supabase as any).from("agent_prompt_stack").select("content,position,is_active")
            .eq("agent_id", agentId).eq("user_id", userId).eq("tombstone", false).order("position"),
        (supabase as any).from("agent_training_exchanges").select("role,content,turn_index")
            .eq("agent_id", agentId).eq("user_id", userId).eq("tombstone", false).order("conversation_id").order("turn_index"),
    ]);
    return {
        promptStack: (stack || []).map((row: any) => ({ content: row.content, priority: row.position, is_active: row.is_active })),
        training: (exchanges || []).filter((row: any) => row.role === "user" || row.role === "assistant")
            .map((row: any) => ({ role: row.role, content: row.content, sequence: row.turn_index })),
    };
}

/**
 * Resolves the COMPILED core prompt for a widget's template using the same RPC
 * (`get_user_accessible_agents`) + compilation (migration 046) as desktop.
 * Falls back to the bare `core_prompt` if the template isn't found in the
 * deployer's accessible set or the RPC is unavailable — so no widget can break.
 */
export async function getCompiledCorePrompt(params: {
    supabase: SupabaseClient;
    userId: string;
    templateId: string | null | undefined;
    fallbackCorePrompt: string;
}): Promise<string> {
    const { supabase, userId, templateId, fallbackCorePrompt } = params;
    if (!templateId) return fallbackCorePrompt;

    try {
        const { data, error } = await supabase.rpc("get_user_accessible_agents" as any, {
            p_user_id: userId,
        });
        if (error || !Array.isArray(data)) return fallbackCorePrompt;
        const row = (data as any[]).find((r) => r.template_id === templateId);
        const compiled = row?.template_core_prompt;
        return typeof compiled === "string" && compiled.trim().length > 0
            ? compiled
            : fallbackCorePrompt;
    } catch {
        return fallbackCorePrompt;
    }
}

export interface ComposeInput {
    widget: any;
    /** Compiled base prompt (from getCompiledCorePrompt); replaces bare core_prompt. */
    compiledCorePrompt: string;
    history: ChatMessage[];
    userMessage: string;
    /** Grounded RAG result for this turn (optional). */
    rag?: RagResult | null;
    /** Recalled memory rendered as a prompt block (optional). */
    memoryContext?: string | null;
    syncedBrain?: SyncedBrainRuntimeConfig | null;
}

export interface ComposeResult {
    messages: ChatMessage[];
    systemPrompt: string;
}

/**
 * Builds the full messages array (system + few-shot + history + user turn) for
 * one inference. Pure: no I/O. Mirrors the legacy layering exactly.
 */
export function composeAgentPrompt(input: ComposeInput): ComposeResult {
    const { widget, compiledCorePrompt, history, userMessage, rag, memoryContext, syncedBrain } = input;
    const cfg: Record<string, any> = widget.config || {};

    // Base: config override → widget override → COMPILED template → empty.
    let systemPrompt =
        cfg.core_prompt_override ||
        widget.system_prompt_override ||
        compiledCorePrompt ||
        "";

    // Personality override (config JSONB)
    if (cfg.personality_override) {
        const po = cfg.personality_override;
        const parts: string[] = [];
        if (po.personality) parts.push(`Personality: ${po.personality}`);
        if (po.style) parts.push(`Communication style: ${po.style}`);
        if (po.tone) parts.push(`Tone: ${po.tone}`);
        if (parts.length) systemPrompt += "\n\n--- Personality ---\n" + parts.join("\n");
    }

    // Tone settings (config JSONB)
    if (cfg.tone) {
        const t = cfg.tone;
        const parts: string[] = [];
        if (t.formality !== undefined) parts.push(`Formality level: ${t.formality}/100`);
        if (t.verbosity !== undefined) parts.push(`Verbosity level: ${t.verbosity}/100`);
        if (t.emoji_usage) parts.push(`Emoji usage: ${t.emoji_usage}`);
        if (t.response_style) parts.push(`Response style: ${t.response_style}`);
        if (parts.length) systemPrompt += "\n\n--- Tone Settings ---\n" + parts.join("\n");
    }

    // Prompt stack — config JSONB preferred, dedicated column fallback
    const promptStack = syncedBrain?.promptStack?.length ? syncedBrain.promptStack
        : (cfg.prompt_stack?.length > 0 ? cfg.prompt_stack : widget.prompt_stack);
    if (promptStack?.length > 0) {
        const stackText = promptStack
            .filter((p: any) => p.is_active !== false)
            .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0))
            .map((p: any) => p.content)
            .join("\n\n");
        if (stackText) systemPrompt += "\n\n" + stackText;
    }

    // Legacy inline knowledge base (JSONB on the widget — distinct from RAG)
    if (widget.knowledge_base?.length > 0) {
        const kbText = widget.knowledge_base
            .filter((k: any) => k.is_active !== false)
            .map((k: any) => `## ${k.name}\n${k.content}`)
            .join("\n\n");
        if (kbText) systemPrompt += "\n\n--- Knowledge Base ---\n" + kbText;
    }

    // Raw context (config JSONB)
    if (cfg.raw_context) {
        systemPrompt += "\n\n--- Additional Context ---\n" + cfg.raw_context;
    }

    // Behavioral rules — config JSONB preferred, dedicated column fallback
    const rulesList = cfg.rules?.length > 0 ? cfg.rules : widget.rules;
    if (rulesList?.length > 0) {
        const rulesText = rulesList
            .filter((r: any) => r.is_active !== false)
            .map((r: any) => {
                const content = r.content || r.rule || "";
                const severity = r.severity || "standard";
                return `- [${severity}] ${content}`;
            })
            .join("\n");
        if (rulesText) systemPrompt += "\n\n--- Behavioral Rules ---\n" + rulesText;
    }

    // ── Recalled memory (appended before RAG so the model treats KB as primary) ──
    if (memoryContext && memoryContext.trim()) {
        systemPrompt += "\n\n--- Remembered Context (about this user) ---\n" + memoryContext.trim();
    }

    // ── RAG grounded context + citation instruction ──
    if (rag && rag.status === "grounded" && rag.chunks.length > 0) {
        const grounded = rag.chunks
            .map((c, i) => `[${i + 1}] ${c.source_title}\n${c.content}`)
            .join("\n\n");
        systemPrompt +=
            "\n\n--- Retrieved Knowledge ---\n" +
            "Use the following sources to ground your answer. Cite them inline as [1], [2], etc. " +
            "If the sources do not contain the answer, say so honestly rather than inventing facts.\n\n" +
            grounded;
    }

    // Build messages array
    const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];

    // Few-shot training examples — config training_qa preferred, column fallback
    const trainingItems =
        syncedBrain?.training?.length
            ? null
            : cfg.training_qa?.length > 0
            ? cfg.training_qa.map((qa: any) => ({
                  user_input: qa.question,
                  expected_output: qa.answer,
                  is_active: true,
              }))
            : widget.training_data;
    if (syncedBrain?.training?.length) {
        for (const exchange of [...syncedBrain.training].sort((a, b) => a.sequence - b.sequence)) {
            messages.push({ role: exchange.role, content: exchange.content });
        }
    } else if (trainingItems?.length > 0) {
        for (const ex of trainingItems.filter((e: any) => e.is_active !== false)) {
            messages.push({ role: "user", content: ex.user_input });
            messages.push({ role: "assistant", content: ex.expected_output });
        }
    }

    // Conversation history (capped to max_history turns)
    messages.push(...history.slice(-(widget.max_history * 2)));

    // Current user message
    messages.push({ role: "user", content: userMessage.trim() });

    return { messages, systemPrompt };
}
