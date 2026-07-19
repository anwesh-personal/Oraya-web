// ============================================================================
// agent-runtime / inference — provider resolution + dispatch (blocking + stream)
// ============================================================================
// The single authoritative inference path for the web chatbot. Resolves an
// ORDERED list of credential candidates honouring the precedence:
//
//   [sovereign gateway (opt-in)] → BYOK (widget.user_provider_id) → managed keys
//
// The sovereign orchestrated gateway is a FIRST-CLASS, config-driven path:
//   • It is added ONLY when the widget opts in (config.use_sovereign_gateway).
//   • When opted in but the gateway ENV is missing, resolution FAILS LOUD
//     (requireGatewayConfig throws) — never a silent fallback that hides misconfig.
//   • Existing widgets that do NOT opt in resolve EXACTLY as before (BYOK→managed).
//
// A runtime gateway error (network/5xx) may fall back to BYOK/managed — that is
// resilience, not misconfiguration hiding.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, InferenceCandidate, InferencePlan, BlockingInferenceResult } from "./types";
import { decryptKey } from "./crypto-keys";
import { buildUpstreamRequest, parseBlockingResponse } from "./providers";
import { requireGatewayConfig, GATEWAY_CHAT_PATH } from "./gateway";

/**
 * Carries an HTTP status + machine-readable code so routes surface an honest,
 * structured error to the caller instead of silently degrading.
 */
export class InferenceError extends Error {
    status: number;
    code: string;
    constructor(status: number, message: string, code = "inference_error") {
        super(message);
        this.name = "InferenceError";
        this.status = status;
        this.code = code;
    }
}

