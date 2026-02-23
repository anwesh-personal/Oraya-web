# Oraya Intelligence Expansion Plan: Local LLMs & Trinity Orchestration
**Date:** February 23, 2026
**Priority:** High-Performance Sovereign Intelligence
**Auditor:** Antigravity AI

---

## 🟢 Part 1: Local & VPS LLM Lifecycle Integration

### 1. Database Schema Update (SaaS)
We will extend the `plans` table to support granular control over user-hosted infrastructure.

*   **New Fields**:
    *   `allow_local_inference`: (Boolean) Toggles the entire local RAG and local model loading suite.
    *   `allow_ollama`: (Boolean) Controls the native integration with local Ollama instances.
    *   `allow_vps_endpoints`: (Boolean) Enables the "Custom endpoint" UI for self-hosted VLLM/TGI servers.
    *   `max_vps_endpoints`: (Integer) Limit on saved custom endpoints (e.g., Pro: 2, Enterprise: 20).

### 2. Desktop-SaaS Sync Protocol
*   The `authenticateBridge` response will include a `capabilities` object based on the user's active plan.
*   **Desktop Logic**:
    *   If `allow_ollama` is false, the desktop sidebar hides the "Local Ollama" connection status.
    *   If `allow_vps_endpoints` is false, the "Advanced AI Providers" settings tab is locked with a "Upgrade to Pro" card.

### 3. Management UI (Superadmin)
*   Update `PlansSettings.tsx` to include an **"Infrastructure Gate"** section in the plan editor, allowing admins to toggle these "Sovereign" features per tier.

---

## 🔵 Part 2: Trinity Autonomous Agent Spawning (Ephemeral Protocol)

### 1. The "Ephemeral Session" Concept
Instead of permanent agent allocations, we introduce **Agent Spawns**—temporary intelligence instances created for a single objective.

### 2. Core Architectural Pillars
*   **The Spawning Engine**:
    *   **Trigger**: A Trinity-tier agent (Ora, Ova, Mara) calls the `spawn_subagent` tool.
    *   **Allocation**: SaaS API creates a record in `agent_spawns` with an expiry TTL (e.g., 2 hours).
    *   **Instatiation**: The Oraya Desktop app detects the request and spawns a "Ghost Thread"—a conversation with no permanent UI entry.
*   **Intelligence Transfer (Memory Management)**:
    *   **Post-Task Harvesting**: Before deletion, the sub-agent's `final_output` and `key_learnings` (JSON) are extracted.
    *   **Hierarchical Memory**: These learnings are stored in the **Parent Agent's (Trinity) Factory Memory** or the **User's Global Knowledge Base**.
    *   **Result Persistence**: The completed task result is saved to `token_usage_logs` and the `conversations` history, linked to the Parent.
*   **Automatic Cleanup**:
    *   Once the `finalize_spawn` command is received, the assignment is purged from the active session. This ensures a clean workspace for "Boss" while keeping the intelligence gains permanent.

### 3. Plan Integration (Gating)
*   **Feature Flag**: `autonomous_orchestration` (Enabled for Team/Enterprise only).
*   **Concurrent Limit**: `max_concurrent_spawns` ensures standard users don't flood the system with unmanaged sub-agents.

---

## 🛠️ Implementation Phasing (NO CODE CHANGES)

1.  **Phase 1 (SaaS)**: Migration of `plans` table and update of `PlanEnforcer`.
2.  **Phase 2 (Settings)**: Update Superadmin UI to enable these toggles.
3.  **Phase 3 (Bridge)**: Update the Bridge Auth API to broadcast these capabilities to the Desktop clients.
4.  **Phase 4 (Trinity)**: Update the "Trinity" prompt stack (Ora/Ova/Mara) to introduce the `spawn_subagent` tool schema.

---
**Status:** Planning Complete.
**Action:** Awaiting Approval to initialize Migrations.
