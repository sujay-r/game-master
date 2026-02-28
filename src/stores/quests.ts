import { defineStore } from 'pinia'
import type { Quest, QuestType, TaskType } from '@/types/common'
import { QuestStatus } from '@/types/common'
import {
  fetchQuests,
  createQuest as createQuestInDb,
  updateQuest as updateQuestInDb,
  deleteQuest as deleteQuestInDb,
  completeQuest as completeQuestInDb,
  assignTaskToQuest as assignTaskToQuestInDb,
  removeTaskFromQuest as removeTaskFromQuestInDb,
} from '@/lib/supabase'

interface QuestStoreState {
  quests: Quest[]
  tasks: TaskType[]
  loading: boolean
  error: string | null
  expandedQuestIds: number[]
}

const STORAGE_KEY = 'quest-expanded-state'

const useQuestStore = defineStore('quests', {
  state: (): QuestStoreState => ({
    quests: [],
    tasks: [],
    loading: false,
    error: null,
    expandedQuestIds: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
  }),

  actions: {
    async loadQuests(allTasks: TaskType[]) {
      this.loading = true
      this.error = null

      try {
        this.tasks = allTasks
        this.quests = await fetchQuests()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load quests'
        console.error('Error loading quests: ', err)
      } finally {
        this.loading = false
      }
    },

    async createQuest(questData: { title: string; description?: string; type: QuestType }) {
      try {
        const newQuest = await createQuestInDb(questData)
        this.quests.unshift(newQuest)
        return newQuest
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to create quest'
        console.error('Error creating quest: ', err)
        throw err
      }
    },

    async updateQuest(questId: number, updates: Partial<Omit<Quest, 'id' | 'taskIds'>>) {
      try {
        await updateQuestInDb(questId, updates)
        const questIndex = this.quests.findIndex((q) => q.id === questId)
        if (questIndex !== -1) {
          this.quests[questIndex] = { ...this.quests[questIndex], ...updates }
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to update quest'
        console.error('Error updating quest: ', err)
        throw err
      }
    },

    async deleteQuest(questId: number, cascadeTasks: boolean) {
      try {
        await deleteQuestInDb(questId, cascadeTasks)

        if (!cascadeTasks) {
          this.tasks.forEach((task) => {
            if (task.questId === questId) {
              task.questId = undefined
            }
          })
        } else {
          this.tasks = this.tasks.filter((task) => task.questId !== questId)
        }

        this.quests = this.quests.filter((q) => q.id !== questId)
        this.expandedQuestIds = this.expandedQuestIds.filter((id) => id !== questId)
        this.saveExpandedState()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to delete quest'
        console.error('Error deleting quest: ', err)
        throw err
      }
    },

    async completeQuest(questId: number) {
      try {
        await completeQuestInDb(questId)
        const questIndex = this.quests.findIndex((q) => q.id === questId)
        if (questIndex !== -1) {
          this.quests[questIndex].status = QuestStatus.Completed
        }
        this.collapseQuest(questId)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to complete quest'
        console.error('Error completing quest: ', err)
        throw err
      }
    },

    async assignTaskToQuest(taskId: number, questId: number) {
      try {
        await assignTaskToQuestInDb(taskId, questId)

        const taskIndex = this.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex !== -1) {
          this.tasks[taskIndex].questId = questId
        }

        const questIndex = this.quests.findIndex((q) => q.id === questId)
        if (questIndex !== -1 && !this.quests[questIndex].taskIds.includes(taskId)) {
          this.quests[questIndex].taskIds.push(taskId)
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to assign task to quest'
        console.error('Error assigning task to quest: ', err)
        throw err
      }
    },

    async removeTaskFromQuest(taskId: number) {
      try {
        await removeTaskFromQuestInDb(taskId)

        const taskIndex = this.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex !== -1) {
          const questId = this.tasks[taskIndex].questId
          this.tasks[taskIndex].questId = undefined

          if (questId) {
            const questIndex = this.quests.findIndex((q) => q.id === questId)
            if (questIndex !== -1) {
              this.quests[questIndex].taskIds = this.quests[questIndex].taskIds.filter(
                (id) => id !== taskId,
              )
            }
          }
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to remove task from quest'
        console.error('Error removing task from quest: ', err)
        throw err
      }
    },

    expandQuest(questId: number) {
      if (!this.expandedQuestIds.includes(questId)) {
        this.expandedQuestIds.push(questId)
        this.saveExpandedState()
      }
    },

    collapseQuest(questId: number) {
      this.expandedQuestIds = this.expandedQuestIds.filter((id) => id !== questId)
      this.saveExpandedState()
    },

    toggleQuestExpansion(questId: number) {
      if (this.expandedQuestIds.includes(questId)) {
        this.collapseQuest(questId)
      } else {
        this.expandQuest(questId)
      }
    },

    saveExpandedState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expandedQuestIds))
    },

    clearError() {
      this.error = null
    },
  },

  getters: {
    questsByType: (state) => {
      return (type: QuestType) => state.quests.filter((q) => q.type === type)
    },

    activeQuests: (state) => {
      return state.quests.filter((q) => q.status === 'active' || q.status === 'todo')
    },

    completedQuests: (state) => {
      return state.quests.filter((q) => q.status === 'completed')
    },

    getQuestTasks: (state) => {
      return (questId: number) => {
        return state.tasks.filter((t) => t.questId === questId)
      }
    },

    unassignedTasks: (state) => {
      return state.tasks.filter((t) => t.questId === undefined || t.questId === null)
    },

    questProgress: (state) => {
      return (questId: number) => {
        const quest = state.quests.find((q) => q.id === questId)
        if (!quest) return { completed: 0, total: 0, percentage: 0 }

        const tasks = state.tasks.filter((t) => t.questId === questId)
        const total = tasks.length
        const completed = tasks.filter((t) => t.status === 'DONE').length
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

        return { completed, total, percentage }
      }
    },

    isQuestExpanded: (state) => {
      return (questId: number) => state.expandedQuestIds.includes(questId)
    },

    getQuestById: (state) => {
      return (questId: number) => state.quests.find((q) => q.id === questId)
    },
  },
})

export { useQuestStore }
