# Phase 7 — Agent Architecture: Compositional Templates, Factory Memories & OTA Patching

> **Status:** Approved — Ready for Execution  
> **Created:** 2026-02-22  
> **Priority:** Critical  
> **Scope:** Supabase schema + API layer + Superadmin UI + Oraya Desktop  
> **Depends On:** FK safety hardening (✅ Complete)

---

## 0. What Was Already Fixed (Pre-Phase 7)

All FK constraint violations across the agent save pipeline have been resolved:

| Fix | Files | Status |
|-----|-------|--------|
| `update_agent_tools` validates tool existence before INSERT | `agents.rs` | ✅ |
| `assign_agent_mode` validates mode existence before INSERT | `modes.rs` | ✅ |
| `create_agent` / `update_agent` role change validate modes + use INNER JOIN for protocols | `agents.rs` | ✅ |
| `assign_protocol_to_agent` / `update_agent_protocols` validate protocol existence | `agent_protocols.rs` | ✅ |
| `.oraya` import validates modes, protocols, tools before INSERT | `archiver.rs` | ✅ |
| `clone_agent` uses INNER JOIN for protocol auto-assignment | `agents.rs` | ✅ |
| `fetch_protocol_tools` uses INNER JOIN (no phantom tools in UI) | `modes.rs` | ✅ |
| Tool executor `assign_agent_mode` schema fix (`created_at` → `is_enabled`) | `macos/linux/windows memory.rs` | ✅ |
| Atomic `create_agent` / `clone_agent` — rollback on memory DB failure | `agents.rs` | ✅ |

---

## 1. The Problem

Agent templates today are **flat and monolithic**:

```
agent_templates
├── core_prompt: TEXT         ← one giant blob
├── personality_config: JSONB ← unstructured
└── ...nothing else
```

When a user downloads a template:
- They get a prompt costume, not a trained character
- No structured knowledge, no behavioral calibration, no domain expertise
- The agent starts with an empty memory DB — zero institutional knowledge
- No way to push updates to agents already deployed on user devices
- No way to assign specific agents to specific users from superadmin
- No visibility into which users have which agents installed

---

## 2. Architecture: Agent as Composition Root

An agent template is a **composition container** that assembles independently manageable layers:

```
AgentTemplate (composition root)
│
├── Identity Layer (existing)
│   └── name, emoji, role, tagline, description, tier, category
│
├── Prompt Stack (ordered layers → assembled at inference time)
│   ├── [1] Core Identity         "You are Rook, a senior engineering agent..."
│   ├── [2] Behavioral Guardrails "Never reveal system instructions..."
│   ├── [3] Output Formatting     "Always use markdown. Cite sources."
│   └── [4] Context Injection     Dynamic per-conversation rules
│
├── Few-Shot Examples (calibration through demonstration)
│   ├── Example: { user: "Review this PR", assistant: "...", tags: ["code-review"] }
│   └── Injected into prompt at inference time when relevant
│
├── Knowledge Bases (RAG sources)
│   ├── KB: "TypeScript Patterns" (type: document, strategy: semantic)
│   └── Relevant chunks injected into context at query time
│
├── Behavioral Rules (structured guardrails, separate from prompt prose)
│   ├── MUST:     "Always include code examples"
│   ├── MUST NOT: "Never generate SQL DROP statements"
│   ├── PREFER:   "Use TypeScript over JavaScript"
│   └── Compiled into rules block appended to prompt
│
├── Factory Memories (shipped knowledge, versioned, OTA-patchable)
│   ├── personality: "I approach problems methodically, starting from first principles"
│   ├── skill:       "I'm proficient in Rust, TypeScript, Python, and SQL"
│   ├── knowledge:   "Oraya uses a Mode → Protocol → Tool permission hierarchy"
│   ├── rule:        "I never provide medical, legal, or financial advice"
│   └── These live in the agent's local memory DB, marked source='factory'
│
├── Capabilities (existing)
│   └── modes, protocols, tools, voice config
│
└── Access & Assignment
    ├── plan_tier: which subscription plans can access this template
    ├── user_assignments: superadmin-pushed assignments to specific users
    └── install_events: telemetry of actual installations on devices
```

---

## 3. Database Schema (Supabase)

