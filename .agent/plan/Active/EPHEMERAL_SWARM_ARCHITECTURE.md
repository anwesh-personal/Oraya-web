# EPHEMERAL SWARM ARCHITECTURE – IMPLEMENTATION PLAN

## Overview
The goal is to give Oraya a **real‑time, addictive “war‑room”** where persistent agents (Ora, Ova, Mara) can spawn **ephemeral workers** that execute tasks in parallel, report progress, and disappear automatically.  The plan respects the existing architecture, never introduces band‑aids, and stays within licensing limits.

---

### 1️⃣ Backend – Core Ephemeral Worker API
| File | Change | Reason |
|------|--------|--------|
| `src-tauri/src/api/agents.rs` | Add `#[tauri::command] pub async fn spawn_ephemeral_worker(request: SpawnTaskRequest, db_path: State<'_, PathBuf>, app_handle: tauri::AppHandle) -> Result<String, String>` – creates a temporary **system**‑classified agent, inserts an `agent_tasks` row, returns the `task_id`. | Provides a safe, first‑class way for LLMs to spin headless workers that do **not** count toward `max_agents`. |
| `src-tauri/src/api/agents.rs` | Extend `SpawnTaskRequest` with optional `ephemeral: bool` (default `false`). | Allows the same request shape to be reused for both persistent and ephemeral spawns. |
| `src-tauri/src/api/agents.rs` | Helper `fn insert_ephemeral_agent(conn: &Connection, name: &str) -> Result<String, String>` – inserts into `agents` with `agent_classification = 'system'` (or a new `ephemeral` enum) and `is_system = 1`. | Guarantees workers are ignored by licensing checks. |
| `src-tauri/src/api/agents.rs` | Update `spawn_agent_task` to reject a `spawned_by_agent_id` that does not exist **unless** `request.ephemeral == true`. | Prevents malformed spawns while allowing workers to be created without a pre‑existing target. |
| `src-tauri/src/api/agents.rs` | In `complete_task` (or a new `finalize_ephemeral_task`) delete the temporary agent row after the task reaches `verified`/`complete`. | Cleans up after the worker, keeping the DB tidy. |

#### Ephemeral Worker Lifecycle (pseudo‑code)
```rust
// 1️⃣ spawn_ephemeral_worker → creates temp agent + task
let temp_agent_id = insert_ephemeral_agent(&conn, "⚡ Worker")?;
let task_id = create_task_row(&conn, temp_agent_id, request, true)?; // memory_mode_on_delete = "DeleteAll"

// 2️⃣ TaskEngine picks up the task (no code change needed)

// 3️⃣ run_task executes using the temporary agent's config

// 4️⃣ After TaskEngine.complete_task succeeds:
delete_agent(&conn, temp_agent_id)?; // fire‑and‑forget
emit("task:ephemeral:finished", ...);
```

---

### 2️⃣ Backend – TaskEngine Parallelism (Swarm)
| File | Change | Reason |
|------|--------|--------|
| `src-tauri/src/orchestration/engine.rs` | Replace the single‑threaded `while running` loop with a **bounded Tokio worker pool** (default size 5, configurable via `ORAYA_SWARM_SIZE`). Use `tokio::task::JoinSet` to spawn a task for each pending `agent_tasks` row. | Enables multiple workers (persistent or ephemeral) to run concurrently, giving the UI a real‑time feel while still respecting SQLite write locks. |
| `src-tauri/src/orchestration/engine.rs` | Emit `task:progress` events from inside `run_task` (already present) and a new `task:ephemeral:finished` after cleanup. | UI can show per‑worker progress bars and know when a worker disappears. |

**Safety notes** – All updates to `agent_tasks` are single‑row transactions; the pool size is capped to avoid lock contention. |

---

### 3️⃣ Backend – Compliance & Licensing Adjustments
| File | Change | Reason |
|------|--------|--------|
| `src-tauri/src/compliance/types.rs` | Add enum variant `AgentClassification::Ephemeral` (or reuse `System`). Update `counts_toward_limit()` to **exclude** this variant. | Guarantees `max_agents` checks never block a swarm of workers. |
| `src-tauri/src/compliance/engine.rs` | In `verify_agent_access`, treat `Ephemeral` agents as always allowed (skip quota checks). | Prevents accidental denial of worker tasks. |
| `src-tauri/src/api/agents.rs` | When inserting a temporary agent, set `agent_classification = 'system'` (or `'ephemeral'`). | Aligns with compliance logic. |

