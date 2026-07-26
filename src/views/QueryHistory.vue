<template>
  <div class="query-history">
    <div class="history-header">
      <RouterLink to="/finance" class="back-link">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Dashboard
      </RouterLink>
    </div>

    <h1 class="history-title">Query History</h1>
    <p class="history-description">
      Review past natural-language queries and their results. This screen will be built in task 282.
    </p>

    <div class="token-count-wrapper">
      <TokenCountDisplay />
    </div>

    <QuickAddButton
      @click="openQuickAddTaskModal"
      :style="{ bottom: 'calc(20px + var(--nav-bottom-offset, 0px))' }"
    />
  </div>

  <TaskCreationModal
    v-model="isTaskCreationModalOpen"
    :quests="questStore.activeQuests"
    :initial-quest-id="null"
    @created="handleTaskCreated"
    @cancelled="handleTaskCreationCancelled"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import TokenCountDisplay from '@/components/common/TokenCountDisplay.vue'
import QuickAddButton from '@/components/common/QuickAddButton.vue'
import TaskCreationModal from '@/components/tasks/TaskCreationModal.vue'
import { useQuestStore } from '@/stores/quests'
import { useTaskSync } from '@/composables/useTaskSync'
import { useTokenStore } from '@/stores/resources'
import type { TaskStatus, TaskOutcomeType } from '@/types/common'

const questStore = useQuestStore()
const taskSync = useTaskSync()
const tokenStore = useTokenStore()

const isTaskCreationModalOpen = ref(false)

function openQuickAddTaskModal() {
  isTaskCreationModalOpen.value = true
}

async function handleTaskCreated(taskData: {
  title: string
  description: string
  notes: string
  status: TaskStatus
  dueDate: Date | null
  questId?: number
  outcomes?: TaskOutcomeType[]
  tagIds?: number[]
}) {
  try {
    await taskSync.createOptimisticTask(taskData)
  } catch (err) {
    console.error('Failed to create task:', err)
  }
}

function handleTaskCreationCancelled() {
  // Modal handles its own cleanup
}

onMounted(async () => {
  if (questStore.quests.length === 0) {
    try {
      await questStore.loadQuests()
    } catch (err) {
      console.error('Error loading quests:', err)
    }
  }
  taskSync.hydratePendingTasks()
  if (tokenStore.tokens.length === 0) {
    tokenStore.fetchTokensFromDb()
  }
})
</script>

<style scoped>
.query-history {
  padding: 2rem 1rem 100px;
  max-width: 800px;
  margin: 0 auto;
}

.history-header {
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #32a287;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95em;
  transition: color 0.2s;
}

.back-link:hover {
  color: #2d826d;
}

.history-title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 2em;
  color: #424242;
  margin: 0 0 0.5rem;
}

.history-description {
  color: #666;
  font-size: 1em;
  margin: 0;
}

.token-count-wrapper {
  position: fixed;
  bottom: calc(20px + var(--nav-bottom-offset, 0px));
  right: 76px;
  z-index: 100;
  transition: bottom 0.3s ease;
}

/* Quick add button bottom offset is overridden via inline style using --nav-bottom-offset */
</style>
