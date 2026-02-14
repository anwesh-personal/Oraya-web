import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";
import { providers, providerList, getAllModels, getModel } from "@/lib/ai-providers";

export const dynamic = "force-dynamic";

// GET - Fetch model registry with pricing
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    const category = searchParams.get("category");
    const modelId = searchParams.get("model");

    try {
        // If requesting a specific model
        if (modelId && provider) {
            const model = getModel(provider as any, modelId);
            if (!model) {
                return NextResponse.json({ error: "Model not found" }, { status: 404 });
            }
            return NextResponse.json({ model });
        }

        // Get all models with optional filters
        let models = getAllModels();

        if (provider) {
            models = models.filter(m => m.provider === provider);
        }

        if (category) {
            models = models.filter(m => m.category === category);
        }

        // Get provider summaries
        const providerSummaries = providerList.map(p => ({
            id: p.id,
            name: p.name,
            logo: p.logo,
            color: p.color,
            bgColor: p.bgColor,
            status: p.status,
            modelCount: p.models.length,
            defaultModel: p.defaultModel,
            recommendedModel: p.recommendedModel,
        }));

        return NextResponse.json({
            providers: providerSummaries,
            models,
            categories: [
                { id: 'flagship', name: 'Flagship', description: 'Most capable models' },
                { id: 'standard', name: 'Standard', description: 'Balanced performance' },
                { id: 'fast', name: 'Fast', description: 'Optimized for speed' },
                { id: 'economy', name: 'Economy', description: 'Cost-effective options' },
                { id: 'reasoning', name: 'Reasoning', description: 'Advanced reasoning models' },
                { id: 'vision', name: 'Vision', description: 'Image understanding' },
                { id: 'embedding', name: 'Embedding', description: 'Text embeddings' },
            ],
        });
    } catch (error) {
        console.error("Error fetching models:", error);
        return NextResponse.json(
            { error: "Failed to fetch models" },
            { status: 500 }
        );
    }
}

// POST - Update pricing from database (for admin to refresh pricing)
export async function POST(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Fetch current pricing from database
        const { data: pricing, error } = await supabase
            .from("ai_provider_pricing")
            .select("*")
            .eq("is_active", true);

        if (error) throw error;

        // Return the database pricing for comparison/update
        return NextResponse.json({
            databasePricing: pricing,
            registryModels: getAllModels().map(m => ({
                provider: m.provider,
                model: m.modelId,
                input: m.pricing.input,
                output: m.pricing.output,
            })),
        });
    } catch (error) {
        console.error("Error syncing pricing:", error);
        return NextResponse.json(
            { error: "Failed to sync pricing" },
            { status: 500 }
        );
    }
}