---

### 4️⃣ Frontend – Real‑Time Event Wiring
Add the following listeners in `IntelligenceHub.tsx` (inside a `useEffect`):
```tsx
useEffect(() => {
  const unlistenStarted = await window.__TAURI__.event.listen('task:started', onTaskStarted);
  const unlistenProgress = await window.__TAURI__.event.listen('task:progress', onTaskProgress);
  const unlistenCompleted = await window.__TAURI__.event.listen('task:completed', onTaskCompleted);
  const unlistenError = await window.__TAURI__.event.listen('task:error', onTaskError);
  const unlistenEphemeral = await window.__TAURI__.event.listen('task:ephemeral:finished', onEphemeralFinished);
  return () => {
    unlistenStarted(); unlistenProgress(); unlistenCompleted(); unlistenError(); unlistenEphemeral();
  };
}, []);
```
Create a new state slice `ephemeralWorkers: Record<string, WorkerInfo>` where `WorkerInfo` holds `taskId`, `title`, `status`, `spawnedBy`, timestamps, and a `progress` counter.

- `task:started` → add entry (ephemeral flag if present).<br>
- `task:progress` → update `progress` field.<br>
- `task:completed` / `task:error` → mark finished, schedule a 2 s fade‑out.<br>
- `task:ephemeral:finished` → remove the entry completely.

---

### 5️⃣ Frontend – AgentNexus SVG Visualization
1. **Data model** – extend `AgentNode` with `isEphemeral: boolean` and `parentAgentId: string | null`.
2. **Render** – persistent agents stay in the outer circle; ephemeral workers are rendered as smaller nodes on a **tight orbit** around their spawner.
3. **Animations** (CSS keyframes in `IntelligenceHub.module.css`):
   ```css
   @keyframes popIn { 0% { transform: scale(0); opacity:0; } 80% { transform: scale(1.2); opacity:1; } 100% { transform: scale(1); } }
   @keyframes pulseRunning { 0% { stroke:#3b82f6; } 50% { stroke:#60a5fa; } 100% { stroke:#3b82f6; } }
   @keyframes flashSuccess { 0%,100% { stroke:#10b981; } 50% { stroke:#6ee7b7; } }
   @keyframes flashError { 0%,100% { stroke:#ef4444; } 50% { stroke:#f87171; } }
   @keyframes dashMove { to { stroke-dashoffset:-6; } }
   ```
4. **Birth** – `animation: popIn 300ms ease-out` when a `task:started` event arrives.
5. **Running** – `animation: pulseRunning 1.5s infinite` on the node border.
6. **Success / Failure** – flash green/red (`flashSuccess` / `flashError`) then fade out (`opacity:0` over 1 s) and remove from state.
7. **Data flow line** – draw a dashed `<line>` from the spawner to each worker; animate dash offset (`stroke-dasharray:4 2; animation: dashMove 1s linear infinite`).
8. **Tooltip** – on hover, show task title, progress (turns / tool calls), elapsed time.
9. **Responsive viewBox** – `viewBox="0 0 800 800"` with `preserveAspectRatio="xMidYMid meet"`.

---

### 6️⃣ User‑Facing Notification & Spawn Viewer

Users should **not** need to navigate to the Intelligence Hub to see spawning activity. A lightweight, clickable toast appears wherever the user currently is, and clicking it opens a focused modal with the full AgentNexus animation.

#### 6.1 SpawnToast Component
| Property | Detail |
|----------|--------|
| **Component name** | `SpawnToast` (React functional component) |
| **Placement** | Fixed to the **bottom‑right** corner of the app window. Multiple toasts stack vertically (newest on top, max 5 visible). |
| **Content** | Spawner agent icon + name (e.g. "Ora"), task title (e.g. "Refactor module X"), a subtle animated spinner. |
| **Interaction** | Entire toast is clickable (`cursor: pointer`). On click → opens **SpawnViewer** modal (§ 6.2) focused on that `task_id`. |
| **Auto‑dismiss** | Fades out after **5 seconds** if the user does not click. The underlying task continues unaffected. |
| **Accessibility** | Container has `aria-live="polite"` so screen‑readers announce the spawn. |
| **Styling** | Rounded corners, subtle drop‑shadow, primary accent colour border, `popIn` animation on mount, and a gentle border‑pulse (`pulseRunning`) to draw attention. |

