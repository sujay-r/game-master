# Optimistic Task Creation with Background Sync — Spec

## Overview

Task creation in Gamemaster is currently synchronous and network-dependent. Any latency or failure is immediately visible to the user, causing frustration particularly when adding multiple tasks quickly or under poor network conditions.

This feature decouples the user-facing action from the actual API call, making task creation feel instant regardless of network state. Failed or pending requests are queued in localStorage and replayed automatically by the service worker when connectivity is restored.

---

## Goals

- Task creation feels instant — the UI updates before the API responds.
- Network failures are handled silently in the background without user-facing errors during creation.
- Unsynced tasks survive page closes and app restarts.
- On sync success, the optimistic entry is replaced with the confirmed server record.
- On sync failure (non-retryable), the user is notified and given the option to retry or discard.

---

## Non-Goals

- This spec does not cover offline-first caching of existing tasks/quests (reads remain network-dependent).
- This is not a general-purpose sync layer — it only covers task creation in v1.
- No conflict resolution is needed since task creation is append-only.

---

## Architecture

Three components work together:

```
User action
    │
    ▼
[1] Optimistic UI update  ←──── localStorage buffer (pending tasks)
    │
    ▼
[2] Background Sync registration (service worker)
    │
    ▼
[3] Service worker replays API call when online
    │
    ├── Success → reconcile optimistic entry with server record
    └── Failure → notify user
```

---

## Component 1: Optimistic UI

### Behaviour

When the user submits the task creation form:

1. Generate a temporary client-side ID for the task (e.g. `temp_<uuid>`).
2. Construct an optimistic task object using the form data and this temp ID.
3. Insert it into the Pinia task store immediately — it should appear in the UI without delay.
4. Mark the task visually as "pending sync" (see UI states below).
5. Write the task payload to the localStorage queue (see Component 2).
6. Register a Background Sync event (see Component 3).

### Optimistic Task Object Shape

```ts
{
  id: "temp_<uuid>",           // client-generated, replaced on sync
  title: string,
  description?: string,
  questId?: number,
  tokenReward?: { Care?: number, Grind?: number },
  notes?: string,
  dueDate?: string,            // ISO date string
  status: "TODO",
  createdAt: string,           // client timestamp, ISO
  completedAt: null,
  _syncStatus: "pending"       // internal field, not sent to API
}
```

The `_syncStatus` field is internal to the client and must never be sent to the API. It drives the visual state of the task card.

### UI States

| `_syncStatus` | Visual Treatment |
|---|---|
| `"pending"` | Subtle muted opacity or a small spinner indicator on the card |
| `"synced"` | Normal appearance, `_syncStatus` field removed |
| `"failed"` | Error indicator on card with retry/discard options |

Keep the visual treatment minimal — the goal is awareness, not alarm.

---

## Component 2: localStorage Queue

### Purpose

Persist unsynced task payloads so they survive page closes, crashes, and app restarts. The service worker reads from this queue when executing a sync.

### Queue Key

```
gamemaster_task_sync_queue
```

### Queue Shape

The value is a JSON-serialised array of sync entries:

```ts
type SyncEntry = {
  tempId: string,              // matches the optimistic task's id
  payload: {
    title: string,
    description?: string,
    questId?: number,
    tokenReward?: { Care?: number, Grind?: number },
    notes?: string,
    dueDate?: string
  },
  queuedAt: string,            // ISO timestamp
  attemptCount: number         // incremented on each retry
}
```

### Operations

**Enqueue** (called immediately after optimistic UI insert):
```ts
function enqueueTask(tempId: string, payload: CreateTaskPayload): void
```
Reads current queue from localStorage, appends the new entry, writes back.

**Dequeue** (called after successful API response):
```ts
function dequeueTask(tempId: string): void
```
Removes the entry matching `tempId` from the queue.

**Read** (called by service worker on sync):
```ts
function getQueue(): SyncEntry[]
```

### Constraints

- Never mutate a queue entry in place — always read, modify a copy, write back.
- The queue is append-only from the UI side. Only the service worker (or explicit failure handling) removes entries.
- If localStorage is unavailable (private mode, storage quota exceeded), fall back to the original synchronous creation flow with no optimistic UI. Log a warning.

---

## Component 3: Background Sync (Service Worker)

### Registration

After enqueuing, register a Background Sync tag from the main thread:

```ts
const registration = await navigator.serviceWorker.ready
await registration.sync.register("gamemaster-task-sync")
```

If the Background Sync API is not available (unsupported browser), fall back to an immediate `fetch` attempt. If that fails, surface the error normally.

### Service Worker Sync Handler

```js
self.addEventListener("sync", (event) => {
  if (event.tag === "gamemaster-task-sync") {
    event.waitUntil(syncPendingTasks())
  }
})
```

### `syncPendingTasks` Logic

```
1. Read the full queue from localStorage.
2. If queue is empty, return early.
3. For each entry in the queue (in order):
   a. POST to /api/tasks with entry.payload and auth headers.
   b. On success (2xx):
      - Remove the entry from the queue (dequeue by tempId).
      - Post a message to all clients: { type: "TASK_SYNCED", tempId, serverTask }.
   c. On retryable failure (network error, 5xx):
      - Increment attemptCount on the entry.
      - If attemptCount >= MAX_RETRIES (default: 5), mark as failed:
        post { type: "TASK_SYNC_FAILED", tempId } to clients.
        Remove from queue (user must manually retry or discard).
      - Otherwise, leave in queue — the browser will re-trigger sync automatically.
   d. On non-retryable failure (4xx):
      - Mark as failed immediately, remove from queue.
      - Post { type: "TASK_SYNC_FAILED", tempId, reason } to clients.
4. Process entries serially, not in parallel, to preserve creation order.
```

