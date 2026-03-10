import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifySuperadminToken } from "@/lib/superadmin-middleware";

export const dynamic = "force-dynamic";

// =============================================================================
// Master Engine CRUD
// Engines are bundles of provider slots (LLM, Image, Audio, Video)
// that can be deployed to individual users or entire plans.
// =============================================================================

// GET — List all master engines with their provider slot counts
export async function GET(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const { data: engines, error } = await (supabase as any)
            .from("master_engines")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch slot counts per engine
        const engineIds = (engines || []).map((e: any) => e.id);

        const slotsMap: Record<string, any[]> = {};
        if (engineIds.length > 0) {
            const { data: slots } = await (supabase as any)
                .from("engine_provider_slots")
                .select("*")
                .in("engine_id", engineIds)
                .order("category", { ascending: true })
                .order("priority", { ascending: true });

            // Group slots by engine_id
            (slots || []).forEach((slot: any) => {
                if (!slotsMap[slot.engine_id]) slotsMap[slot.engine_id] = [];
                slotsMap[slot.engine_id].push(slot);
            });
        }

        // Fetch deployment counts per engine
        const deploymentCounts: Record<string, number> = {};
        if (engineIds.length > 0) {
            const { data: deployments } = await (supabase as any)
                .from("engine_deployments")
                .select("master_engine_id")
                .in("master_engine_id", engineIds)
                .eq("status", "active");

            (deployments || []).forEach((d: any) => {
                deploymentCounts[d.master_engine_id] = (deploymentCounts[d.master_engine_id] || 0) + 1;
            });
        }

        // Merge
        const enriched = (engines || []).map((engine: any) => ({
            ...engine,
            slots: slotsMap[engine.id] || [],
            slot_count: (slotsMap[engine.id] || []).length,
            deployment_count: deploymentCounts[engine.id] || 0,
            categories: {
                llm: (slotsMap[engine.id] || []).filter((s: any) => s.category === "llm").length,
                image: (slotsMap[engine.id] || []).filter((s: any) => s.category === "image").length,
                audio: (slotsMap[engine.id] || []).filter((s: any) => s.category === "audio").length,
                video: (slotsMap[engine.id] || []).filter((s: any) => s.category === "video").length,
            },
        }));

        return NextResponse.json({ engines: enriched });
    } catch (error) {
        console.error("Error fetching engines:", error);
        return NextResponse.json(
            { error: "Failed to fetch engines" },
            { status: 500 }
        );
    }
}

