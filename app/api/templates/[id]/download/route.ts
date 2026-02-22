import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ─── GET: Full template download (includes all composition layers) ───────────
// Called by Oraya Desktop when a user installs an agent from the gallery.
// Returns EVERYTHING needed to instantiate the agent locally:
//   - Template identity + config
//   - Prompt layers (ordered)
//   - Few-shot examples (ordered)
//   - Knowledge bases (active only)
//   - Behavioral rules (active only)
//   - Factory memories (active, with factory_ids for OTA sync)
//   - Factory version (for future OTA patching)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: templateId } = await params;
    const supabase = createServiceRoleClient();

    try {
        // 1. Fetch template
        const { data: template, error: tplError } = await (supabase
            .from("agent_templates") as any)
            .select("*")
            .eq("id", templateId)
            .eq("is_active", true)
            .single();

        if (tplError || !template) {
            return NextResponse.json(
                { error: "Template not found or inactive" },
                { status: 404 }
            );
        }

        // 2. Fetch all composition layers in parallel
        const [
            promptsResult,
            examplesResult,
            knowledgeBasesResult,
            rulesResult,
            memoriesResult,
        ] = await Promise.all([
            // Prompt layers (ordered by priority)
            (supabase.from("agent_template_prompts") as any)
                .select("prompt_type, label, content, priority, is_active")
                .eq("template_id", templateId)
                .eq("is_active", true)
                .order("priority", { ascending: true }),

            // Few-shot examples (ordered by sort_order)
            (supabase.from("agent_template_examples") as any)
                .select("user_input, expected_output, explanation, tags, sort_order")
                .eq("template_id", templateId)
                .eq("is_active", true)
                .order("sort_order", { ascending: true }),

            // Knowledge bases (active only, with RAG config)
            (supabase.from("agent_template_knowledge_bases") as any)
                .select(`
                    name, description, kb_type,
                    source_url, content, file_path, file_size_bytes, mime_type,
                    retrieval_strategy, chunk_size, chunk_overlap,
                    max_chunks_per_query, embedding_model,
                    indexing_status, total_chunks
                `)
                .eq("template_id", templateId)
                .eq("is_active", true),

            // Behavioral rules (active, ordered by type + severity)
            (supabase.from("agent_template_rules") as any)
                .select("rule_type, content, category, severity, sort_order")
                .eq("template_id", templateId)
                .eq("is_active", true)
                .order("rule_type", { ascending: true })
                .order("severity", { ascending: true })
                .order("sort_order", { ascending: true }),

            // Factory memories (active, non-removed, with factory_ids for OTA)
            (supabase.from("agent_template_memories") as any)
                .select("factory_id, category, content, importance, tags, version_added")
                .eq("template_id", templateId)
                .eq("is_active", true)
                .is("version_removed", null)
                .order("category", { ascending: true })
                .order("sort_order", { ascending: true }),
        ]);

        // 3. Assemble full download payload
        const payload = {
            // Template identity
            id: template.id,
            name: template.name,
            emoji: template.emoji,
            role: template.role,
            tagline: template.tagline,
            description: template.description,
            core_prompt: template.core_prompt,
            personality_config: template.personality_config,
            plan_tier: template.plan_tier,
            category: template.category,
            tags: template.tags,
            version: template.version,
            author: template.author,

            // Composition layers
            prompt_layers: promptsResult.data || [],
            examples: examplesResult.data || [],
            knowledge_bases: knowledgeBasesResult.data || [],
            rules: rulesResult.data || [],

            // Factory memories
            factory_version: template.factory_version ?? 0,
            factory_published_at: template.factory_published_at ?? null,
            factory_memories: memoriesResult.data || [],

            // Download metadata
            downloaded_at: new Date().toISOString(),
        };

        return NextResponse.json(payload);
    } catch (err: any) {
        console.error("Template download error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
