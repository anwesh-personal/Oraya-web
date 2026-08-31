/**
 * Plan 065 — factory-updates must re-check plan tier (same class as T0-4).
 *
 * Run: npx tsx --test __tests__/factory-updates.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import { runFactoryUpdates, type FactoryMemoryRow } from "../lib/factory-updates";

const ROOT = join(__dirname, "..");
const PRO_UUID = "11111111-1111-4111-8111-111111111111";
const FREE_UUID = "22222222-2222-4222-8222-222222222222";

const secretMemory: FactoryMemoryRow = {
    factory_id: "fm-secret",
    category: "instruction",
    content: "SECRET_FACTORY_MEMORY",
    importance: 1,
    tags: null,
    version_added: 3,
};

const proTemplate = {
    id: PRO_UUID,
    name: "Paid OrakhosAgent",
    factory_version: 3,
    factory_published_at: "2026-08-01T00:00:00Z",
};

describe("runFactoryUpdates POST semantics", () => {
    it("entitled template_id → 200 with factory memories", async () => {
        let memoryLoads = 0;
        const result = await runFactoryUpdates({
            userId: "user-pro",
            agents: [{ template_id: PRO_UUID, current_version: 1 }],
            loadAccessibleTemplateIds: async () => [PRO_UUID],
            loadTemplate: async () => proTemplate,
            loadMemories: async () => {
                memoryLoads += 1;
                return [secretMemory];
            },
        });
        assert.equal(result.status, 200);
        assert.equal(memoryLoads, 1);
        if (result.status === 200) {
            assert.equal(result.body.updates.length, 1);
            assert.equal(result.body.updates[0].template_id, PRO_UUID);
            assert.equal(result.body.updates[0].latest_version, 3);
            assert.equal(result.body.updates[0].memories[0].content, "SECRET_FACTORY_MEMORY");
        }
    });

    it("over-tier template_id → 403 and never loads factory memories", async () => {
        let memoryLoads = 0;
        const result = await runFactoryUpdates({
            userId: "user-free",
            agents: [{ template_id: PRO_UUID, current_version: 0 }],
            loadAccessibleTemplateIds: async () => [FREE_UUID],
            loadTemplate: async () => proTemplate,
            loadMemories: async () => {
                memoryLoads += 1;
                return [secretMemory];
            },
        });
        assert.equal(result.status, 403);
        assert.equal(memoryLoads, 0);
        assert.ok(!("updates" in result.body));
        assert.equal((result.body as { error: string }).error, "Forbidden");
    });

    it("explicit assignment entitles a free user (RPC SSOT, not UUID hiding)", async () => {
        const result = await runFactoryUpdates({
            userId: "user-free-assigned",
            agents: [{ template_id: PRO_UUID, current_version: 1 }],
            loadAccessibleTemplateIds: async () => [PRO_UUID],
            loadTemplate: async () => proTemplate,
            loadMemories: async () => [secretMemory],
        });
        assert.equal(result.status, 200);
        if (result.status === 200) {
            assert.equal(result.body.updates[0].memories[0].content, "SECRET_FACTORY_MEMORY");
        }
    });

    it("mixed batch with one over-tier id is 403 and leaks no memories", async () => {
        let memoryLoads = 0;
        const result = await runFactoryUpdates({
            userId: "user-free",
            agents: [
                { template_id: FREE_UUID, current_version: 0 },
                { template_id: PRO_UUID, current_version: 0 },
            ],
            loadAccessibleTemplateIds: async () => [FREE_UUID],
            loadTemplate: async (id) =>
                id === PRO_UUID
                    ? proTemplate
                    : {
                          id: FREE_UUID,
                          name: "Free agent",
                          factory_version: 2,
                          factory_published_at: null,
                      },
            loadMemories: async () => {
                memoryLoads += 1;
                return [secretMemory];
            },
        });
        assert.equal(result.status, 403);
        assert.equal(memoryLoads, 0);
    });

    it("missing template is skipped (200 empty), not 403", async () => {
        const result = await runFactoryUpdates({
            userId: "user-pro",
            agents: [{ template_id: PRO_UUID, current_version: 0 }],
            loadAccessibleTemplateIds: async () => [PRO_UUID],
            loadTemplate: async () => null,
            loadMemories: async () => [secretMemory],
        });
        assert.equal(result.status, 200);
        if (result.status === 200) {
            assert.deepEqual(result.body.updates, []);
        }
    });

    it("entitled but already current → 200 with empty updates (desktop no-op)", async () => {
        let memoryLoads = 0;
        const result = await runFactoryUpdates({
            userId: "user-pro",
            agents: [{ template_id: PRO_UUID, current_version: 3 }],
            loadAccessibleTemplateIds: async () => [PRO_UUID],
            loadTemplate: async () => proTemplate,
            loadMemories: async () => {
                memoryLoads += 1;
                return [secretMemory];
            },
        });
        assert.equal(result.status, 200);
        assert.equal(memoryLoads, 0);
        if (result.status === 200) {
            assert.deepEqual(result.body.updates, []);
        }
    });

    it("logged-out is 401 and never loads memories", async () => {
        let memoryLoads = 0;
        let rpcLoads = 0;
        const result = await runFactoryUpdates({
            userId: null,
            agents: [{ template_id: PRO_UUID, current_version: 0 }],
            loadAccessibleTemplateIds: async () => {
                rpcLoads += 1;
                return [PRO_UUID];
            },
            loadTemplate: async () => proTemplate,
            loadMemories: async () => {
                memoryLoads += 1;
                return [secretMemory];
            },
        });
        assert.equal(result.status, 401);
        assert.equal(memoryLoads, 0);
        assert.equal(rpcLoads, 0);
    });
});

describe("route wires auth + get_user_accessible_agents", () => {
    const src = readFileSync(
        join(ROOT, "app/api/user/factory-updates/route.ts"),
        "utf8"
    );

    it("keeps desktop Bearer auth before service-role fetch", () => {
        assert.match(src, /authenticateDesktopRequest/);
        assert.match(src, /runFactoryUpdates/);
        const authAt = src.indexOf("await authenticateDesktopRequest");
        const serviceAt = src.indexOf("const serviceClient = createServiceRoleClient");
        assert.ok(authAt > 0 && serviceAt > authAt);
    });

    it("enforces get_user_accessible_agents, not UUID obscurity", () => {
        assert.match(src, /get_user_accessible_agents/);
        assert.match(src, /p_user_id/);
        assert.doesNotMatch(src, /hashTemplateId|obfuscat|hideUuid|scramble/i);
    });
});