/** Returns a trimmed non-empty string, or null. Used for model resolution. */
function nonEmpty(v: unknown): string | null {
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

/**
 * Builds the ordered inference plan for a widget. Reads user_ai_providers +
 * managed_ai_keys with the service-role client (public runtime path).
 * Throws (loud) if the sovereign path is opted-in but unconfigured.
 */
export async function resolveInferencePlan(params: {
    supabase: SupabaseClient;
    widget: any;
}): Promise<InferencePlan> {
    const { supabase, widget } = params;
    const cfg: Record<string, any> = widget.config || {};
    const usesGateway = cfg.use_sovereign_gateway === true;
    const candidates: InferenceCandidate[] = [];

    // ── Dynamic model resolution (NO hardcoded external default, ever) ──
    // Precedence (first non-empty wins):
    //   1. widget config.model            (set via the UI's dynamic model picker)
    //   2. widget.model_override          (legacy per-deployment DB column, mig 049)
    //   3. sovereign gateway routing default — ONLY when the widget opted into
    //      the sovereign path (added below); this is the gateway's own Sentra
    //      routing sentinel, not an external provider model.
    //   4. otherwise → FAIL LOUD (see below). We NEVER substitute a literal like
    //      gpt-4o-mini; a silent external-model fallback is deceptive.
    // NOTE: an "agent template configured model" tier is intentionally NOT wired
    //   here because agent_templates has no model column today (migration 021);
    //   see the deferral note in the change report.
    let model: string | null = nonEmpty(cfg.model) || nonEmpty(widget.model_override);

    // ── Sovereign orchestrated gateway (opt-in, first-class) ──
    if (usesGateway) {
        const gw = requireGatewayConfig(); // fail loud if unconfigured
        candidates.push({
            source: "sovereign-gateway",
            provider: "oraya", // OpenAI-compatible dispatch/parsing
            apiKey: gw.orakKey,
            endpointUrl: gw.baseUrl + GATEWAY_CHAT_PATH,
            isGateway: true,
        });
        // Gateway path may resolve the model itself via its routing sentinel when
        // the widget has not pinned one. An explicit config.gateway_model wins.
        model = nonEmpty(cfg.gateway_model) || model || gw.defaultModel;
    }

    // ── BYOK: the deployer's own provider ──
    if (widget.user_provider_id) {
        const { data: up } = await supabase
            .from("user_ai_providers")
            .select("provider, api_key_encrypted, base_url, is_active, is_valid")
            .eq("id", widget.user_provider_id)
            .single();
        if (up?.is_active && up?.is_valid && up?.api_key_encrypted) {
            const dk = decryptKey(up.api_key_encrypted);
            if (dk) {
                const providerName = up.provider === "custom" && up.base_url ? "custom" : up.provider;
                candidates.push({
                    source: "byok",
                    provider: providerName,
                    apiKey: dk,
                    baseUrl: up.base_url || undefined,
                });
            }
        }
    }

    // ── Managed admin keys (ordered by priority) ──
    const { data: slots } = await supabase
        .from("managed_ai_keys")
        .select("provider, api_key, priority")
        .eq("is_active", true)
        .order("priority", { ascending: true });
    if (slots) {
        for (const slot of slots) {
            candidates.push({ source: "managed", provider: slot.provider, apiKey: slot.api_key });
        }
    }

    // ── Fail loud: no model could be resolved. Never substitute a default. ──
    if (!nonEmpty(model)) {
        throw new InferenceError(
            422,
            "No AI model is configured for this widget. Set the model in the widget's " +
                "AI Model settings (config.model), a per-deployment model_override, or enable " +
                "the sovereign gateway. Refusing to silently substitute a default model.",
            "no_model_configured",
        );
    }

    return {
        candidates,
        model: model as string,
        temperature: widget.temperature,
        maxTokens: widget.max_tokens,
    };
}

/**
 * Blocking inference. Tries candidates in order until one returns content.
 * Throws InferenceError(503) when no candidate exists, InferenceError(502) when
 * every candidate failed.
 */
export async function callInferenceBlocking(
    plan: InferencePlan,
    messages: ChatMessage[],
): Promise<BlockingInferenceResult> {
    if (plan.candidates.length === 0) {
        throw new InferenceError(503, "No AI providers configured");
    }

    const failures: string[] = [];
    for (const c of plan.candidates) {
        try {
            const req = buildUpstreamRequest({
                provider: c.provider,
                apiKey: c.apiKey,
                model: plan.model,
                messages,
                temperature: plan.temperature,
                maxTokens: plan.maxTokens,
                stream: false,
                baseUrl: c.baseUrl,
                endpointUrl: c.endpointUrl,
            });
            const res = await fetch(req.url, {
                method: "POST",
                headers: req.headers,
                body: JSON.stringify(req.body),
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => "Unknown error");
                failures.push(`${c.source}/${c.provider} ${res.status}: ${errText.slice(0, 200)}`);
                continue;
            }
            const data = await res.json();
            const { content, totalTokens } = parseBlockingResponse(c.provider, data);
            if (content) {
                return {
                    content,
                    totalTokens,
                    source: c.source,
                    provider: c.provider,
                    model: plan.model,
                };
            }
            failures.push(`${c.source}/${c.provider}: empty response`);
        } catch (err: any) {
            failures.push(`${c.source}/${c.provider}: ${err?.message || "error"}`);
        }
    }

    throw new InferenceError(502, `All AI providers failed: ${failures.join(" | ")}`);
}

export interface OpenStreamResult {
    response: Response;
    candidate: InferenceCandidate;
}

/**
 * Opens a streaming upstream for the first candidate that connects OK. Returns
 * the raw upstream Response (with a readable body) + the candidate used so the
 * caller can pick the right chunk parser. Throws InferenceError on exhaustion.
 */
export async function openInferenceStream(
    plan: InferencePlan,
    messages: ChatMessage[],
): Promise<OpenStreamResult> {
    if (plan.candidates.length === 0) {
        throw new InferenceError(503, "No AI provider available");
    }

    const failures: string[] = [];
    for (const c of plan.candidates) {
        try {
            const req = buildUpstreamRequest({
                provider: c.provider,
                apiKey: c.apiKey,
                model: plan.model,
                messages,
                temperature: plan.temperature,
                maxTokens: plan.maxTokens,
                stream: true,
                baseUrl: c.baseUrl,
                endpointUrl: c.endpointUrl,
            });
            const res = await fetch(req.url, {
                method: "POST",
                headers: req.headers,
                body: JSON.stringify(req.body),
            });
            if (!res.ok || !res.body) {
                const errText = await res.text().catch(() => "Unknown");
                failures.push(`${c.source}/${c.provider} ${res.status}: ${errText.slice(0, 200)}`);
                continue;
            }
            return { response: res, candidate: c };
        } catch (err: any) {
            failures.push(`${c.source}/${c.provider}: ${err?.message || "error"}`);
        }
    }

    throw new InferenceError(502, `Provider error: ${failures.join(" | ")}`);
}
