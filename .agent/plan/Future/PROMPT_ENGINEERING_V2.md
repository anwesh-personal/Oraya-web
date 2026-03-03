# Plan: Prompt Engineering V2 (IDE Specialist Alignment)

> **Created**: 2026-03-02  
> **Target**: Supabase Database (Migrations)  
> **Status**: Planned

---

## 1. The Core Issues Discovered via Code Audit

After auditing both the Supabase prompt seeds (`037`-`040`, `042`) and the Rust backend's execution pipelines (`src-tauri/src/mcp/server.rs` and `src-tauri/src/context/smart_builder.rs`), several systemic issues were found in how Oraya configures IDE specialist agents:

| Issue | Technical Root Cause | UX Impact |
|:------|:---------------------|:----------|
| **1. The Clone Syndrome** | All 4 agents share the exact same `Oraya Network Protocol` instruction block and the same two few-shot examples. | Agents behave identically regardless of IDE. A Windsurf agent and a VS Code agent shouldn't talk the same way. |
| **2. RP Hallucinations** | Prompts instruct agents to delegate tasks to "Koda" and "Thalas" (internal names). | Users see confusing RPG-style dialogue ("I'll pass this to Koda") instead of professional SaaS feedback. |
| **3. Invalid Schema Configs** | The few-shot examples dictate `category: 'architecture'` for `remember_this`, but the Rust enum (`memory::MemoryType`) strictly expects `fact, procedure, preference` etc. | Tool execution silently degrades to internal fallback categories (`MemoryType::Emotional` or `Fact`). |
| **4. Lack of Bootstrapping** | None of the training examples teach the agents to use their system commands like `agent_query_ethos`. | The `agent_query_ethos` tool, which enforces user constraints from SQLite, is almost never utilized. |

---

## 2. The Context Pipeline (How it works in Rust)

To write good prompts, we must understand how they are surfaced.
The `SmartContextBuilder::assemble_system_message` in Rust assembles the final LLM prompt in a strict order:
1. `=== CORE IDENTITY ===` (from agent's `core_prompt`)
2. `=== SYSTEM CONTEXT ===` (OS/runtime)
3. `=== RELEVANT EXPERTISE ===` (from `agent_template_prompts`)
4. `=== KNOWLEDGE BASE REFERENCE ===`
5. `=== EXAMPLE INTERACTION ===` (from `agent_template_examples`)

**Objective**: We will entirely replace the generic "Oraya Network Protocol" chunks in `agent_template_prompts` and rewrite the few-shot examples in `agent_template_examples` to be **IDE-native**.

---

## 3. Implementation Details: `044_prompt_differentiation.sql`

We will create a new Supabase migration that executes precise `UPDATE` statements to rewrite these specific records.

### A. Axon (Cursor / Antigravity) — The "Surgical" Agent
* **Vibe**: Fast, uses diff blocks, assumes multi-file awareness.
* **New Protocol**: Focuses on `agent_query_ethos` for alignment and `delegate_task_to_oraya` for massive technical debt that clogs the current context window.
* **New Few-Shot**: Axon encounters a request for a new feature. *First*, it calls `agent_query_ethos` to check if the user enforces functional programming over OOP. Then, it uses `remember_this` with `category: "preference"` to store the outcome permanently. 

### B. Cipher (Claude Desktop) — The "Analytical" Agent
* **Vibe**: Structured, uses `<thinking>` blocks, relies heavily on markdown tables to compare approaches.
* **New Protocol**: Replaces RPG terminology with enterprise language: "Hand off research tasks to the Oraya Background Engine."
* **New Few-Shot**: Cipher executes a CLI command that returns a massive log. Instead of outputting the log, it pipes it to a temporary file, searches it using `grep`, and summarizes the error. (Teaching CLI autonomy natively).

### C. Pulse (VS Code / Copilot / Cline) — The "Autonomous" Agent
* **Vibe**: Terminal-first, highly autonomous, avoids asking the user to manually perform tasks.
* **New Protocol**: "You have native access to terminal commands inside VS Code. Do not ask for permissions unnecessarily. Execute and analyze."
* **New Few-Shot**: Pulse encounters a failing `npm test`. It doesn't ask the user for the stack trace; it autonomously runs `npm test` via tools, parses the error, and fixes the file directly.

### D. Drift (Windsurf / Zed) — The "Semantic Flow" Agent
* **Vibe**: Minimal chatter, relies on internal semantic indexing (Cascade).
* **New Protocol**: "Trust the IDE index. Do not ask the user for the contents of their active file."
* **New Few-Shot**: Uses `remember_this` to lock in a sweeping codebase style change (e.g. "We now use Result enums everywhere") and tags it with `category: "procedural"`, mapping correctly to `MemoryType::Pattern` in Rust.

---

## 4. Execution Plan (Next Steps)

1. **AI Task**: Draft the exact Supabase SQL for `044_prompt_differentiation.sql`.
2. **AI Detail**: Ensure all `remember_this` examples use correct categories: `fact, pattern, episodic, preference, context, insight, emotional`.
3. **AI Detail**: Ensure all `delegate_task_to_oraya` examples use the correct enum `task_type`: `general, research, code_review, data_fetch, generation, custom`.
4. **User Task**: Apply the generated `044` migration to the SaaS database.
5. **System Task**: Wait for `sync_cloud_agents()` to pull down the newly updated DB rows on client restart.