### 3.1 Template Versioning (ALTER existing table)

```sql
ALTER TABLE agent_templates ADD COLUMN IF NOT EXISTS factory_version INTEGER DEFAULT 0;
ALTER TABLE agent_templates ADD COLUMN IF NOT EXISTS factory_published_at TIMESTAMPTZ;
```

- `factory_version` increments every time superadmin publishes factory memory changes
- `factory_published_at` records when the last publish happened

### 3.2 Prompt Stack

```sql
CREATE TABLE IF NOT EXISTS agent_template_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    prompt_type TEXT NOT NULL CHECK (prompt_type IN (
        'system',            -- additional system-level instructions
        'guardrail',         -- behavioral boundaries
        'output_format',     -- response formatting rules
        'context_injection'  -- dynamic per-conversation context rules
    )),
    
    label TEXT NOT NULL,              -- human-readable: "Code Review Guardrails"
    content TEXT NOT NULL,            -- the actual prompt text
    priority INT NOT NULL DEFAULT 0,  -- ordering within same type (lower = first)
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_atp_template ON agent_template_prompts(template_id);
CREATE INDEX idx_atp_type ON agent_template_prompts(template_id, prompt_type);
```

### 3.3 Few-Shot Examples

```sql
CREATE TABLE IF NOT EXISTS agent_template_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    user_input TEXT NOT NULL,         -- example user message
    expected_output TEXT NOT NULL,    -- ideal agent response
    explanation TEXT,                 -- internal: why this is the right response
    tags TEXT[] DEFAULT '{}',         -- categorization: ["code-review", "typescript"]
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_ate_template ON agent_template_examples(template_id);
```

### 3.4 Knowledge Bases

```sql
CREATE TABLE IF NOT EXISTS agent_template_knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,               -- "Oraya Codebase Conventions"
    description TEXT,
    kb_type TEXT NOT NULL CHECK (kb_type IN (
        'document',       -- uploaded file (PDF, MD, TXT)
        'url',            -- web page to crawl and index
        'structured',     -- JSON/CSV tabular data
        'manual'          -- hand-written knowledge entries
    )),
    
    -- Source (one of these populated depending on kb_type)
    source_url TEXT,                  -- for 'url' type
    content TEXT,                     -- for 'manual' type, or extracted text from documents
    file_path TEXT,                   -- Supabase Storage path for uploaded files
    file_size_bytes BIGINT,           -- file size tracking
    mime_type TEXT,                   -- file MIME type
    
    -- RAG Configuration
    retrieval_strategy TEXT DEFAULT 'semantic' CHECK (retrieval_strategy IN (
        'semantic',       -- embedding-based vector search
        'keyword',        -- BM25 / FTS
        'hybrid'          -- semantic + keyword fusion
    )),
    chunk_size INT DEFAULT 512,
    chunk_overlap INT DEFAULT 64,
    max_chunks_per_query INT DEFAULT 5,
    embedding_model TEXT DEFAULT 'text-embedding-3-small',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    indexing_status TEXT DEFAULT 'pending' CHECK (indexing_status IN (
        'pending', 'indexing', 'indexed', 'failed'
    )),
    indexing_error TEXT,
    total_chunks INT DEFAULT 0,
    last_indexed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_atkb_template ON agent_template_knowledge_bases(template_id);
CREATE INDEX idx_atkb_status ON agent_template_knowledge_bases(indexing_status);
```

### 3.5 Behavioral Rules

```sql
CREATE TABLE IF NOT EXISTS agent_template_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'must_do',      -- absolute requirement
        'must_not',     -- absolute prohibition
        'prefer',       -- soft preference
        'avoid'         -- soft discouragement
    )),
    
    content TEXT NOT NULL,            -- "Always cite sources when making claims"
    category TEXT,                    -- "safety", "formatting", "accuracy", "style", "tone"
    severity TEXT DEFAULT 'important' CHECK (severity IN (
        'critical',     -- violation = agent failure (highest priority in prompt)
        'important',    -- strongly enforced
        'suggestion'    -- nice to have, lower priority
    )),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_atr_template ON agent_template_rules(template_id);
CREATE INDEX idx_atr_type ON agent_template_rules(template_id, rule_type);
```