// POST — Create a new master engine with its provider slots
export async function POST(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const body = await request.json();
        const { name, description, slots } = body;

        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return NextResponse.json(
                { error: "Engine name is required (min 2 characters)" },
                { status: 400 }
            );
        }

        // Create the engine
        const { data: engine, error: engineError } = await (supabase as any)
            .from("master_engines")
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                status: "active",
            })
            .select()
            .single();

        if (engineError) {
            if (engineError.code === "23505") {
                return NextResponse.json(
                    { error: "An engine with this name already exists" },
                    { status: 409 }
                );
            }
            throw engineError;
        }

        // Insert provider slots if provided
        if (slots && Array.isArray(slots) && slots.length > 0) {
            const validCategories = ["llm", "image", "audio", "video"];
            const slotsToInsert = slots
                .filter((s: any) => s.managed_key_id && validCategories.includes(s.category))
                .map((s: any, index: number) => ({
                    engine_id: engine.id,
                    managed_key_id: s.managed_key_id,
                    category: s.category,
                    selected_model: s.selected_model || null,
                    is_enabled: s.is_enabled !== false,
                    priority: s.priority ?? index,
                }));

            if (slotsToInsert.length > 0) {
                const { error: slotsError } = await (supabase as any)
                    .from("engine_provider_slots")
                    .insert(slotsToInsert);

                if (slotsError) {
                    console.error("Error inserting engine slots:", slotsError);
                    // Engine was created but slots failed — return partial success with warning
                    return NextResponse.json(
                        {
                            engine: { ...engine, slots: [], slot_count: 0, deployment_count: 0 },
                            warning: `Engine created but slots failed: ${slotsError.message}`,
                        },
                        { status: 207 } // Multi-Status: partial success
                    );
                }
            }
        }

        // Re-fetch with slots
        const { data: fullEngine } = await (supabase as any)
            .from("master_engines")
            .select("*")
            .eq("id", engine.id)
            .single();

        const { data: insertedSlots } = await (supabase as any)
            .from("engine_provider_slots")
            .select("*")
            .eq("engine_id", engine.id)
            .order("priority", { ascending: true });

        return NextResponse.json(
            {
                engine: {
                    ...fullEngine,
                    slots: insertedSlots || [],
                    slot_count: (insertedSlots || []).length,
                    deployment_count: 0,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating engine:", error);
        return NextResponse.json(
            { error: "Failed to create engine" },
            { status: 500 }
        );
    }
}

// PATCH — Update engine metadata or its slots
export async function PATCH(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    try {
        const body = await request.json();
        const { id, name, description, status, slots } = body;

        if (!id) {
            return NextResponse.json({ error: "Engine ID is required" }, { status: 400 });
        }

        // Update engine metadata
        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (name !== undefined) updates.name = name.trim();
        if (description !== undefined) updates.description = description?.trim() || null;
        if (status !== undefined) updates.status = status;

        const { error: updateError } = await (supabase as any)
            .from("master_engines")
            .update(updates)
            .eq("id", id);

        if (updateError) throw updateError;

        // If slots are provided, do a full replace (delete old → insert new)
        if (slots && Array.isArray(slots)) {
            // Delete existing slots
            await (supabase as any)
                .from("engine_provider_slots")
                .delete()
                .eq("engine_id", id);

            // Insert new slots
            const validCategories = ["llm", "image", "audio", "video"];
            const slotsToInsert = slots
                .filter((s: any) => s.managed_key_id && validCategories.includes(s.category))
                .map((s: any, index: number) => ({
                    engine_id: id,
                    managed_key_id: s.managed_key_id,
                    category: s.category,
                    selected_model: s.selected_model || null,
                    is_enabled: s.is_enabled !== false,
                    priority: s.priority ?? index,
                }));

            if (slotsToInsert.length > 0) {
                const { error: slotsError } = await (supabase as any)
                    .from("engine_provider_slots")
                    .insert(slotsToInsert);

                if (slotsError) {
                    console.error("Error updating engine slots:", slotsError);
                    return NextResponse.json(
                        { error: `Engine updated but slots failed: ${slotsError.message}` },
                        { status: 207 }
                    );
                }
            }
        }

        // Return updated engine
        const { data: updatedEngine } = await (supabase as any)
            .from("master_engines")
            .select("*")
            .eq("id", id)
            .single();

        const { data: updatedSlots } = await (supabase as any)
            .from("engine_provider_slots")
            .select("*")
            .eq("engine_id", id)
            .order("priority", { ascending: true });

        return NextResponse.json({
            engine: {
                ...updatedEngine,
                slots: updatedSlots || [],
                slot_count: (updatedSlots || []).length,
            },
        });
    } catch (error) {
        console.error("Error updating engine:", error);
        return NextResponse.json(
            { error: "Failed to update engine" },
            { status: 500 }
        );
    }
}

// DELETE — Archive (soft delete) an engine
export async function DELETE(request: NextRequest) {
    const authResult = await verifySuperadminToken(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const hard = searchParams.get("hard") === "true";

    if (!id) {
        return NextResponse.json({ error: "Engine ID is required" }, { status: 400 });
    }

    try {
        if (hard) {
            // Hard delete: remove slots first (CASCADE would handle this, but be explicit)
            await (supabase as any).from("engine_provider_slots").delete().eq("engine_id", id);
            await (supabase as any).from("engine_deployments").delete().eq("master_engine_id", id);
            const { error } = await (supabase as any).from("master_engines").delete().eq("id", id);
            if (error) throw error;
        } else {
            // Soft delete: archive the engine
            const { error } = await (supabase as any)
                .from("master_engines")
                .update({ status: "archived", updated_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting engine:", error);
        return NextResponse.json(
            { error: "Failed to delete engine" },
            { status: 500 }
        );
    }
}
