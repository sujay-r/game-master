import { useTaskStore } from '@/stores/taskStore'
import { useQuestStore } from '@/stores/quests'
import type { TaskType, TaskOutcomeType, TaskStatus } from '@/types/common'
import { SyncStatus as SyncStatusEnum } from '@/types/common'

const DB_NAME = 'gamemaster_sync'
const DB_VERSION = 1
const QUEUE_STORE = 'queue'
const TOKEN_STORE = 'tokens'
const SYNC_TAG = 'gamemaster-task-sync'

interface SyncEntry {
  tempId: string
  payload: {
    title: string
    description?: string
    questId?: number
    tokenReward?: { Care?: number; Grind?: number }
    notes?: string
    dueDate?: string
    outcomes?: TaskOutcomeType[]
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

async function enqueueTask(
  tempId: string,
  payload: SyncEntry['payload'],
  authToken: string,
): Promise<void> {
  const db = await openSyncDb()
  const tx = db.transaction([QUEUE_STORE, TOKEN_STORE], 'readwrite')

  const queueStore = tx.objectStore(QUEUE_STORE)
  const entry: SyncEntry = {
    tempId,
    payload,
    queuedAt: new Date().toISOString(),
    attemptCount: 0,
  }
  queueStore.put(entry)

  const tokenStore = tx.objectStore(TOKEN_STORE)
  tokenStore.put({ id: 'auth', token: authToken })

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
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

function generateTempId(): string {
  return `temp_${crypto.randomUUID()}`
}

function buildOptimisticTask(entry: SyncEntry): TaskType {
  return {
    id: entry.tempId,
    title: entry.payload.title,
    description: entry.payload.description || '',
    notes: entry.payload.notes || '',
    status: 'TODO' as TaskStatus,
    dueDate: entry.payload.dueDate ? new Date(entry.payload.dueDate) : null,
    questId: entry.payload.questId,
    createdAt: new Date(entry.queuedAt),
    completedAt: null,
    outcomes: entry.payload.outcomes,
    _syncStatus: SyncStatusEnum.Pending,
  }
}

const hasSyncSupport = 'serviceWorker' in navigator && 'SyncManager' in window

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: { register(tag: string): Promise<void> }
}

async function registerBackgroundSync(): Promise<void> {
  if (!hasSyncSupport) return
  const registration = (await navigator.serviceWorker.ready) as ServiceWorkerRegistrationWithSync
  await registration.sync.register(SYNC_TAG)
}

async function doImmediateSync(taskData: SyncEntry['payload']): Promise<TaskType | null> {
  // Fallback: attempt immediate fetch when Background Sync is unavailable
  const { insertTask } = await import('@/lib/supabase')
  return await insertTask({
    title: taskData.title,
    description: taskData.description || '',
    notes: taskData.notes || '',
    status: 'TODO' as TaskStatus,
    dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
    questId: taskData.questId,
    outcomes: taskData.outcomes,
  })
}

function listenForSyncMessages() {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.addEventListener('message', async (event) => {
    const { type, tempId, serverTask, reason } = event.data
    const taskStore = useTaskStore()
    const questStore = useQuestStore()

    if (type === 'TASK_SYNCED') {
      const oldTask = taskStore.tasks.find((t) => t.id === tempId)
      const hadQuestId = oldTask?.questId

      taskStore.replaceOptimisticTask(tempId, serverTask)
      await dequeueTask(tempId)

      // Update quest taskIds: replace tempId with real id
      if (hadQuestId && typeof serverTask.id === 'number') {
        questStore.detachTaskFromQuest(tempId)
        questStore.addTaskIdToQuest(serverTask.id, hadQuestId)
      }
    }

    if (type === 'TASK_SYNC_FAILED') {
      taskStore.markTaskSyncFailed(tempId, reason)
    }
  })
}

// Set up listener once on module load
listenForSyncMessages()

interface CreateTaskInput {
  title: string
  description: string
  notes: string
  status: TaskStatus
  dueDate: Date | null
  questId?: number
  outcomes?: TaskOutcomeType[]
}

export function useTaskSync() {
  const taskStore = useTaskStore()
  const questStore = useQuestStore()

  async function createOptimisticTask(taskData: CreateTaskInput): Promise<void> {
    const tempId = generateTempId()

    const optimisticTask: TaskType = {
      id: tempId,
      title: taskData.title,
      description: taskData.description,
      notes: taskData.notes,
      status: taskData.status,
      dueDate: taskData.dueDate,
      questId: taskData.questId,
      createdAt: new Date(),
      completedAt: null,
      outcomes: taskData.outcomes,
      _syncStatus: SyncStatusEnum.Pending,
    }

    taskStore.addOptimisticTask(optimisticTask)

    if (taskData.questId) {
      questStore.addTaskIdToQuest(tempId, taskData.questId)
    }

    // Read auth token from Supabase localStorage
    const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_URL?.match(/\/\/([^.]+)/)?.[1] ?? ''
    const sessionKey = `sb-${projectRef}-auth-token`
    const sessionRaw = localStorage.getItem(sessionKey)
    let authToken = ''
    try {
      const session = sessionRaw ? JSON.parse(sessionRaw) : null
      authToken = session?.access_token ?? ''
    } catch {
      authToken = ''
    }

    const payload: SyncEntry['payload'] = {
      title: taskData.title,
      description: taskData.description,
      notes: taskData.notes,
      questId: taskData.questId,
      dueDate: taskData.dueDate?.toISOString(),
      outcomes: taskData.outcomes,
    }

    try {
      await enqueueTask(tempId, payload, authToken)
    } catch (err) {
      console.warn('IndexedDB unavailable, falling back to synchronous creation:', err)
      // Fallback: remove optimistic task and do synchronous create
      taskStore.removeOptimisticTask(tempId)
      if (taskData.questId) {
        questStore.detachTaskFromQuest(tempId)
      }
      const newTask = await taskStore.createTask(taskData)
      if (taskData.questId && typeof newTask.id === 'number') {
        questStore.addTaskIdToQuest(newTask.id, taskData.questId)
      }
      return
    }

    if (hasSyncSupport) {
      await registerBackgroundSync()
    } else {
      // No Background Sync: try immediate fetch
      try {
        const serverTask = await doImmediateSync(payload)
        if (serverTask) {
          taskStore.replaceOptimisticTask(tempId, serverTask)
          await dequeueTask(tempId)
          if (taskData.questId && typeof serverTask.id === 'number') {
            questStore.detachTaskFromQuest(tempId)
            questStore.addTaskIdToQuest(serverTask.id, taskData.questId)
          }
        }
      } catch (err) {
        console.error('Immediate sync failed:', err)
        taskStore.markTaskSyncFailed(tempId, 'Sync not supported and immediate request failed')
      }
    }
  }

  async function retryOptimisticTask(tempId: string): Promise<void> {
    const task = taskStore.tasks.find((t) => t.id === tempId)
    if (!task) return

    taskStore.resetSyncStatus(tempId)

    // Re-read auth token
    const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_URL?.match(/\/\/([^.]+)/)?.[1] ?? ''
    const sessionKey = `sb-${projectRef}-auth-token`
    const sessionRaw = localStorage.getItem(sessionKey)
    let authToken = ''
    try {
      const session = sessionRaw ? JSON.parse(sessionRaw) : null
      authToken = session?.access_token ?? ''
    } catch {
      authToken = ''
    }

    const payload = {
      title: task.title,
      description: task.description,
      notes: task.notes,
      questId: task.questId,
      dueDate: task.dueDate?.toISOString(),
      outcomes: task.outcomes,
    }

    try {
      await enqueueTask(tempId, payload, authToken)
      if (hasSyncSupport) {
        await registerBackgroundSync()
      } else {
        try {
          const serverTask = await doImmediateSync(payload)
          if (serverTask) {
            taskStore.replaceOptimisticTask(tempId, serverTask)
            await dequeueTask(tempId)
            if (task.questId && typeof serverTask.id === 'number') {
              questStore.detachTaskFromQuest(tempId)
              questStore.addTaskIdToQuest(serverTask.id, task.questId)
            }
          }
        } catch (err) {
          console.error('Immediate retry failed:', err)
          taskStore.markTaskSyncFailed(tempId)
        }
      }
    } catch (err) {
      console.warn('IndexedDB unavailable for retry:', err)
      taskStore.markTaskSyncFailed(tempId)
    }
  }

  async function discardOptimisticTask(tempId: string): Promise<void> {
    const task = taskStore.tasks.find((t) => t.id === tempId)
    if (task?.questId) {
      questStore.detachTaskFromQuest(tempId)
    }
    taskStore.removeOptimisticTask(tempId)
    try {
      await dequeueTask(tempId)
    } catch (err) {
      console.error('Error dequeuing discarded task:', err)
    }
  }

  async function hydratePendingTasks(): Promise<void> {
    try {
      const queue = await getQueue()
      for (const entry of queue) {
        const exists = taskStore.tasks.find((t) => t.id === entry.tempId)
        if (!exists) {
          const optimisticTask = buildOptimisticTask(entry)
          taskStore.addOptimisticTask(optimisticTask)
          if (optimisticTask.questId) {
            questStore.addTaskIdToQuest(entry.tempId, optimisticTask.questId)
          }
        }
      }

      if (queue.length > 0 && hasSyncSupport) {
        const registration = (await navigator.serviceWorker
          .ready) as ServiceWorkerRegistrationWithSync
        await registration.sync.register(SYNC_TAG)
      }
    } catch (err) {
      console.warn('Error hydrating pending tasks:', err)
    }
  }

  return {
    createOptimisticTask,
    retryOptimisticTask,
    discardOptimisticTask,
    hydratePendingTasks,
  }
}