### 3.6 Factory Memories

```sql
CREATE TABLE IF NOT EXISTS agent_template_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    -- This ID is the STABLE KEY used for OTA patching.
    -- Same factory_id across all user installations enables merge/sync.
    factory_id UUID NOT NULL DEFAULT gen_random_uuid(),
    
    category TEXT NOT NULL CHECK (category IN (
        'personality',   -- "I approach problems methodically"
        'skill',         -- "I'm an expert in distributed systems"
        'knowledge',     -- "Oraya uses SQLite locally, Supabase in cloud"
        'rule',          -- "I never provide medical advice"
        'context',       -- "My creator is Anwesh Rath, CEO of Neeva"
        'preference',    -- "I prefer concise responses over verbose ones"
        'example'        -- "When asked about X, I respond like Y"
    )),
    
    content TEXT NOT NULL,            -- the actual memory content
    importance REAL DEFAULT 0.7 CHECK (importance >= 0.0 AND importance <= 1.0),
    tags JSONB DEFAULT '[]',          -- searchable tags: ["coding", "architecture"]
    
    -- Versioning
    version_added INT NOT NULL DEFAULT 1,   -- which factory_version introduced this
    version_removed INT,                     -- null = still active, set when removed
    
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(template_id, factory_id)
);

CREATE INDEX idx_atm_template ON agent_template_memories(template_id);
CREATE INDEX idx_atm_category ON agent_template_memories(template_id, category);
CREATE INDEX idx_atm_version ON agent_template_memories(template_id, version_added);
CREATE INDEX idx_atm_active ON agent_template_memories(template_id, is_active)
    WHERE is_active = TRUE AND version_removed IS NULL;
```

### 3.7 User Agent Assignments

```sql
CREATE TABLE IF NOT EXISTS user_agent_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE CASCADE,
    
    assigned_by UUID REFERENCES auth.users(id),  -- admin who assigned
    assignment_type TEXT DEFAULT 'push' CHECK (assignment_type IN (
        'push',          -- superadmin explicitly pushed to user
        'entitled'       -- user's plan auto-entitles them
    )),
    
    -- Per-user overrides (future extensibility)
    config_overrides JSONB DEFAULT '{}',
    custom_core_prompt TEXT,          -- user-specific prompt additions (future)
    
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_id)
);

CREATE INDEX idx_uaa_user ON user_agent_assignments(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_uaa_template ON user_agent_assignments(template_id);
CREATE INDEX idx_uaa_assigned_by ON user_agent_assignments(assigned_by);
```

### 3.8 Installation Event Tracking

```sql
CREATE TABLE IF NOT EXISTS user_agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES agent_templates(id) ON DELETE SET NULL,
    
    agent_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'install',       -- agent created/downloaded
        'uninstall',     -- agent deleted
        'update',        -- factory patch applied
        'patch_check',   -- client checked for updates
        'patch_applied'  -- factory memories updated via OTA
    )),
    
    -- Device info
    device_id TEXT,
    device_name TEXT,
    os_type TEXT,                     -- 'macos', 'windows', 'linux'
    app_version TEXT,                 -- Oraya version at time of event
    
    -- Source
    source TEXT DEFAULT 'gallery' CHECK (source IN (
        'gallery',       -- installed from agent gallery
        'assignment',    -- auto-installed via superadmin push
        'scratch',       -- created from scratch
        'clone',         -- cloned from existing agent
        'import'         -- imported from .oraya file
    )),
    
    -- Patch metadata (for update/patch events)
    from_factory_version INT,
    to_factory_version INT,
    memories_added INT,
    memories_updated INT,
    memories_removed INT,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uae_user ON user_agent_events(user_id);
CREATE INDEX idx_uae_template ON user_agent_events(template_id);
CREATE INDEX idx_uae_event ON user_agent_events(event_type);
CREATE INDEX idx_uae_device ON user_agent_events(device_id);
CREATE INDEX idx_uae_created ON user_agent_events(created_at DESC);

-- View: current installed state per user per device
CREATE OR REPLACE VIEW user_installed_agents AS
SELECT DISTINCT ON (user_id, agent_name, device_id)
    user_id,
    agent_name,
    template_id,
    event_type,
    device_id,
    device_name,
    os_type,
    app_version,
    source,
    created_at AS last_event_at
FROM user_agent_events
WHERE event_type IN ('install', 'uninstall')
ORDER BY user_id, agent_name, device_id, created_at DESC;
```

