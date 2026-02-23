# Plan: Rich Agent Content Seeding + .oraya Package Completeness

**Status:** AWAITING APPROVAL  
**Created:** 2026-02-23  
**Scope:** Oraya Saas (web platform + download API)

---

## What's Wrong Right Now

The 10 agent templates (Rook, Thalas, Muse, Vigil, Koda, Wraith, Noor, Forge, Lark, Coen) have rich `core_prompt` and `personality_config` already seeded (migration 021). But the **5 composition layers** sitting on top are completely empty:

| Table | Currently |
|---|---|
| `agent_template_prompts` | 0 rows (all agents) |
| `agent_template_examples` | 0 rows (all agents) |
| `agent_template_knowledge_bases` | 0 rows (all agents) |
| `agent_template_rules` | 0 rows (all agents) |
| `agent_template_memories` | 0 rows (all agents) |

The **download endpoint** (`/api/templates/[id]/download`) correctly bundles ALL these layers into the `.oraya` JSON package that the desktop installs. Factory memories also have an OTA patch channel (`/api/user/factory-updates`). So the infrastructure is correct — the content is just missing.

---

## Architecture (Confirmed, Do Not Change)

```
agent_templates                  ← Identity, core_prompt, personality_config ✅ (seeded)
  ├── agent_template_prompts     ← Extra system/guardrail/format/context layers ❌ EMPTY
  ├── agent_template_examples    ← Few-shot training pairs ❌ EMPTY
  ├── agent_template_knowledge_bases ← RAG sources ❌ EMPTY
  ├── agent_template_rules       ← Behavioral guardrails (structured) ❌ EMPTY
  └── agent_template_memories    ← Factory memories (OTA-patchable) ❌ EMPTY

Download flow:
  Desktop → GET /api/templates/[id]/download
           → Returns ALL layers as one JSON payload
           → Desktop installs into local SQLite

OTA Memory Updates:
  Desktop → GET /api/user/factory-updates?agents=[...]
           → Gets delta of factory memories since last version
           → Merges locally (user memories never touched)
```

---

## Plan

### Phase 1 — Write Content (SQL migration: `026_seed_agent_content.sql`)

Write a single idempotent migration that seeds rich content for all 10 agents across all 5 tables. Content will be agent-appropriate and production quality — not placeholders.

#### Per-agent content plan:

**Rook** (⚡ Engineering, Free)
- **Prompts:** "TypeScript Strict Mode enforcer", "Code Review Output Format", "Architecture Reasoning Context Injector"
- **Examples (5):** TypeScript error → typed fix, architecture question → trade-off analysis, PR review request → 5-pass review, debugging session, schema design
- **KB (2):** "Oraya System Architecture" (manual), "TypeScript Best Practices" (manual)
- **Rules (6):** Must provide runnable code, must rate findings by severity, must never use `any`, prefer functional patterns, avoid vague "just use X" advice
- **Factory Memories (8):** Personality, skills (TS/Rust/React/Postgres), context (Oraya system), preferences (type safety, linting), knowledge (Oraya tech stack)

**Thalas** (🪷 Reasoning, Free)
- **Prompts:** "Steel-Man Protocol", "Epistemic Humility Injector"
- **Examples (4):** Ethical dilemma → multi-framework analysis, decision under uncertainty → trade-off map, cognitive bias challenge, philosophy of mind question
- **KB (1):** "Western & Eastern Philosophical Traditions" (manual — key frameworks)
- **Rules (5):** Must steel-man before critiquing, must label confidence levels, never claim moral authority, prefer productive uncertainty, avoid false dichotomies
- **Factory Memories (6):** Personality, reasoning methods, knowledge of phil traditions, preference for Socratic dialogue

**Muse** (✨ Creative, Free)
- **Prompts:** "Specificity Enforcer", "Cliché Detection Layer", "Genre Adaptation System"
- **Examples (5):** Generic story opening → vivid rewrite, flat dialogue → subtext-loaded version, brand tagline brief → 3 options, poetry prompt, editing pass
- **KB (1):** "Craft of Writing: Core Principles" (manual — compressed wisdom from Strunk, King, Lamott)
- **Rules (5):** Must provide craft observations after writing, must eliminate clichés, never produce template-y output, prefer showing over telling, avoid adverbs
- **Factory Memories (7):** Personality, craft principles, genre knowledge, tone adaptation, specificity bias

**Vigil** (🛡️ QA/Engineering, Free)
- **Prompts:** "5-Pass Review Protocol", "Severity Rating System", "Test Specification Format"
- **Examples (4):** Buggy code → 5-pass review with severity ratings, missing tests → full test suite spec, performance problem → profiling guide, security review
- **KB (1):** "OWASP Top 10 + Testing Patterns" (manual)
- **Rules (5):** Must always include the fix not just the finding, must use severity ratings, never block merge for style-only issues, prefer behavior tests over implementation tests
- **Factory Memories (6):** Personality, 5-pass methodology, severity system, testing philosophy

**Koda** (🧿 Strategy, Pro)
- **Prompts:** "Decision Decomposition Protocol", "Second-Order Thinking Enforcer", "Probabilistic Language Injector"
- **Examples (5):** Ambiguous strategic question → reframing + decomposition, build vs buy → decision matrix, product roadmap prioritization, investment thesis analysis, hiring decision
- **KB (2):** "Decision Frameworks Compendium" (manual), "Mental Models Reference" (manual)
- **Rules (6):** Must decompose before solving, must quantify uncertainty, must offer ≥2 options for significant decisions, must surface second-order consequences, never be a yes-man
- **Factory Memories (8):** Personality, supervisor role context, decision frameworks, second-order thinking, Oraya hierarchy context

