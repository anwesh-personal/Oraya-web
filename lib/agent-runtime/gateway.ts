// ============================================================================
// agent-runtime / gateway — PER-WIDGET sovereign gateway resolution.
// ============================================================================
// The sovereign gateway (an OpenAI-compatible orchestrated /chat/completions +
// /embeddings service) is resolved DYNAMICALLY PER WIDGET/TENANT from that
// widget's own provider configuration — the SAME source the chat inference path
// uses (BYOK `user_ai_providers` via widget.user_provider_id).
//
// There is NO global platform env var for the gateway. There is NO hardcoded
// URL, key, model, or embedding model. If a widget has no sovereign/embedder
// provider configured, RAG + embeddings are honestly OFF for that widget
// (fail-loud / degraded, never a silent substitution).
//
// Config source of truth (per widget):
//   • base URL + ORAK key  → the widget's `user_ai_providers` row (base_url +
//                            decrypted api_key_encrypted).
//   • embedding model      → widget `config.embedding_model` (explicit; never a
//                            hardcoded default).
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptKey } from "./crypto-keys";

export interface GatewayConfig {
    /** API root from the widget's provider config, no trailing slash. */
    baseUrl: string;
    /** ORAK / provider key used as the Bearer credential for the gateway. */
    orakKey: string;
    /**
     * Embedding model id — MUST be explicitly set in the widget config. It is a
     * valid client-chosen value, never an implicit hardcoded fallback. Its
     * output dimension must match the vector(1024) DB columns (validated at
     * embed time, fail-loud on mismatch).
     */
    embeddingModel: string;
}

function normalizeBaseUrl(raw: string): string {
    return raw.trim().replace(/\/+$/, "");
}

function nonEmpty(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

/** Builds the OpenAI-compatible embeddings endpoint from a config base URL. */
export function buildEmbeddingsUrl(baseUrl: string): string {
    return normalizeBaseUrl(baseUrl) + "/v1/embeddings";
}

/**
 * Resolves the per-widget gateway/embedder config from the widget's OWN provider
 * configuration. Returns null (embedder OFF for this widget) when the widget has
 * not configured a provider base URL + key + explicit embedding model. NEVER
 * reads a global env var and NEVER substitutes a literal host/key/model.
 *
 * The base URL + key come from the widget's `user_ai_providers` row
 * (widget.user_provider_id). The embedding model comes from
 * `widget.config.embedding_model`. All three are required; any missing → null.
 */
export async function resolveWidgetGateway(params: {
    supabase: SupabaseClient;
    widget: any;
}): Promise<GatewayConfig | null> {
    const { supabase, widget } = params;
    const cfg: Record<string, any> = widget?.config || {};

    const embeddingModel = nonEmpty(cfg.embedding_model);
    if (!embeddingModel) return null; // no explicit embedder model → OFF (honest)

    const providerId = widget?.user_provider_id;
    if (!providerId) return null; // no provider configured → OFF

    const { data: up } = await supabase
        .from("user_ai_providers")
        .select("api_key_encrypted, base_url, is_active, is_valid")
        .eq("id", providerId)
        .single();

    if (!up?.is_active || !up?.is_valid || !up?.base_url || !up?.api_key_encrypted) {
        return null; // provider not usable / no endpoint configured → OFF
    }

    const key = decryptKey(up.api_key_encrypted);
    if (!key) return null; // key undecryptable → OFF (never a literal key)

    return {
        baseUrl: normalizeBaseUrl(up.base_url),
        orakKey: key,
        embeddingModel,
    };
}
