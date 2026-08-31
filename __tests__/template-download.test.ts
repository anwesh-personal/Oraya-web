/**
 * Plan 065 T0-4 — template download must be authed and tier-gated.
 *
 * Run: npx tsx --test __tests__/template-download.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";
import {
    assembleTemplateDownloadPayload,
    decideTemplateDownloadAccess,
    runTemplateDownload,
    type TemplateDownloadPayload,
    type TemplateRecord,
} from "../lib/template-download";

const ROOT = join(__dirname, "..");
const PRO_UUID = "11111111-1111-4111-8111-111111111111";
const FREE_UUID = "22222222-2222-4222-8222-222222222222";

const proTemplate: TemplateRecord = {
    id: PRO_UUID,
    name: "Paid OrakhosAgent",
    core_prompt: "SECRET_CORE_PROMPT",
    plan_tier: "pro",
    is_active: true,
};

function secretPayload(): TemplateDownloadPayload {
    return assembleTemplateDownloadPayload(proTemplate, {
        prompt_layers: [{ content: "SECRET_LAYER" }],
        examples: [],
        knowledge_bases: [{ content: "SECRET_KB" }],
        rules: [{ content: "SECRET_RULE" }],
        factory_memories: [{ content: "SECRET_MEMORY" }],
    });
}

describe("decideTemplateDownloadAccess", () => {
    it("logged-out GET of a known pro UUID is 401", () => {
        const decision = decideTemplateDownloadAccess({
            userId: null,
            template: proTemplate,
            accessibleTemplateIds: new Set([PRO_UUID]),
        });
        assert.equal(decision.status, 401);
    });

    it("free-tier session of a pro UUID is 403", () => {
        const decision = decideTemplateDownloadAccess({
            userId: "user-free",
            template: proTemplate,
            accessibleTemplateIds: new Set([FREE_UUID]),
        });
        assert.equal(decision.status, 403);
    });

    it("entitled session of a pro UUID is 200", () => {
        const decision = decideTemplateDownloadAccess({
            userId: "user-pro",
            template: proTemplate,
            accessibleTemplateIds: new Set([PRO_UUID]),
        });
        assert.equal(decision.status, 200);
    });

    it("missing or inactive template is 404, not 403", () => {
        const decision = decideTemplateDownloadAccess({
            userId: "user-pro",
            template: null,
            accessibleTemplateIds: new Set(),
        });
        assert.equal(decision.status, 404);
    });
});

describe("runTemplateDownload GET semantics", () => {
    it("logged-out GET of a known pro UUID → 401 and never loads IP", async () => {
        let payloadLoads = 0;
        let templateLoads = 0;
        const result = await runTemplateDownload({
            userId: null,
            templateId: PRO_UUID,
            loadTemplate: async () => {
                templateLoads += 1;
                return proTemplate;
            },
            loadAccessibleTemplateIds: async () => [PRO_UUID],
            loadPayload: async () => {
                payloadLoads += 1;
                return secretPayload();
            },
        });
        assert.equal(result.status, 401);
        assert.equal(templateLoads, 0);
        assert.equal(payloadLoads, 0);
        assert.ok(!("core_prompt" in result.body));
        assert.equal((result.body as { error: string }).error, "Unauthorized");
    });

    it("free-tier session of a pro UUID → 403 and never loads IP", async () => {
        let payloadLoads = 0;
        const result = await runTemplateDownload({
            userId: "user-free",
            templateId: PRO_UUID,
            loadTemplate: async () => proTemplate,
            loadAccessibleTemplateIds: async () => [FREE_UUID],
            loadPayload: async () => {
                payloadLoads += 1;
                return secretPayload();
            },
        });
        assert.equal(result.status, 403);
        assert.equal(payloadLoads, 0);
        assert.ok(!("core_prompt" in result.body));
        assert.equal((result.body as { error: string }).error, "Forbidden");
    });

    it("entitled session of a pro UUID → 200 with the real payload", async () => {
        const result = await runTemplateDownload({
            userId: "user-pro",
            templateId: PRO_UUID,
            loadTemplate: async () => proTemplate,
            loadAccessibleTemplateIds: async () => [PRO_UUID],
            loadPayload: async (template) =>
                assembleTemplateDownloadPayload(template, {
                    prompt_layers: [],
                    examples: [],
                    knowledge_bases: [],
                    rules: [],
                    factory_memories: [],
                }),
        });
        assert.equal(result.status, 200);
        if (result.status === 200) {
            assert.equal(result.body.id, PRO_UUID);
            assert.equal(result.body.core_prompt, "SECRET_CORE_PROMPT");
            assert.equal(result.body.plan_tier, "pro");
        }
    });

    it("explicit assignment entitles a free user (RPC SSOT, not UUID hiding)", async () => {
        const result = await runTemplateDownload({
            userId: "user-free-assigned",
            templateId: PRO_UUID,
            loadTemplate: async () => proTemplate,
            loadAccessibleTemplateIds: async () => [PRO_UUID],
            loadPayload: async (template) =>
                assembleTemplateDownloadPayload(template, {
                    prompt_layers: [],
                    examples: [],
                    knowledge_bases: [],
                    rules: [],
                    factory_memories: [],
                }),
        });
        assert.equal(result.status, 200);
    });
});

describe("route wires auth + get_user_accessible_agents", () => {
    const src = readFileSync(
        join(ROOT, "app/api/templates/[id]/download/route.ts"),
        "utf8"
    );

    it("requires desktop Bearer or cookie session before service-role fetch", () => {
        assert.match(src, /authenticateDesktopRequest/);
        assert.match(src, /createServerSupabaseClient/);
        assert.match(src, /auth\.getUser/);
        assert.match(src, /runTemplateDownload/);
        const authAt = src.indexOf("await resolveTemplateDownloadAuth");
        const serviceAt = src.indexOf("const supabase = createServiceRoleClient");
        assert.ok(authAt > 0 && serviceAt > authAt);
    });

    it("enforces get_user_accessible_agents, not UUID obscurity", () => {
        assert.match(src, /get_user_accessible_agents/);
        assert.match(src, /p_user_id/);
        assert.doesNotMatch(src, /hashTemplateId|obfuscat|hideUuid|scramble/i);
    });
});