### Auth Headers

The service worker must attach the Supabase auth token when making API requests. The token should be stored in localStorage (Supabase does this by default) and read by the service worker at sync time.

Supabase stores the session under a key matching `sb-<project-ref>-auth-token`. Read this at the start of `syncPendingTasks` and include the `access_token` as a Bearer token in the Authorization header.

---

## Main Thread Message Handling

The main thread (Vue app) listens for messages from the service worker via:

```ts
navigator.serviceWorker.addEventListener("message", (event) => {
  const { type, tempId, serverTask, reason } = event.data

  if (type === "TASK_SYNCED") {
    // Replace the optimistic task in the Pinia store with the real server record
    taskStore.replaceOptimisticTask(tempId, serverTask)
    // Remove from localStorage queue
    dequeueTask(tempId)
  }

  if (type === "TASK_SYNC_FAILED") {
    // Mark the task as failed in the Pinia store
    taskStore.markTaskSyncFailed(tempId, reason)
  }
})
```

### Pinia Store Changes

The task store needs three new actions:

```ts
// Insert an optimistic task
addOptimisticTask(task: OptimisticTask): void

// Replace an optimistic task with the confirmed server record
replaceOptimisticTask(tempId: string, serverTask: Task): void

// Mark a task as sync-failed
markTaskSyncFailed(tempId: string, reason?: string): void
```

Optimistic tasks should be stored alongside real tasks in the same list but are distinguishable by their `_syncStatus` field.

---

## On App Load (Hydration)

When the app boots, check localStorage for any leftover pending entries:

```ts
async function hydratePendingTasks(): Promise<void> {
  const queue = getQueue()
  for (const entry of queue) {
    // Inject pending optimistic tasks into the store
    taskStore.addOptimisticTask(buildOptimisticTask(entry))
  }
  // Re-register sync in case it wasn't triggered
  const reg = await navigator.serviceWorker.ready
  if (queue.length > 0) {
    await reg.sync.register("gamemaster-task-sync")
  }
}
```

Call `hydratePendingTasks()` in the app's `onMounted` hook, after the task store is initialised.

---

## Failure UX

When `_syncStatus === "failed"`:

- Show a small error indicator on the task card (e.g. a red dot or warning icon).
- On clicking the indicator, show two options: **Retry** and **Discard**.
- **Retry**: re-enqueue the task payload, reset `attemptCount` to 0, re-register sync, set `_syncStatus` back to `"pending"`.
- **Discard**: remove the optimistic task from the store and the queue entirely.

Do not auto-retry indefinitely. MAX_RETRIES is a hard stop.

---

## Browser Compatibility

| Feature | Support |
|---|---|
| Background Sync API | Chrome/Edge (desktop + Android). Not supported in Safari or Firefox. |
| localStorage | Universal |
| Service Worker | All modern browsers |

**Fallback for unsupported browsers (Safari, Firefox):**
- Skip Background Sync registration.
- After enqueuing, attempt an immediate `fetch`.
- On success: reconcile normally.
- On failure: mark as failed immediately, surface the failure UX.

Check support with:
```ts
const hasSyncSupport = "serviceWorker" in navigator && "SyncManager" in window
```

---

## File Structure

Suggested placement within the existing Vite + Vue 3 project:

```
src/
  composables/
    useTaskSync.ts          # enqueue, dequeue, hydrate logic
  stores/
    taskStore.ts            # extended with optimistic task actions
  service-worker/
    sw.ts                   # sync event handler (registered via vite-plugin-pwa)
```

The service worker file should be registered and managed through `vite-plugin-pwa`'s `injectManifest` strategy so custom sync logic can be added alongside precaching.

---

## vite-plugin-pwa Configuration

### Switching to `injectManifest`

The default `generateSW` strategy does not support custom service worker code. Switch to `injectManifest` in `vite.config.ts`:

```ts
// vite.config.ts
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: "injectManifest",      // replaces "generateSW"
      srcDir: "src/service-worker",      // directory containing your SW source
      filename: "sw.ts",                 // your custom SW entry point
      registerType: "autoUpdate",
      injectManifest: {
        swSrc: "src/service-worker/sw.ts",
        swDest: "dist/sw.js",
      },
    })
  ]
})
```

### Custom Service Worker Entry (`src/service-worker/sw.ts`)

The custom SW must import Workbox's precaching alongside the sync handler, so precaching behaviour from `generateSW` is preserved:

```ts
import { precacheAndRoute } from "workbox-precaching"

// Injected by vite-plugin-pwa at build time — do not remove
declare const self: ServiceWorkerGlobalScope
precacheAndRoute(self.__WB_MANIFEST)

// Background Sync handler
self.addEventListener("sync", (event) => {
  if (event.tag === "gamemaster-task-sync") {
    event.waitUntil(syncPendingTasks())
  }
})

async function syncPendingTasks() {
  // implementation as described in Component 3
}
```

The `self.__WB_MANIFEST` declaration is required — `vite-plugin-pwa` injects the precache manifest at this location at build time. Omitting it will break precaching.

### TypeScript Note

Add the following to `tsconfig.app.json` (or your service worker tsconfig) so `self.__WB_MANIFEST` resolves without type errors:

```json
{
  "compilerOptions": {
    "types": ["vite-plugin-pwa/client"]
  }
}
```

---

## Success Criteria

- A task created with no network appears immediately in the UI and syncs automatically when connectivity returns.
- A task created under a slow network appears immediately and reconciles silently on API response.
- Pending tasks survive a full page close and reappear correctly on next load.
- No duplicate tasks are created if the user refreshes before sync completes.
- The sync queue is always empty after a successful sync cycle.