#### 6.2 SpawnViewer Modal / Side‑Panel
| Property | Detail |
|----------|--------|
| **Component name** | `SpawnViewer` (modal dialog or slide‑over panel) |
| **Trigger** | Clicking a `SpawnToast`, or via a global keyboard shortcut (`Ctrl+Shift+S` / `⌘+Shift+S`). |
| **Layout – Header** | Shows "Task #\<task‑id\> – \<title\>" with a close (✕) button. |
| **Layout – Body** | Embeds `<AgentNexus workers={ephemeralWorkers} />` — the **same** SVG component used in the Intelligence Hub — so spawning agents, their orbits, pulsing lines, and success/failure flashes are rendered in real time. |
| **Layout – Optional sidebar** | A scrollable list of all active tasks with mini progress bars and status badges. |
| **Behaviour – Open** | Stays open while the focused task is in `running` or `verifying` state. |
| **Behaviour – Close** | On `task:completed` → green check overlay, auto‑closes after **2 s**. On `task:error` → red cross overlay, auto‑closes after **2 s**. User can also close manually at any time. |
| **Responsiveness** | On narrow screens (< 640 px) the modal goes full‑screen; on wider screens it is centered with `max-width: 800px`. |
| **State sharing** | Re‑uses the **global** `ephemeralWorkers` state slice already created for the Intelligence Hub (§ 4), so the animation stays perfectly synchronized across both views. |

#### 6.3 Event Wiring for Toast + Viewer
No new backend events are required — the existing `task:started`, `task:progress`, `task:completed`, `task:error`, and `task:ephemeral:finished` events are sufficient.

**Frontend (top‑level component, e.g. `App.tsx`):**
```tsx
useEffect(() => {
  const unlisten = await window.__TAURI__.event.listen('task:started', (e) => {
    // payload: { task_id, title, spawner_id, spawner_name, is_ephemeral }
    showSpawnToast(e.payload);   // creates the toast
  });
  return () => unlisten();
}, []);
```

**Toast click handler:**
```tsx
const onToastClick = (taskId: string) => {
  setSpawnViewerTaskId(taskId);   // open the modal focused on this task
  dismissToast(taskId);           // remove the toast immediately
};
```

#### 6.4 UX Polish (recommended)
| Feature | Why |
|---------|-----|
| **"Show all tasks" toggle** inside the modal | Gives power users a quick overview without leaving the animation view. |
| **Keyboard shortcuts** | `Esc` to close modal, `Enter` to focus the latest toast. |
| **Sound cue** | Soft "ding" when a toast appears — reinforces the war‑room vibe. |
| **User‑settings toggle** | "Show spawn notifications" (default on) — power users can disable toasts. |
| **Analytics events** | `ui:spawn_toast_shown`, `ui:spawn_viewer_opened` — measure adoption. |

#### 6.5 Implementation Checklist
- [ ] Create `SpawnToast` component with auto‑dismiss timer and stacking logic.
- [ ] Create `SpawnViewer` modal that imports and renders `AgentNexus`.
- [ ] Hook toast creation to the `task:started` event in `App.tsx`.
- [ ] Pass the global `ephemeralWorkers` state to both `IntelligenceHub` and `SpawnViewer`.
- [ ] Ensure the modal closes gracefully on terminal task states.
- [ ] Add user‑settings toggle for enabling/disabling spawn notifications.
- [ ] Write unit tests for the toast lifecycle (mount → auto‑dismiss, mount → click → modal open).
- [ ] Write integration test: simulate `task:started` event → verify toast appears → click → verify modal opens with correct `AgentNexus` data.

---

