/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { createClient } from '@supabase/supabase-js'

interface SyncEvent extends ExtendableEvent {
  tag: string
  waitUntil(promise: Promise<unknown>): void
}

// Injected by vite-plugin-pwa at build time — do not remove
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

const supabaseUrl =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_PROJECT_URL ?? ''
const supabaseKey =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_API_KEY ?? ''

precacheAndRoute(self.__WB_MANIFEST)

const DB_NAME = 'gamemaster_sync'
const DB_VERSION = 1
const QUEUE_STORE = 'queue'
const TOKEN_STORE = 'tokens'
const SYNC_TAG = 'gamemaster-task-sync'
const MAX_RETRIES = 5

interface SyncEntry {
  tempId: string
  payload: {
    title: string
    description?: string
    questId?: number
    tokenReward?: { Care?: number; Grind?: number }
    notes?: string
    dueDate?: string
    outcomes?: Array<{
      token_type: string
      quantity: string
      icon_filename?: string
      icon_color?: string
      icon?: string
    }>
  }
  queuedAt: string
  attemptCount: number
}

function openSyncDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'tempId' })
      }
      if (!db.objectStoreNames.contains(TOKEN_STORE)) {
        db.createObjectStore(TOKEN_STORE, { keyPath: 'id' })
      }
    }
  })
}

async function getQueue(): Promise<SyncEntry[]> {
  const db = await openSyncDb()
  const tx = db.transaction(QUEUE_STORE, 'readonly')
  const store = tx.objectStore(QUEUE_STORE)
  const request = store.getAll()

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as SyncEntry[])
    request.onerror = () => reject(request.error)
  })
}

async function getAuthToken(): Promise<string | null> {
  const db = await openSyncDb()
  const tx = db.transaction(TOKEN_STORE, 'readonly')
  const store = tx.objectStore(TOKEN_STORE)
  const request = store.get('auth')

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const result = request.result as { token: string } | undefined
      resolve(result?.token ?? null)
    }
    request.onerror = () => reject(request.error)
  })
}

async function dequeueTask(tempId: string): Promise<void> {
  const db = await openSyncDb()
  const tx = db.transaction(QUEUE_STORE, 'readwrite')
  const store = tx.objectStore(QUEUE_STORE)
  store.delete(tempId)

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function incrementAttemptCount(tempId: string): Promise<void> {
  const db = await openSyncDb()
  const tx = db.transaction(QUEUE_STORE, 'readwrite')
  const store = tx.objectStore(QUEUE_STORE)
  const request = store.get(tempId)

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const entry = request.result as SyncEntry | undefined
      if (entry) {
        entry.attemptCount += 1
        store.put(entry)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }
    request.onerror = () => reject(request.error)
  })
}

async function postToClients(message: unknown): Promise<void> {
  const clientsList = await self.clients.matchAll({ type: 'window' })
  clientsList.forEach((client) => {
    client.postMessage(message)
  })
}

async function syncPendingTasks(): Promise<void> {
  const queue = await getQueue()
  if (queue.length === 0) return

  const authToken = await getAuthToken()
  if (!authToken) {
    console.error('No auth token available for sync')
    for (const entry of queue) {
      await postToClients({
        type: 'TASK_SYNC_FAILED',
        tempId: entry.tempId,
        reason: 'No auth token',
      })
      await dequeueTask(entry.tempId)
    }
    return
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  })

  for (const entry of queue) {
    try {
      const { data, error } = await client
        .from('Task')
        .insert({
          title: entry.payload.title,
          description: entry.payload.description || null,
          notes: entry.payload.notes || null,
          status: 'TODO',
          due_date: entry.payload.dueDate || null,
          quest_id: entry.payload.questId || null,
          created_at: new Date().toISOString(),
          completed_at: null,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Insert outcomes if provided
      if (entry.payload.outcomes && entry.payload.outcomes.length > 0) {
        const outcomesData = entry.payload.outcomes.map((outcome) => ({
          task_id: data.id,
          token_type: outcome.token_type,
          quantity: parseInt(outcome.quantity as unknown as string, 10) || 1,
        }))
        const { error: outcomesError } = await client.from('TaskOutcome').insert(outcomesData)
        if (outcomesError) {
          console.error('Error inserting outcomes:', outcomesError)
        }
      }

      // Build server task to send back
      const serverTask = {
        title: data.title,
        description: data.description,
        status: data.status,
        notes: data.notes,
        id: data.id,
        questId: data.quest_id,
        createdAt: new Date(data.created_at),
        dueDate: data.due_date ? new Date(data.due_date) : null,
        completedAt: data.completed_at ? new Date(data.completed_at) : null,
        outcomes: entry.payload.outcomes || [],
      }

      await dequeueTask(entry.tempId)
      await postToClients({ type: 'TASK_SYNCED', tempId: entry.tempId, serverTask })
    } catch (err) {
      const isRetryable =
        err instanceof TypeError ||
        (typeof err === 'object' &&
          err !== null &&
          'status' in err &&
          (err.status === undefined || Number(err.status) >= 500))

      if (isRetryable) {
        await incrementAttemptCount(entry.tempId)
        const updatedEntry = (await getQueue()).find((e) => e.tempId === entry.tempId)
        if (updatedEntry && updatedEntry.attemptCount >= MAX_RETRIES) {
          await postToClients({
            type: 'TASK_SYNC_FAILED',
            tempId: entry.tempId,
            reason: 'Max retries exceeded',
          })
          await dequeueTask(entry.tempId)
        }
        // Otherwise leave in queue for next sync attempt
      } else {
        // Non-retryable (4xx, etc.)
        const reason = err instanceof Error ? err.message : 'Non-retryable sync error'
        await postToClients({ type: 'TASK_SYNC_FAILED', tempId: entry.tempId, reason })
        await dequeueTask(entry.tempId)
      }
    }
  }
}

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as unknown as SyncEvent
  if (syncEvent.tag === SYNC_TAG) {
    syncEvent.waitUntil(syncPendingTasks())
  }
})