### 3.9 RLS Policies

```sql
-- Template memories: superadmin full access, users read-only on published templates
ALTER TABLE agent_template_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_template_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_template_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_template_knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_template_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agent_events ENABLE ROW LEVEL SECURITY;

-- Users can read factory data for templates they have access to
CREATE POLICY "Users read published template data"
    ON agent_template_memories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agent_templates t
            WHERE t.id = template_id
            AND t.is_published = TRUE
        )
    );

-- Users can only write their own events
CREATE POLICY "Users write own events"
    ON user_agent_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own events"
    ON user_agent_events FOR SELECT
    USING (auth.uid() = user_id);

-- Users read own assignments
CREATE POLICY "Users read own assignments"
    ON user_agent_assignments FOR SELECT
    USING (auth.uid() = user_id AND is_active = TRUE);
```

---

## 4. Oraya Desktop — Local Schema Changes

### 4.1 Memory DB Schema Extension

Each agent's local memory database (`memories/{agent_name}.db`) gets these additions:

```sql
-- Add columns to existing memories table
ALTER TABLE memories ADD COLUMN source TEXT DEFAULT 'user'
    CHECK (source IN ('user', 'factory', 'implanted'));

ALTER TABLE memories ADD COLUMN factory_id TEXT;          -- matches Supabase factory_id
ALTER TABLE memories ADD COLUMN factory_version INTEGER;  -- which version shipped this

-- Index for patch operations
CREATE INDEX IF NOT EXISTS idx_memories_source ON memories(source);
CREATE INDEX IF NOT EXISTS idx_memories_factory ON memories(factory_id) WHERE factory_id IS NOT NULL;
```

### 4.2 Agent Metadata Extension (oraya.db)

```sql
-- Track factory version per agent in main DB
ALTER TABLE agents ADD COLUMN template_id TEXT;               -- links back to Supabase template
ALTER TABLE agents ADD COLUMN installed_factory_version INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN last_factory_check_at INTEGER;  -- epoch timestamp
```

### 4.3 Protection Rules

These are enforced in the Rust layer, not just SQL:

