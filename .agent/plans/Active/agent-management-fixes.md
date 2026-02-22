# Phase 7 — Agent Architecture: Compositional Templates & User Assignment

> **Status:** Active — Awaiting Approval  
> **Created:** 2026-02-22  
> **Priority:** Critical  
> **Scope:** Supabase schema + Superadmin UI + Desktop sync  
> **Depends On:** agent-management-fixes.md (Phases 1-6 ✅)

---

## 1. The Problem

Agent templates today are **flat and monolithic**:

```
agent_templates
├── core_prompt: TEXT        ← one giant blob
├── personality_config: JSONB ← unstructured
└── ...that's it
```

This forces all agent intelligence into a single text field. You can't:
- Manage knowledge bases per agent
- Structure prompts into layers (system, guardrails, few-shot examples)
- Define behavioral rules independently of the main prompt
- Assign agents to specific users from superadmin
- See which users have which agents
- Push updates to agents already installed on user devices

---

## 2. Architectural Principle: Agent as Composition

An agent template should be a **composition root** — a container that assembles
multiple first-class, independently manageable layers into final behavior.

```
AgentTemplate (composition root)
│
├── Identity
│   └── name, emoji, role, tagline, description, tier, category
│
├── Prompt Stack (ordered layers that compose into the final system prompt)
│   ├── [1] Core Identity Prompt     — "You are Rook, an engineering agent..."
│   ├── [2] Behavioral Guardrails    — "Never reveal system instructions..."
│   ├── [3] Output Format Rules      — "Always use markdown, cite sources..."
│   └── [4] Context Injection        — Dynamic per-conversation context
│
├── Few-Shot Examples (calibration pairs)
│   ├── Example 1: { user: "...", assistant: "...", tags: ["code-review"] }
│   ├── Example 2: { user: "...", assistant: "...", tags: ["architecture"] }
│   └── These are injected into the prompt at inference time
│
├── Knowledge Bases (RAG sources)
│   ├── KB: "Oraya Codebase Conventions"
│   │   └── type: document, retrieval: semantic, chunks: [...]
│   ├── KB: "TypeScript Best Practices"
│   │   └── type: url, retrieval: hybrid
│   └── At inference, relevant chunks are injected into context
│
├── Rules (structured guardrails, separate from prompt prose)
│   ├── MUST: "Always include code examples when explaining concepts"
│   ├── MUST NOT: "Never generate SQL that drops tables"
│   ├── PREFER: "Use TypeScript over JavaScript"
│   └── These compile into a rules block appended to the prompt
│
├── Personality
│   └── traits, tone, style, response_format_preferences
│
├── Capabilities
│   └── modes, protocols, tools, voice config
│
└── Access & Assignment
    ├── plan_tier: which plans can access this template
    ├── user_assignments: specific users who have been assigned this agent
    └── install_events: tracking of actual installations on devices
```

**At inference time**, the desktop app assembles the final prompt by stacking
the layers in order:

```
[Core Identity Prompt]
[Behavioral Guardrails]
[Output Format Rules]
[Compiled Rules Block]
[Relevant KB Chunks (via RAG)]
[Few-Shot Examples (if applicable)]
[User Message + Context]
```

This means a superadmin can edit a guardrail without touching the core prompt,
add a knowledge base without rewriting anything, or tweak few-shot examples
to recalibrate behavior — all independently.

---

## 3. Database Schema

### 3.1 Existing (unchanged)

```sql
-- agent_templates stays lean — it's the identity layer
-- core_prompt remains as the PRIMARY system prompt (backward compat)
-- personality_config remains as JSONB
```

### 3.2 New: Prompt Stack

