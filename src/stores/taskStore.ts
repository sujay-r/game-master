import { defineStore } from 'pinia'
import type { TaskType, TaskOutcomeType } from '@/types/common'
import { TaskStatus, SyncStatus } from '@/types/common'
import {
  fetchTasksWithOutcomes,
  insertTask,
  deleteTask as deleteTaskInDb,
  markTaskDone,
} from '@/lib/supabase'
import { useTokenStore } from '@/stores/resources'

interface TaskStoreState {
  tasks: TaskType[]
  loading: boolean
  error: string | null
}

const useTaskStore = defineStore('tasks', {
  state: (): TaskStoreState => ({
    tasks: [],
    loading: false,
    error: null,
  }),

  actions: {
    async loadTasks() {
      this.loading = true
      this.error = null
      try {
        this.tasks = await fetchTasksWithOutcomes()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load tasks'
        console.error('Error loading tasks: ', err)
      } finally {
        this.loading = false
      }
    },

    async createTask(taskData: {
      title: string
      description: string
      notes: string
      status: TaskStatus
      dueDate: Date | null
      questId?: number
      outcomes?: TaskOutcomeType[]
    }): Promise<TaskType> {
      try {
        const newTask = await insertTask(taskData)
        this.tasks.unshift(newTask)
        return newTask
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to create task'
        console.error('Error creating task: ', err)
        throw err
      }
    },

    async deleteTask(taskId: number | string): Promise<number | undefined> {
      try {
        // Only sync to DB for real (non-temp) IDs
        if (typeof taskId === 'number') {
          await deleteTaskInDb(taskId)
        }

        const taskIndex = this.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex !== -1) {
          const questId = this.tasks[taskIndex].questId
          this.tasks.splice(taskIndex, 1)
          return questId
        }
        return undefined
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to delete task'
        console.error('Error deleting task: ', err)
        throw err
      }
    },

    async completeTask(taskId: number | string) {
      try {
        const task = this.tasks.find((t) => t.id === taskId)
        if (!task) {
          throw new Error('Task not found in store')
        }

        // Only sync to DB for real IDs
        if (typeof taskId === 'number') {
          await markTaskDone(task)
        }

        task.status = TaskStatus.Done
        task.completedAt = new Date()

        const tokenStore = useTokenStore()
        if (task.outcomes) {
          for (const outcome of task.outcomes) {
            const token = tokenStore.getTokenByType(outcome.token_type)
            if (token) {
              const newQuantity = token.quantity + Number(outcome.quantity)
              tokenStore.updateTokenQuantity(outcome.token_type, newQuantity)
            }
          }
        }

        return task
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to complete task'
        console.error('Error completing task: ', err)
        throw err
      }
    },

    addOptimisticTask(task: TaskType) {
      this.tasks.unshift(task)
    },

    replaceOptimisticTask(tempId: string | number, serverTask: TaskType) {
      const index = this.tasks.findIndex((t) => t.id === tempId)
      if (index !== -1) {
        this.tasks[index] = { ...serverTask, _syncStatus: undefined }
      }
    },

    markTaskSyncFailed(tempId: string | number, reason?: string) {
      const task = this.tasks.find((t) => t.id === tempId)
      if (task) {
        task._syncStatus = SyncStatus.Failed
        console.error(`Task sync failed for ${tempId}:`, reason)
      }
    },

    removeOptimisticTask(tempId: string | number) {
      const index = this.tasks.findIndex((t) => t.id === tempId)
      if (index !== -1) {
        this.tasks.splice(index, 1)
      }
    },

    resetSyncStatus(tempId: string | number) {
      const task = this.tasks.find((t) => t.id === tempId)
      if (task) {
        task._syncStatus = SyncStatus.Pending
      }
    },

    clearError() {
      this.error = null
    },
  },

  getters: {
    unassignedTasks: (state) => {
      return state.tasks.filter(
        (t) => (t.questId === undefined || t.questId === null) && t.status !== TaskStatus.Done,
      )
    },

    getQuestTasks: (state) => {
      return (questId: number) => state.tasks.filter((t) => t.questId === questId)
    },
  },
})

export { useTaskStore }