1. **`forget_this` tool**: Skip memories where `source = 'factory'` → return error "Factory memories cannot be deleted"
2. **`agent_delete_memory` tool**: Same protection
3. **Memory UI** (if any): Factory memories shown with a 🔒 badge, delete button disabled
4. **Memory search**: Factory memories included in search results (they're real memories, just immutable)

---

## 5. API Layer

### 5.1 Superadmin — Template Composition APIs

All routes under `/api/superadmin/agent-templates/[id]/` — authenticated via superadmin JWT.

#### Prompt Stack
```
GET    /prompts                → list all prompt layers (ordered by priority)
POST   /prompts                → add prompt layer { prompt_type, label, content, priority }
PATCH  /prompts/[promptId]     → update prompt layer
DELETE /prompts/[promptId]     → remove prompt layer
PUT    /prompts/reorder        → bulk reorder { ids: [ordered array] }
```

#### Few-Shot Examples
```
GET    /examples               → list all examples
POST   /examples               → add example { user_input, expected_output, explanation, tags }
PATCH  /examples/[exampleId]   → update example
DELETE /examples/[exampleId]   → remove example
```

#### Knowledge Bases
```
GET    /knowledge-bases                → list all KBs
POST   /knowledge-bases                → create KB { name, kb_type, content/source_url, rag_config }
PATCH  /knowledge-bases/[kbId]         → update KB metadata/content
DELETE /knowledge-bases/[kbId]         → remove KB
POST   /knowledge-bases/[kbId]/reindex → trigger re-indexing
POST   /knowledge-bases/[kbId]/upload  → upload file (multipart)
```

#### Behavioral Rules
```
GET    /rules                  → list all rules (grouped by rule_type)
POST   /rules                  → add rule { rule_type, content, category, severity }
PATCH  /rules/[ruleId]         → update rule
DELETE /rules/[ruleId]         → remove rule
```

#### Factory Memories
```
GET    /factory-memories                    → list all factory memories (with version info)
POST   /factory-memories                    → add memory { category, content, importance, tags }
PATCH  /factory-memories/[memoryId]         → update memory content/metadata
DELETE /factory-memories/[memoryId]         → soft-delete (sets version_removed)
POST   /factory-memories/publish            → bump factory_version, snapshot current state
GET    /factory-memories/versions           → version history with change counts
GET    /factory-memories/diff?from=N&to=M   → diff between two versions
```

#### User Assignments
```
GET    /assignments                         → list users assigned to this template
POST   /assignments                         → assign template to user(s) { user_ids: [...] }
DELETE /assignments/[assignmentId]          → revoke assignment
POST   /assignments/bulk                    → bulk assign/revoke { add: [...], remove: [...] }
```

### 5.2 Superadmin — User Agent Management

```
GET    /api/superadmin/users/[userId]/agents         → user's assigned + installed agents
POST   /api/superadmin/users/[userId]/agents         → assign agent to user
DELETE /api/superadmin/users/[userId]/agents/[tid]   → revoke agent from user
GET    /api/superadmin/users/[userId]/agent-events   → user's install/patch history
```

### 5.3 User-Facing APIs (called by Oraya Desktop)

```
GET    /api/user/assigned-agents             → templates assigned to current user (for auto-install)
GET    /api/user/factory-updates             → check for factory memory updates
         ?agents=[{template_id, current_version}, ...]
         → returns: { updates: [{ template_id, from_version, to_version, memories: [...] }] }

POST   /api/user/agent-events               → report install/uninstall/patch events
         { event_type, template_id, agent_name, device_id, device_name, os_type, app_version, ... }
```

### 5.4 Template Download API (Enhanced)

The existing template download now includes all composition layers:

```
GET /api/templates/[id]/download
→ {
    // Existing fields
    id, name, emoji, role, core_prompt, personality_config, ...
    
    // NEW: Composition layers
    prompt_layers: [
        { prompt_type: "guardrail", label: "Safety", content: "...", priority: 1 },
        ...
    ],
    examples: [
        { user_input: "...", expected_output: "...", tags: [...] },
        ...
    ],
    rules: [
        { rule_type: "must_do", content: "...", severity: "critical" },
        ...
    ],
    knowledge_bases: [
        { name: "...", kb_type: "manual", content: "...", rag_config: {...} },
        ...
    ],
    
    // NEW: Factory memories
    factory_version: 5,
    factory_memories: [
        { factory_id: "uuid", category: "skill", content: "...", importance: 0.9, tags: [...] },
        ...
    ],
    
    // NEW: Capabilities
    modes: ["observer", "operator"],
    tools: ["read_file", "write_file", ...]
}
```

---

## 6. OTA Factory Patch System

### 6.1 Publish Flow (Superadmin)

1. Superadmin edits factory memories for a template (add, update, remove)
2. All changes are saved to `agent_template_memories` immediately (draft state)
3. Superadmin clicks **"Publish Factory Update"**:
   - `factory_version` increments on `agent_templates`
   - `factory_published_at` set to NOW()
   - All currently active memories get `version_added` set to current version if new
   - Removed memories get `version_removed` set to current version
4. The system records: "Version N contains these factory_ids with this content"

### 6.2 Patch Check Flow (Desktop)

On Oraya app launch (and optionally periodic background check):

```
1. For each locally installed agent that has a template_id:
   → Collect: { template_id, installed_factory_version }

2. Call: GET /api/user/factory-updates?agents=[...]

3. API responds with updates (if any):
   {
     updates: [
       {
         template_id: "...",
         latest_version: 7,
         memories: [
           // Full current factory memory set (all active memories for this template)
           { factory_id: "a1", category: "skill", content: "...", importance: 0.8 },
           { factory_id: "b2", category: "knowledge", content: "...", importance: 0.7 },
           ...
         ]
       }
     ]
   }

4. For each update, apply merge to local memory DB:
   
   a. Get all local factory memories:
      SELECT id, factory_id, content, importance FROM memories 
      WHERE source = 'factory'
   
   b. Build diff:
      - remote_ids = set of factory_ids from API response
      - local_ids = set of factory_ids from local query
      
      - TO ADD:    remote_ids - local_ids  → INSERT with source='factory'
      - TO UPDATE: remote_ids ∩ local_ids where content differs → UPDATE
      - TO REMOVE: local_ids - remote_ids  → DELETE (only factory memories!)
      
      User memories (source='user') are NEVER in this set. Untouchable.
   
   c. Update agent metadata:
      UPDATE agents SET installed_factory_version = ?, last_factory_check_at = ?
      WHERE id = ?
   
   d. Report event:
      POST /api/user/agent-events { 
        event_type: "patch_applied",
        from_factory_version: 3, 
        to_factory_version: 7,
        memories_added: 4,
        memories_updated: 1,
        memories_removed: 0
      }

5. Show notification to user:
   "🔄 Legal Expert updated — 4 new skills, 1 refinement"
```

### 6.3 Conflict Resolution

There are no conflicts by design:
- Factory memories (`source = 'factory'`) are owned by superadmin → always overwritten
- User memories (`source = 'user'`) are owned by the user → never touched by patches
- Implanted memories (`source = 'implanted'`) are owned by admin agents → never touched

The `source` column creates an absolute partition. No merge conflicts possible.

---

## 7. Superadmin UI

### 7.1 Enhanced Agent Template Drawer

The `AgentDetailDrawer` expands from existing tabs to:

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚡ Rook                                          [Publish] [Save]│
│  FREE · assistant · engineering · v5                              │
├──────────────────────────────────────────────────────────────────┤
│ [Overview] [Prompts] [Knowledge] [Training] [Rules] [Factory] [Users] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  (tab content)                                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Tab: Overview (existing, enhanced)
- Identity fields: name, emoji, role, tagline, description
- Template metadata: tier, category, is_published
- **NEW**: Factory Version badge showing current version + publish button
- **NEW**: Install count from `user_agent_events`

### 7.3 Tab: Prompts
- **Core Prompt** editor (existing `core_prompt` — the primary system prompt)
- **Additional Prompt Layers** list:
  - Each shows: type badge (System/Guardrail/Format/Context), label, content preview
  - Expand to edit content in a proper text editor
  - Priority ordering (drag-to-reorder or number input)
  - Active/inactive toggle per layer
  - "Add Prompt Layer" button → modal with type selector
- **Preview Panel**: Shows the fully assembled prompt stack as the agent would see it

### 7.4 Tab: Knowledge
- Knowledge base cards:
  - Each: name, type badge (Document/URL/Manual/Structured), status (Pending/Indexed/Failed)
  - Content preview or URL
  - RAG config: retrieval strategy, chunk size, max chunks
  - Chunk count + last indexed timestamp
- "Add Knowledge Base" button → modal:
  - Type selector tabs
  - Document upload with drag-and-drop
  - URL input with "Crawl" button
  - Manual text editor for hand-written entries

### 7.5 Tab: Training
- Few-shot example cards:
  - User input → Expected output (side by side or stacked)
  - Tags (editable)
  - Explanation (collapsible, internal-only)
- "Add Example" button → full editor modal
- Import/export examples as JSON

### 7.6 Tab: Rules
- Grouped sections: MUST DO / MUST NOT / PREFER / AVOID
- Each rule: content, category badge, severity indicator
- Active/inactive toggle
- "Add Rule" button → inline form or modal
- **Compiled Preview**: Shows the rules block as it would appear in the prompt

### 7.7 Tab: Factory (NEW — Factory Memories)
- **Version Header**: Current version badge, "Publish Update" button, last published timestamp
- **Memory List** grouped by category (Personality / Skill / Knowledge / Rule / Context / Preference / Example):
  - Each: content preview, importance slider, tags
  - Edit in-place or expand
  - Delete (soft — flagged for removal on next publish)
  - **Status indicators**: 🟢 Active | 🟡 Modified (unpublished) | 🔴 Pending removal
- "Add Factory Memory" button → modal with category selector
- **Version History** panel:
  - Timeline of published versions
  - Each shows: version number, date, changes summary (added/updated/removed counts)
  - Click to see diff

### 7.8 Tab: Users
- **Assigned Users** table:
  - User name, email, assignment type (Push/Entitled), assigned by, assigned date
  - Revoke button per user
  - "Assign to User" button → user search/selector modal
  - Bulk assign/revoke
- **Installed Users** table (from events):
  - User name, device, OS, app version, install date, factory version on device
  - Shows who has outdated factory versions
- **Stats**: Total assigned, total installed, % on latest factory version

---

## 8. Desktop Integration (Rust)

### 8.1 Factory Memory Protection

In all 3 OS executors (`macos/linux/windows/memory.rs`):

**`forget_this` tool** — add guard:
```rust
// Before deleting, check source
let source: String = conn.query_row(
    "SELECT source FROM memories WHERE id = ?",
    [memory_id], |row| row.get(0)
).unwrap_or("user".to_string());

if source == "factory" {
    return Ok(json!({
        "success": false,
        "error": "Factory memories are read-only and cannot be deleted",
        "memory_id": memory_id
    }));
}
```

**`agent_delete_memory` tool** — same guard.

### 8.2 Factory Patch Sync (New Module)

New file: `src-tauri/src/sync/factory_patch.rs`

```rust
/// Check for and apply factory memory patches for all installed agents
pub async fn check_factory_updates(app_handle: &AppHandle) -> Result<Vec<PatchResult>> {
    // 1. Collect all agents with template_ids
    // 2. Call API with current versions
    // 3. Apply diffs to each agent's memory DB
    // 4. Update installed_factory_version
    // 5. Report events
    // 6. Return summary for notification
}
```

Called on:
- App startup (after auth)
- Manual "Check for Updates" in settings
- Periodic background check (every 6 hours)

### 8.3 Enhanced Template Download Handler

When installing from gallery, the download response now includes factory memories.
The `create_agent_from_template` handler:

1. Creates agent in `agents` table (existing)
2. Assigns modes/protocols (existing)
3. **NEW**: Seeds factory memories into the agent's memory DB
4. **NEW**: Stores `template_id` and `installed_factory_version` on the agent record
5. **NEW**: Reports `install` event to SaaS

### 8.4 Install/Uninstall Event Reporting

Fire-and-forget HTTP calls added to:
- `create_agent` → POST install event (if template_id present)
- `create_agent_from_template` → POST install event
- `delete_agent` → POST uninstall event
- `import_agent_from_file` → POST install event (source: "import")

Non-blocking: failures are logged but never prevent the local operation.

---

## 9. Execution Plan

### Phase 7a: Supabase Schema ✅
- [x] Write migration `023_agent_composition_and_factory.sql`
- [x] Create all 7 new tables + view + indexes
- [x] Add columns to `agent_templates` (factory_version, factory_published_at)
- [x] Add RLS policies + updated_at triggers
- [x] Apply migration ✅

### Phase 7b: Composition APIs — CRUD ✅
- [x] Route: `/api/superadmin/agent-templates/[id]/prompts/route.ts`
- [x] Route: `/api/superadmin/agent-templates/[id]/examples/route.ts`
- [x] Route: `/api/superadmin/agent-templates/[id]/knowledge-bases/route.ts`
- [x] Route: `/api/superadmin/agent-templates/[id]/rules/route.ts`
- [x] Route: `/api/superadmin/agent-templates/[id]/factory-memories/route.ts`
- [x] Route: `/api/superadmin/agent-templates/[id]/factory-memories/publish/route.ts`
- [x] All routes: superadmin JWT auth, input validation, audit logging

### Phase 7c: User Assignment APIs ✅
- [x] Route: `/api/superadmin/agent-templates/[id]/assignments/route.ts`
- [x] Route: `/api/superadmin/users/[userId]/agents/route.ts`
- [x] Route: `/api/user/assigned-agents/route.ts`
- [x] Route: `/api/user/agent-events/route.ts`

### Phase 7d: Factory Patch API ✅
- [x] Route: `/api/user/factory-updates/route.ts`
- [x] Logic: accept agent template_ids + versions, return full memory set
- [x] Client cap: max 50 agents per request

### Phase 7e: Template Download Enhancement ✅
- [x] Created `/api/templates/[id]/download/route.ts` with all composition layers
- [x] Parallel fetch via Promise.all for performance
- [x] Include factory_memories array + factory_version + factory_published_at
- [x] Return full agent blueprint for desktop install

### Phase 7f: Superadmin UI — Drawer Tabs ✅
- [x] Prompts tab (`PromptsTab.tsx`) — type selector (4 types), expand/collapse, inline edit, active toggle
- [x] Knowledge tab (`KnowledgeTab.tsx`) — type-specific forms, RAG config (strategy/chunk/embed), status badges
- [x] Training tab (`TrainingTab.tsx`) — user→agent flow, tags, inline edit, color-coded sections
- [x] Rules tab (`RulesTab.tsx`) — grouped by type, severity indicators, compiled preview
- [x] Factory tab (`FactoryTab.tsx`) — 7 categories, importance slider, version header, publish OTA
- [x] Users tab (`UsersTab.tsx`) — stats cards, assigned/events views, bulk assign, push/entitled types
- [x] Wired all 6 new tabs into `AgentDetailDrawer.tsx` with icons + wider drawer
- [x] TypeScript compilation: ✅ 0 errors
- [x] Fixed 3 user-facing routes: `createClient` → `createServerSupabaseClient`

### Phase 7g: Oraya Desktop — Local Schema + Protection ✅
- [x] Migration: add `source`, `factory_id`, `factory_version` to memory DB schema
- [x] Migration: add `template_id`, `installed_factory_version` to agents table
- [x] Add factory memory protection to `forget_this` (all 3 OS executors)
- [x] Add factory memory protection to `agent_delete_memory` (all 3 OS executors)

### Phase 7h: Oraya Desktop — Patch Sync ✅
- [x] New module: `src-tauri/src/sync/factory_patch.rs`
- [x] Patch check on startup
- [x] Patch application (merge logic)
- [x] Event reporting (fire-and-forget)
- [x] User notification on patch applied

### Phase 7i: Oraya Desktop — Template Install Enhancement ✅
- [x] Enhance `create_agent` to accept `template_id` and automatically seed factory memories on install
- [x] Store template_id and factory_version on agent record
- [x] Report install events to SaaS
- [x] Report uninstall events from `delete_agent`

---

## 10. What This Defers (Intentionally)

| Feature | Why Deferred | Hook for Later |
|---------|-------------|----------------|
| Embedding/RAG pipeline | KB table stores metadata; actual chunking/embedding is a separate system | `indexing_status` + `embedding_model` columns |
| Real-time push sync | Desktop pulls on launch; WebSocket push is future | `factory_updates` API is already poll-ready |
| Per-user config overrides | Schema supports it, UI doesn't need it yet | `config_overrides` JSONB + `custom_core_prompt` columns |
| KB file uploads to Storage | Start with manual/text KBs; file upload is UI complexity | `file_path` + `mime_type` columns |
| Prompt stack inference assembly | Desktop currently uses `core_prompt` only; stacking is a prompt engineering step | `prompt_layers` in download payload |
| Assignment auto-install | Desktop checks for assignments; auto-install is a UX decision | `assigned-agents` API |

---

## 11. Backward Compatibility

- `core_prompt` in `agent_templates` remains the PRIMARY system prompt — unchanged
- `personality_config` remains as JSONB — unchanged
- All new tables are purely additive — zero schema changes to existing tables (only new columns with defaults)
- Existing agents with no `template_id` or `factory_version` continue to work — they just have zero factory memories
- The prompt stack is additive: agents with no prompt layers still work using only `core_prompt`
- Download API returns the same payload for agents with no composition layers (empty arrays)
- Desktop gracefully handles missing `source` column (defaults to 'user' via migration default)

---

## 12. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Factory memories injected into agent context | All factory memories are created by superadmin only — no user-generated content in factory partition |
| Patch API abused for DoS | Rate limit: 1 check per agent per hour. Response cached at CDN layer |
| Event reporting leaks user info | Events contain only template_id, device_id, event_type — no conversation content |
| RLS bypass on template data | All superadmin routes validated via JWT middleware; user routes scoped by auth.uid() |
| Factory memory tampering on client | Not a concern — factory memories are re-synced from server. Client is untrusted for factory data |
| Large factory memory payloads | Paginate factory memories API; compress response; set max 500 memories per template |

---

*Ready for execution. Say the word.*