**Wraith** (🔐 Security, Pro)
- **Prompts:** "STRIDE Threat Model Injector", "CVSS Severity Format", "Remediation First Protocol"
- **Examples (5):** Code audit → OWASP findings with fixes, JWT auth flow → security review, secret management question, incident triage protocol, architecture review for blast radius
- **KB (2):** "OWASP Top 10 Reference" (manual), "Common Cryptography Patterns + Pitfalls" (manual)
- **Rules (6):** Must provide exact fix not just warning, must rate by CVSS severity, never recommend security-through-obscurity as primary, always include blast radius analysis, must flag hardcoded secrets as CRITICAL
- **Factory Memories (8):** Personality, attack methodology, CVSS system, defensive principles, Oraya security context

**Noor** (📊 Data Science, Pro)
- **Prompts:** "Uncertainty Quantification Protocol", "Correlation≠Causation Enforcer", "Statistical Output Format"
- **Examples (4):** Dataset profiling request → structured analysis, A/B test results → correct interpretation with CIs, ML model selection → decision framework, SQL query optimization
- **KB (1):** "Statistical Methods Reference" (manual — key tests, when to use which)
- **Rules (5):** Must always report uncertainty with point estimates, must never claim causation from correlation, must state assumptions explicitly, prefer interpretable models, always start with the question not the method
- **Factory Memories (7):** Personality, statistical principles, ML expertise, data quality obsession

**Forge** (🔧 DevOps, Pro)
- **Prompts:** "IaC-First Protocol", "Observability Output Format", "Rollback Plan Enforcer"
- **Examples (5):** Dockerfile optimization, Kubernetes deployment design, CI/CD pipeline for blue-green, incident runbook creation, SLO/SLI/SLA definition
- **KB (2):** "Kubernetes Patterns Reference" (manual), "Observability Best Practices" (manual — OTel, SLOs)
- **Rules (5):** Must always include rollback procedures, must version everything, never patch in place — replace, must include monitoring/alerting in every design
- **Factory Memories (7):** Personality, IaC philosophy, reliability principles, k8s expertise, on-call culture context

**Lark** (📣 Communications, Pro)
- **Prompts:** "Multiple Angles Protocol", "Jargon Detector", "Audience-First Enforcer"
- **Examples (5):** Investor pitch brief → 3 angle options, landing page rewrite, press release for product launch, internal all-hands update, crisis communication template
- **KB (1):** "Brand Messaging Frameworks" (manual — value props, positioning, AIDA, Jobs-to-be-Done)
- **Rules (5):** Must provide ≥2 options with different angles, must score copy on clarity/impact/audience-fit, must cut jargon, must identify the ONE message per piece
- **Factory Memories (7):** Personality, communication principles, audience obsession, messaging frameworks

**Coen** (🔬 Research, Pro)
- **Prompts:** "Evidence Classification Protocol", "Citation Standard Enforcer", "Speculative vs. Established Guardrail"
- **Examples (4):** Literature review request → structured synthesis, study critique → GRADE appraisal, science comm challenge (simplify without losing accuracy), cross-disciplinary connection
- **KB (1):** "Research Methods + Evidence Hierarchy" (manual — GRADE, CONSORT, Cochrane standards)
- **Rules (5):** Must label evidence: ESTABLISHED/EMERGING/SPECULATIVE, must cite first author + year, never present speculation as fact, must note publication bias risk, must distinguish correlation from mechanism
- **Factory Memories (7):** Personality, scientific principles, evidence hierarchy, cross-disciplinary mindset

---

### Phase 2 — Publish Factory Memories (SQL in same migration)

After inserting all memories, increment `factory_version` to `1` and set `factory_published_at` for all 10 agents, so the OTA system has a proper baseline.

```sql
UPDATE agent_templates SET
    factory_version = 1,
    factory_published_at = NOW()
WHERE name IN ('Rook','Thalas','Muse','Vigil','Koda','Wraith','Noor','Forge','Lark','Coen');
```

---

### Phase 3 — Verify Download Package

After migration runs, manually hit:
```
GET /api/templates/[rook_id]/download
```
And verify the response contains all 5 layers populated. That's what the desktop installs.

---

## Files to Create/Modify

| File | Action |
|---|---|
| `supabase/migrations/026_seed_agent_content.sql` | **CREATE** — ~1200 lines of INSERT statements |
| No UI changes needed | All tabs already have CRUD, download API already bundles everything |

---

## What This Does NOT Change

- No UI changes (all tabs already work)
- No API changes (download endpoint already correct)
- No schema changes (all tables already exist from migration 023)
- No desktop app changes
- No `icon_url` or image upload changes (separate plan)

---

## Estimated Output

~1200 lines of idempotent SQL (`ON CONFLICT DO NOTHING` or `INSERT ... WHERE NOT EXISTS`):
- 10 agents × ~5 prompt layers = ~50 prompts
- 10 agents × ~4.5 examples = ~45 training pairs  
- 10 agents × ~1.5 KBs = ~15 knowledge bases
- 10 agents × ~5 rules = ~50 rules
- 10 agents × ~7 memories = ~70 factory memories

**Total: ~230 content records across all 10 agents.**

---

## Awaiting Your Approval

Reply "go" to proceed with writing migration `026_seed_agent_content.sql`.
