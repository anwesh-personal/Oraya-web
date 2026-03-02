# Plan: Unified Memory Tool Synchronization — EXECUTION COMPLETE

> **Created**: 2026-03-02  
> **Status**: ✅ IMPLEMENTED (SQLite) | ⏳ PENDING (Supabase — user-owned)  
> **Repos affected**: Oraya (Tauri) ✅, Oraya Saas (Supabase) ⏳

---

## Summary of Changes Made

### Key Discovery During Execution
Migration `048_ide_specialist_tools.sql` already existed on disk with the correct SQL to map
`remember_this`, `search_my_memories`, and `forget_this` to the `mcp_integration` protocol
and `pool_ide_gateway` skill pool — **but was never wired into the Rust migration runner**.
This was the smoking gun: the SQL was written, then forgotten.

### Files Modified (Tauri Repo)

| File | Change | Gate Fixed |
|:-----|:-------|:-----------|
| `database/sqlite/migrations/051_memory_tool_mcp_sync.sql` | **NEW** — Registers `remember_this`/`forget_this` in tools table, fixes SecurityEnforcer chain, cleans ghost tools | Gate 1, Gate 4, Ghost |
| `seeds/008_tools.sql` | Added `remember_this` + `forget_this` tool definitions | Gate 1 (fresh) |
| `seeds/005_protocol_tools.sql` | Added `remember_this` + `forget_this` to `observer.memory` protocol | Gate 4 (fresh) |
| `src-tauri/src/tools/executors/macos/memory.rs` | Added `store_memory` → `remember_this` alias, `recall_memory` → `search_my_memories` alias | Gate 6 |
| `src-tauri/src/tools/executors/linux/memory.rs` | Same aliases | Gate 6 |
| `src-tauri/src/tools/executors/windows/memory.rs` | Same aliases | Gate 6 |
| `src-tauri/src/db/migrations.rs` | Wired `048_ide_specialist_tools.sql` (was unwired!) + new `051_memory_tool_mcp_sync.sql` | Runner |

### Gate Resolution Matrix

| Gate | Problem | Fix | Status |
|:-----|:--------|:----|:-------|
| **1 (ToolRegistry)** | `remember_this` not in `tools` table → router crashes | `051_*.sql` registers with `category='memory'` | ✅ |
| **2 (MCP Protocol)** | Not in `mcp_integration` protocol → invisible to IDE | `048_ide_specialist_tools.sql` (now wired) | ✅ |
| **3 (Skill Pool)** | Not in `pool_ide_gateway` + ghost `recall_memory` | `048_*.sql` adds tools + `051_*.sql` cleans ghost | ✅ |
| **4 (SecurityEnforcer)** | `mcp_server_mode` not chained to `observer.memory` | `051_*.sql` adds `mode_protocols` + `agent_modes` | ✅ |
| **5 (Prompts)** | Prompts say `store_memory` / invalid categories | User-owned Supabase migration needed | ⏳ |
| **6 (Rust Executor)** | No fallback for hallucinated tool names | Added `store_memory`/`recall_memory` aliases | ✅ |

---

## Remaining: Supabase Migration (User-Owned)

Create a new Supabase migration that:

1. **Replace `store_memory` → `remember_this`** in all specialist agent prompts (037-040)
2. **Fix invalid memory categories** in few-shot examples:
   - `category: architecture` → `category: context`
   - `category: bugfix` → `category: fact`
3. **Verify** `042_enrich_specialist_agents.sql` uses correct tool names

---

## Verification Queries

After building and launching the app, run these against `oraya.db`:

```sql
-- Gate 1: Tool exists
SELECT name, category FROM tools WHERE name IN ('remember_this', 'forget_this');
-- Expected: 2 rows, both category = 'memory'

-- Gate 2: MCP Protocol mapping
SELECT * FROM protocol_tools WHERE tool_name = 'remember_this';
-- Expected: rows for 'mcp_integration' and 'observer.memory'

-- Gate 3: Skill pool (no ghosts)
SELECT tool_name FROM skill_pool_tools WHERE pool_id = 'pool_ide_gateway' AND tool_name LIKE '%memor%';
-- Expected: 'remember_this', 'search_my_memories' — NO 'recall_memory'

-- Gate 4: SecurityEnforcer chain
SELECT am.agent_id, mp.protocol_id, pt.tool_name
FROM agent_modes am
JOIN mode_protocols mp ON am.mode_id = mp.mode_id
JOIN protocol_tools pt ON mp.protocol_id = pt.protocol_id
WHERE pt.tool_name = 'remember_this';
-- Expected: rows for each specialist agent
```