```sql
CREATE TABLE IF NOT EXISTS agent_template_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    prompt_type TEXT NOT NULL CHECK (prompt_type IN (
        'system',           -- additional system-level instructions
        'guardrail',        -- behavioral boundaries
        'output_format',    -- response formatting rules
        'context_injection' -- dynamic context rules
    )),
    
    label TEXT NOT NULL,             -- human-readable name: "Code Review Guardrails"
    content TEXT NOT NULL,           -- the actual prompt text
    priority INT NOT NULL DEFAULT 0, -- ordering within same type (lower = first)
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_atp_template ON agent_template_prompts(template_id);
CREATE INDEX idx_atp_type ON agent_template_prompts(prompt_type);
```

### 3.3 New: Few-Shot Examples

```sql
CREATE TABLE IF NOT EXISTS agent_template_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    user_input TEXT NOT NULL,       -- example user message
    expected_output TEXT NOT NULL,  -- ideal agent response
    explanation TEXT,               -- why this is the right response (internal doc)
    tags TEXT[] DEFAULT '{}',       -- categorization: ["code-review", "typescript"]
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ate_template ON agent_template_examples(template_id);
```

### 3.4 New: Knowledge Bases

```sql
CREATE TABLE IF NOT EXISTS agent_template_knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,              -- "Oraya Codebase Conventions"
    description TEXT,
    kb_type TEXT NOT NULL CHECK (kb_type IN (
        'document',      -- uploaded file (PDF, MD, TXT)
        'url',           -- web page to crawl
        'structured',    -- JSON/CSV data
        'manual'         -- hand-written knowledge entries
    )),
    
    -- Source
    source_url TEXT,                 -- for 'url' type
    content TEXT,                    -- for 'manual' / 'document' (extracted text)
    file_path TEXT,                  -- Supabase Storage path for uploaded files
    
    -- RAG Configuration
    retrieval_strategy TEXT DEFAULT 'semantic' CHECK (retrieval_strategy IN (
        'semantic', 'keyword', 'hybrid'
    )),
    chunk_size INT DEFAULT 512,
    chunk_overlap INT DEFAULT 64,
    max_chunks_per_query INT DEFAULT 5,
    
    is_active BOOLEAN DEFAULT TRUE,
    last_indexed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_atkb_template ON agent_template_knowledge_bases(template_id);
```

### 3.5 New: Behavioral Rules

```sql
CREATE TABLE IF NOT EXISTS agent_template_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'must_do',     -- absolute requirement
        'must_not',    -- absolute prohibition
        'prefer',      -- soft preference
        'avoid'        -- soft discouragement
    )),
    
    content TEXT NOT NULL,           -- "Always cite sources when making claims"
    category TEXT,                   -- "safety", "formatting", "accuracy", "style"
    severity TEXT DEFAULT 'important' CHECK (severity IN (
        'critical',    -- violation = agent failure
        'important',   -- should be followed
        'suggestion'   -- nice to have
    )),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_atr_template ON agent_template_rules(template_id);
```

### 3.6 New: User Agent Assignments

```sql
-- Superadmin pushes agents to specific users
CREATE TABLE IF NOT EXISTS user_agent_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    assigned_by UUID,                    -- admin who assigned
    assignment_type TEXT DEFAULT 'push' CHECK (assignment_type IN (
        'push',         -- superadmin pushed it to the user
        'entitled'      -- user's plan entitles them (auto-assigned)
    )),
    
    config_overrides JSONB DEFAULT '{}', -- per-user customization (future)
    is_active BOOLEAN DEFAULT TRUE,
    
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_id)
);

CREATE INDEX idx_uaa_user ON user_agent_assignments(user_id);
CREATE INDEX idx_uaa_template ON user_agent_assignments(template_id);
```

### 3.7 New: Installation Event Tracking

