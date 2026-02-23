# Subscription Granularity & Enforcement Audit

## 1. Investigation & Audit Report

### Current State Assessment
An unbiased audit of the subscription and enforcement layer reveals several "corner-cutting" areas and missing links between the database and the UI.

#### Feature & Quota Enforcement
*   ✅ **Feature Gating**: Backend checks for `managed_ai` and `ai_calls` are integrated into the token deduction and research APIs using `PlanEnforcer`.
*   ✅ **BYOK Logic**: High-integrity stripping of managed AI features for BYOK licenses is implemented in `lib/desktop-auth.ts`.
*   ❌ **Agent Instances**: There is **no server-side enforcement** of `max_agents` during agent creation/assignment. Enforcement currently relies on the Desktop client respecting the `maxAgents` claim in the signed license token.
*   ❌ **Hierarchy Rigidity**: Access to agent templates is strictly hierarchical based on tier rank (`Standard < Pro < Team < Enterprise`).

#### Superadmin Consistency (The "Hardcoded Bullshit" Audit)
*   ❌ **Organization Provisioning**: `CreateOrgModal.tsx` uses hardcoded default limits (5 members, 10 agents) regardless of the selected plan. It does not fetch live defaults from the `plans` table.
*   ❌ **Static Plan Data**: Several areas of the superadmin still use hardcoded plan ID arrays instead of querying the dynamic `plans` registry.
*   ❌ **UI/UX Sync**: Selecting a plan in the organization creator does not update the "Max Members" or "Max Agents" fields to reflect that plan's defaults.

#### Granularity Gaps
*   ❌ **Specific Agent Control**: There is currently no way to grant access to a specific "Standard" agent to a "Pro" plan while excluding another "Standard" agent. Access is "All or None" based on the tier rank.

---

## 2. Proposed Implementation Plan

### Phase 1: Database & Logic (The Engine)
1.  **Granular Agent Mapping**:
    *   Add `allowed_agent_ids` (UUID[]) to the `plans` table.
    *   Update `get_user_accessible_agents` (Postgres RPC) to include agents explicitly allowed by ID, in addition to the tier-based hierarchy. This allows for specific "Featured Agents" available on lower tiers.
2.  **Robust PlanEnforcer**:
    *   Add `canCreateAgent(userId)` to `PlanEnforcer`.
    *   Integrate `canCreateAgent` check into any API that handles agent instantiation.
3.  **Schema Support for Organization Defaults**:
    *   Add `max_members_default` to the `plans` table to store organization limits separately from personal license limits.

### Phase 2: Superadmin Re-Engineering (The Cockpit)
1.  **Dynamic Organization Control**:
    *   Refactor `CreateOrgModal.tsx` to fetch the `plans` table on mount.
    *   Implement an "Auto-Fill from Plan" listener that updates member/agent limit sliders when the plan selection changes.
2.  **Granular Agent Selector**:
    *   Update `PlansSettings.tsx` to include a "Template Permissions" section.
    *   Add a multi-select search component to choose specific `agent_templates` that are explicitly allowed for that plan.
3.  **Theme-Aware Polish**:
    *   Ensure all new/modified components use the established CSS variables (`var(--surface-X)`, `var(--primary)`, etc.) to maintain total theme responsiveness.

### Phase 3: Total Enforcement Audit
1.  **End-to-End Test**: Verify that unchecking a feature in Superadmin immediateley triggers a `PLAN_FEATURE_REQUIRED` error in the relevant Cloud API.
2.  **Limit Verification**: Verify that a "Standard" user attempting to exceed their agent instance limit is blocked at the Gateway/API level, not just the UI.

---

## 3. Anticipated Outcomes
*   **Zero Leakage**: No more reliance on "client-side honesty" for license enforcement.
*   **Commercial Flexibility**: Ability to create niche plans (e.g., a "Creative" plan with access to only Voice/Art agents).
*   **Professional UX**: A superadmin interface that feels like a cohesive, dynamic platform rather than a collection of static forms.

**Requesting approval to proceed with Phase 1.**