### 7️⃣ Testing & Validation
| Test Type | Description |
|-----------|-------------|
| **Unit** | Verify `spawn_ephemeral_worker` creates a temporary agent with `agent_classification='system'` and a matching `agent_tasks` row. |
| **Integration** | Run the app with a mock LLM that calls `spawn_ephemeral_worker` 10 times. Confirm `TaskEngine` processes up to `ORAYA_SWARM_SIZE` tasks concurrently (check timestamps in logs). |
| **Compliance** | Under a downgraded plan (`max_agents = 2`), spawn > 2 workers. Ensure the request succeeds (workers are ignored by quota). |
| **UI** | Emit a burst of `task:started` events via a test harness. Verify the SVG shows the correct number of worker nodes, animations run, and nodes disappear after completion. |
| **Performance** | Measure CPU/memory while 5 workers run for 2 min. Target < 150 MB RAM and < 30 % CPU on a typical MacBook M1. |
| **Regression** | Run the full existing test suite (`cargo test --all`). No failures should appear. |

All new tests live in `src-tauri/tests/ephemeral_swarm.rs`.

---

### 8️⃣ Deployment & Roll‑out
1. **Feature flag** – env var `ORAYA_ENABLE_EPHEMERAL_SWARM` (default `false`). All new code paths check this flag before executing.
2. **Staged rollout** – ship to the **beta** channel first; enable the flag for internal testers only.
3. **Telemetry** – emit `swarm:worker_spawned` events via the existing analytics pipeline.
4. **Documentation** – update `docs/api/agents.md` with the new `spawn_ephemeral_worker` endpoint and the `ephemeral` flag.
5. **User‑facing UI** – add a toggle in **Intelligence Hub Settings**: “Enable Swarm Mode (experimental)”. When off, the UI falls back to the old polling behavior.

---

### 9️⃣ Risk Mitigation & Zero‑Tolerance Safeguards
| Risk | Mitigation |
|------|------------|
| **DB lock contention** (multiple workers updating `agent_tasks`) | All status transitions are single‑row updates inside a transaction; pool size capped (default 5) to keep lock time minimal. |
| **Orphaned temporary agents** (crash before cleanup) | `TaskEngine` runs a **reconciliation job** on start‑up that deletes any `agents` with `agent_classification='system'` that have no pending/running tasks. |
| **License‑bypass abuse** (user spawns unlimited workers) | Workers are **system‑classified** and can only be created via the LLM‑exposed `spawn_ephemeral_worker` tool, which is only available to trusted agents (Ora, Ova, Mara). |
| **UI memory leak** (state never cleared) | Workers are removed from `ephemeralWorkers` after `task:ephemeral:finished` **or** after a 10 s safety timeout. |
| **Regression of existing task flow** | Existing `spawn_agent_task` and `delegate_subtask` paths remain untouched; new logic is isolated behind the `ephemeral` flag and the new command. |

---

### 🔟 Next Action Items (ordered)
1. Add feature flag in `src-tauri/src/config.rs`.
2. Add `AgentClassification::Ephemeral` (or reuse `System`) and update `counts_toward_limit()`.
3. Implement `spawn_ephemeral_worker` and helper `insert_ephemeral_agent`.
4. Extend `SpawnTaskRequest` with `ephemeral: bool`.
5. Update `spawn_agent_task` validation.
6. Add cleanup in `complete_task` (or new `finalize_ephemeral_task`).
7. Refactor `TaskEngine` to bounded worker‑pool model.
8. Emit `task:ephemeral:finished` after cleanup.
9. Wire up UI listeners in `IntelligenceHub.tsx`.
10. Extend `AgentNexus` SVG with dynamic worker nodes and animations.
11. Write unit & integration tests (backend + frontend).
12. Add feature‑flag gating and UI toggle.
13. Run full test suite, fix failures.
14. Deploy to beta, enable flag for internal users.
15. Collect telemetry, monitor performance, adjust `ORAYA_SWARM_SIZE` if needed.

---

**Bottom line:**
- **Ephemeral workers** are first‑class, license‑free, auto‑cleaned.
- **TaskEngine** becomes a true **swarm** capable of parallel execution.
- **Intelligence Hub** moves from polling to real‑time event‑driven updates with rich SVG animations.
- All changes respect the existing architecture, avoid shortcuts, and include comprehensive testing and risk mitigation to satisfy the zero‑tolerance requirement.