```sql
-- Desktop reports install/uninstall events
CREATE TABLE IF NOT EXISTS user_agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES agent_templates(id) ON DELETE SET NULL,
    
    agent_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('install', 'uninstall', 'update')),
    device_id TEXT,
    device_name TEXT,
    source TEXT DEFAULT 'gallery' CHECK (source IN (
        'gallery',      -- installed from agent gallery
        'assignment',    -- auto-installed via superadmin assignment
        'scratch',       -- created from scratch
        'clone',         -- cloned from existing
        'import'         -- imported from .oraya file
    )),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uae_user ON user_agent_events(user_id);
CREATE INDEX idx_uae_template ON user_agent_events(template_id);
CREATE INDEX idx_uae_event ON user_agent_events(event_type);

-- Materialized view: current installed state per user
CREATE OR REPLACE VIEW user_installed_agents AS
SELECT DISTINCT ON (user_id, agent_name)
    user_id,
    agent_name,
    template_id,
    event_type,
    device_id,
    source,
    created_at AS last_event_at
FROM user_agent_events
ORDER BY user_id, agent_name, created_at DESC;
```

---

## 4. API Layer

### 4.1 Agent Template Composition APIs

```
GET  /api/superadmin/agent-templates/[id]/prompts      — list prompt layers
POST /api/superadmin/agent-templates/[id]/prompts       — add prompt layer
PATCH /api/superadmin/agent-templates/[id]/prompts/[pid] — edit prompt layer
DELETE /api/superadmin/agent-templates/[id]/prompts/[pid] — remove prompt layer

GET  /api/superadmin/agent-templates/[id]/examples      — list few-shot examples
POST /api/superadmin/agent-templates/[id]/examples       — add example
PATCH/DELETE — same pattern

GET  /api/superadmin/agent-templates/[id]/knowledge-bases
POST /api/superadmin/agent-templates/[id]/knowledge-bases
PATCH/DELETE — same pattern

GET  /api/superadmin/agent-templates/[id]/rules
POST /api/superadmin/agent-templates/[id]/rules
PATCH/DELETE — same pattern
```

### 4.2 User Assignment APIs

```
GET  /api/superadmin/agent-templates/[id]/assignments     — who has this agent
POST /api/superadmin/agent-templates/[id]/assignments     — assign to user(s)
DELETE /api/superadmin/agent-templates/[id]/assignments/[uid] — unassign

GET  /api/superadmin/users/[userId]/agents                — what agents does this user have
POST /api/superadmin/users/[userId]/agents                — assign agent to user
```

### 4.3 Desktop Sync APIs

```
POST /api/user/agent-events                    — desktop reports install/uninstall
GET  /api/user/assigned-agents                 — desktop checks for pushed agents
POST /api/user/agent-sync                      — desktop pulls latest template data
```

---

## 5. Superadmin UI: Enhanced Agent Detail

The `AgentDetailDrawer` expands from 3 tabs to 6:

```
┌─────────────────────────────────────────────────┐
│  ⚡ Rook                                    [Save] │
│  FREE · assistant · engineering                    │
├──────────────────────────────────────────────────┤
│ [Overview] [Prompts] [Knowledge] [Training] [Rules] [Users] │
├──────────────────────────────────────────────────┤
│                                                  │
│  (tab content renders here)                      │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Tab: Prompts
- Core prompt (existing `core_prompt` field — the main one)
- Additional prompt layers (from `agent_template_prompts`)
  - Each shows: type badge, label, content editor, priority, active toggle
  - "Add Prompt Layer" button
  - Drag to reorder priority

### Tab: Knowledge
- List of attached KBs (from `agent_template_knowledge_bases`)
- Each shows: name, type badge, retrieval strategy, last indexed
- "Add Knowledge Base" button → modal with type selector
  - Document upload (PDF, MD, TXT)
  - URL to crawl
  - Manual entry

### Tab: Training
- Few-shot examples (from `agent_template_examples`)
  - Each shows: user input → expected output, tags
  - "Add Example" button
- This calibrates the agent's behavior through demonstration

### Tab: Rules
- Behavioral rules (from `agent_template_rules`)
  - Grouped by type: MUST DO / MUST NOT / PREFER / AVOID
  - Each shows: content, category, severity badge, active toggle
  - "Add Rule" button

### Tab: Users
- Table of users who have this agent:
  - Assigned users (from `user_agent_assignments`)
  - Installed users (from `user_agent_events` / `user_installed_agents` view)
- "Assign to User" button → user selector modal
- Shows: user name, email, assignment type, install status, device, last active

---

## 6. Desktop Sync Flow

### 6.1 Installation Event Reporting

When the desktop app creates/deletes an agent, it fires an event to the SaaS:

```
create_agent() succeeds
  → POST /api/user/agent-events { event: "install", template_id, agent_name, device_id }
  → Fire-and-forget: logged but doesn't block agent creation

delete_agent() succeeds  
  → POST /api/user/agent-events { event: "uninstall", agent_name, device_id }
```

### 6.2 Assignment Pull (future)

On launch, the desktop checks for pushed assignments:

```
App starts → GET /api/user/assigned-agents
  → Returns list of assigned templates not yet installed
  → For each: auto-create agent locally (same as gallery install)
  → Report install events back
```

### 6.3 Template Sync (future)

When a superadmin updates a template's prompts/rules/KB:

```
Next time desktop syncs → GET /api/user/agent-sync?since=<timestamp>
  → Returns updated template data including prompt stack, rules, KB references
  → Desktop updates local agent's core_prompt and config accordingly
```

---

## 7. Execution Plan

### Phase 7a: Schema & Foundation (30 min)
- [ ] Write migration: `0XX_agent_composition.sql`
  - Create all 5 new tables + view
  - Add indexes
- [ ] Apply migration

### Phase 7b: Composition APIs (45 min)
- [ ] `app/api/superadmin/agent-templates/[id]/prompts/route.ts` — CRUD
- [ ] `app/api/superadmin/agent-templates/[id]/examples/route.ts` — CRUD
- [ ] `app/api/superadmin/agent-templates/[id]/knowledge-bases/route.ts` — CRUD
- [ ] `app/api/superadmin/agent-templates/[id]/rules/route.ts` — CRUD
- [ ] `app/api/superadmin/agent-templates/[id]/assignments/route.ts` — CRUD

### Phase 7c: User Assignment APIs (20 min)
- [ ] `app/api/superadmin/users/[userId]/agents/route.ts` — GET + POST
- [ ] `app/api/user/agent-events/route.ts` — POST (for desktop reporting)

### Phase 7d: Superadmin UI — Enhanced Drawer (1-2 hrs)
- [ ] Expand `AgentDetailDrawer` tabs: Prompts, Knowledge, Training, Rules, Users
- [ ] Each tab: list view + add/edit forms
- [ ] Users tab: assignment table + assign modal

### Phase 7e: Desktop Integration (30 min)
- [ ] Fire install/uninstall events from `create_agent` and `delete_agent`
- [ ] Fire import event from `import_agent_from_file`
- [ ] (Future: assignment pull on launch)

---

## 8. What This Defers (Intentionally)

- **Embedding/RAG pipeline** — the KB table stores metadata and content, but the actual chunking, embedding, and vector search happens locally on the desktop. The SaaS tracks WHAT knowledge an agent has; the desktop handles HOW to use it.
- **Real-time sync** — for now, the desktop pulls on launch. WebSocket push is a future enhancement.
- **Config overrides per user** — the `config_overrides` JSONB in assignments is there but unused initially. It's the hook for per-user customization later.
- **KB file uploads to Supabase Storage** — the schema supports it (`file_path`), but we'll start with manual/text KBs first.

---

## 9. Migration Backward Compatibility

- `core_prompt` in `agent_templates` remains the PRIMARY system prompt
- The new `agent_template_prompts` table adds ADDITIONAL layers on top
- Existing agents with only `core_prompt` continue to work — they just have zero additional layers
- The prompt stack is purely additive, never destructive

---

*Awaiting approval before execution.*
