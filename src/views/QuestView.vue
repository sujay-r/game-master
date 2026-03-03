<template>
  <div class="quest-tracker">
    <!-- Header Section -->
    <div class="header-section">
      <HKTitle :img_path="questsTitleURL" :size="1" />

      <div class="controls">
        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            class="tab-button"
            :class="{ active: currentFilter === tab.value }"
            @click="currentFilter = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Sort Dropdown -->
        <div class="sort-control">
          <select v-model="sortBy" class="sort-select">
            <option value="created">Created Date</option>
            <option value="title">Title</option>
            <option value="progress">Progress</option>
          </select>
        </div>

        <!-- New Quest Button -->
        <button class="new-quest-button" @click="openCreateModal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="currentColor"
          >
            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
          </svg>
          New Quest
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="questStore.loading" class="loading-state">
      <p>Loading quests...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="questStore.error" class="error-state">
      <p>{{ questStore.error }}</p>
      <button @click="loadData">Retry</button>
    </div>

    <!-- Quests List -->
    <div v-else class="content">
      <!-- Empty State for No Quests -->
      <div v-if="filteredQuests.length === 0 && currentFilter !== 'unassigned'" class="empty-state">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="64px"
          viewBox="0 -960 960 960"
          width="64px"
          fill="#ccc"
        >
          <path
            d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"
          />
        </svg>
        <h3>No quests yet</h3>
        <p>Create your first quest to start organizing your tasks!</p>
        <button class="new-quest-button" @click="openCreateModal">Create Quest</button>
      </div>

      <!-- Quest Cards -->
      <div v-else class="quests-list">
        <QuestCard
          v-for="quest in filteredQuests"
          :key="quest.id"
          :quest="quest"
          :tasks="questStore.getQuestTasks(quest.id)"
          :is-expanded="questStore.isQuestExpanded(quest.id)"
          @toggle-expand="questStore.toggleQuestExpansion(quest.id)"
          @edit="openEditModal"
          @delete="openDeleteModal"
          @request-complete="openCompleteModal"
          @add-task="openAddTaskModal"
          @open-quest="openQuestDetail"
          @task-delete="handleTaskDelete"
        />
      </div>
    </div>

    <!-- Unassigned Tasks Section -->
    <div
      v-if="
        !questStore.loading &&
        !questStore.error &&
        (currentFilter === 'all' || currentFilter === 'unassigned')
      "
      class="unassigned-section"
    >
      <h3 class="section-title">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path
            d="M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z"
          />
        </svg>
        Unassigned Tasks
      </h3>

      <div v-if="questStore.unassignedTasks.length === 0" class="empty-tasks">
        <p>No unassigned tasks</p>
      </div>

      <div v-else class="unassigned-tasks-list">
        <Task
          v-for="task in questStore.unassignedTasks"
          :key="task.id"
          :task="task"
          :open-modal="taskToOpenId === task.id"
          @modal-closed="handleTaskModalClosed"
          @delete="handleTaskDelete"
        />
      </div>
    </div>

    <!-- Token Display -->
    <div class="token-count-wrapper">
      <TokenCountDisplay />
    </div>

    <!-- Quick Add Button -->
    <QuickAddButton
      @click="openQuickAddTaskModal"
      :style="{ bottom: 'calc(20px + var(--nav-bottom-offset, 0px))' }"
    />
  </div>

  <!-- Quest Modal (Create/Edit) -->
  <QuestModal v-model="isQuestModalOpen" :quest="editingQuest" @save="handleSaveQuest" />

  <!-- Delete Quest Modal -->
  <DeleteQuestModal
    v-model="isDeleteModalOpen"
    :quest-title="deletingQuest?.title || ''"
    :task-count="deletingQuest?.taskIds.length || 0"
    @confirm="handleDeleteQuest"
  />

  <!-- Quest Detail Modal -->
  <QuestDetailModal
    v-model="isQuestDetailModalOpen"
    :quest="selectedQuestForDetail"
    :tasks="selectedQuestForDetail ? questStore.getQuestTasks(selectedQuestForDetail.id) : []"
    @save-notes="handleSaveQuestNotes"
    @save-description="handleSaveQuestDescription"
    @open-task="handleOpenTaskFromQuest"
  />

  <!-- Task Creation Modal -->
  <TaskCreationModal
    v-model="isTaskCreationModalOpen"
    :quests="questStore.activeQuests"
    :initial-quest-id="taskCreationInitialQuestId"
    @created="handleTaskCreated"
    @cancelled="handleTaskCreationCancelled"
  />

  <!-- Complete Quest Modal -->
  <CompleteQuestModal
    v-model="showCompleteModal"
    :quest-title="questToComplete?.title || ''"
    @confirm="handleCompleteQuest"
    @cancel="showCompleteModal = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import HKTitle from '@/components/HKTitle.vue'
import Task from '@/components/Task.vue'
import QuestCard from '@/components/QuestCard.vue'
import QuestModal from '@/components/QuestModal.vue'
import QuestDetailModal from '@/components/QuestDetailModal.vue'
import DeleteQuestModal from '@/components/DeleteQuestModal.vue'
import CompleteQuestModal from '@/components/CompleteQuestModal.vue'
import TokenCountDisplay from '@/components/TokenCountDisplay.vue'
import QuickAddButton from '@/components/QuickAddButton.vue'
import TaskCreationModal from '@/components/TaskCreationModal.vue'
import { useQuestStore } from '@/stores/quests'
import { useTokenStore } from '@/stores/resources'
import { fetchTasksWithOutcomes } from '@/lib/supabase'
import {
  QuestStatus,
  type Quest,
  type QuestType,
  type TaskType,
  type TaskStatus,
  type TaskOutcomeType,
} from '@/types/common'

const questsTitleURL = new URL('@/assets/imgs/theQuests.png', import.meta.url).href

const questStore = useQuestStore()
const tokenStore = useTokenStore()

// Filter and Sort State
const currentFilter = ref<'all' | 'main' | 'side' | 'lifeAdmin' | 'unassigned'>('all')
const sortBy = ref<'created' | 'title' | 'progress'>('created')

const filterTabs: Array<{
  value: 'all' | 'main' | 'side' | 'lifeAdmin' | 'unassigned'
  label: string
}> = [
  { value: 'all', label: 'All' },
  { value: 'main', label: 'Main' },
  { value: 'side', label: 'Side' },
  { value: 'lifeAdmin', label: 'Life Admin' },
  { value: 'unassigned', label: 'Unassigned' },
]

// Modal State
const isQuestModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isQuestDetailModalOpen = ref(false)
const isTaskCreationModalOpen = ref(false)
const editingQuest = ref<Quest | undefined>(undefined)
const deletingQuest = ref<Quest | null>(null)
const questToComplete = ref<Quest | null>(null)
const showCompleteModal = ref(false)
const selectedQuestForDetail = ref<Quest | null>(null)
const taskToOpenId = ref<number | null>(null)
const shouldReopenQuestAfterTask = ref(false)
const taskCreationInitialQuestId = ref<number | null>(null)

// Computed
const filteredQuests = computed(() => {
  // Filter out completed quests
  let quests = questStore.quests.filter((q) => q.status !== QuestStatus.Completed)

  // Filter by type
  if (currentFilter.value === 'main') {
    quests = quests.filter((q) => q.type === 'main')
  } else if (currentFilter.value === 'side') {
    quests = quests.filter((q) => q.type === 'side')
  } else if (currentFilter.value === 'lifeAdmin') {
    quests = quests.filter((q) => q.type === 'lifeAdmin')
  }

  // Sort
  return [...quests].sort((a, b) => {
    // When showing all quests, prioritize main quests over side quests, then lifeAdmin
    if (currentFilter.value === 'all') {
      const typeOrder = { main: 0, side: 1, lifeAdmin: 2 }
      const typeDiff = typeOrder[a.type] - typeOrder[b.type]
      if (typeDiff !== 0) return typeDiff
    }

    // Then apply the selected sort criteria
    switch (sortBy.value) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'progress': {
        const progressA = questStore.questProgress(a.id).percentage
        const progressB = questStore.questProgress(b.id).percentage
        return progressB - progressA // Descending
      }
      case 'created':
      default:
        return b.createdAt.getTime() - a.createdAt.getTime() // Newest first
    }
  })
})

// Methods
async function loadData() {
  const tasks = await fetchTasksWithOutcomes()
  await questStore.loadQuests(tasks)
}

function openCreateModal() {
  editingQuest.value = undefined
  isQuestModalOpen.value = true
}

function openEditModal(quest: Quest) {
  editingQuest.value = quest
  isQuestModalOpen.value = true
}

function openDeleteModal(quest: Quest) {
  deletingQuest.value = quest
  isDeleteModalOpen.value = true
}

function openAddTaskModal(quest: Quest) {
  taskCreationInitialQuestId.value = quest.id
  isTaskCreationModalOpen.value = true
}

function openQuickAddTaskModal() {
  taskCreationInitialQuestId.value = null
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
}) {
  try {
    await questStore.createTask(taskData)
    taskCreationInitialQuestId.value = null
  } catch (err) {
    console.error('Failed to create task:', err)
  }
}

function handleTaskCreationCancelled() {
  taskCreationInitialQuestId.value = null
}

async function handleSaveQuest(data: { title: string; description: string; type: QuestType }) {
  if (editingQuest.value) {
    await questStore.updateQuest(editingQuest.value.id, data)
  } else {
    await questStore.createQuest(data)
  }
}

async function handleDeleteQuest(cascadeTasks: boolean) {
  if (deletingQuest.value) {
    await questStore.deleteQuest(deletingQuest.value.id, cascadeTasks)
    deletingQuest.value = null
  }
}

function openCompleteModal(quest: Quest) {
  questToComplete.value = quest
  showCompleteModal.value = true
}

async function handleCompleteQuest() {
  if (questToComplete.value) {
    await questStore.completeQuest(questToComplete.value.id)
    showCompleteModal.value = false
    questToComplete.value = null
  }
}

function openQuestDetail(quest: Quest) {
  selectedQuestForDetail.value = quest
  isQuestDetailModalOpen.value = true
}

async function handleSaveQuestNotes(data: { questId: number; notes: string }) {
  await questStore.updateQuestNotes(data.questId, data.notes)
}

async function handleSaveQuestDescription(data: { questId: number; description: string }) {
  await questStore.updateQuest(data.questId, { description: data.description })
}

function handleOpenTaskFromQuest(task: TaskType) {
  if (!task.id) return

  shouldReopenQuestAfterTask.value = true
  isQuestDetailModalOpen.value = false

  // Set the task ID to open after the quest modal closes
  taskToOpenId.value = task.id
}

function handleTaskModalClosed() {
  if (shouldReopenQuestAfterTask.value && selectedQuestForDetail.value) {
    shouldReopenQuestAfterTask.value = false
    // Small delay for smooth transition
    setTimeout(() => {
      isQuestDetailModalOpen.value = true
    }, 100)
  }
  // Clear the task to open after modal is closed
  taskToOpenId.value = null
}

async function handleTaskDelete(taskId: number) {
  try {
    await questStore.deleteTask(taskId)
  } catch (err) {
    console.error('Failed to delete task:', err)
  }
}

// Lifecycle
onMounted(() => {
  loadData()
  // Load tokens if not already loaded
  if (tokenStore.tokens.length === 0) {
    tokenStore.fetchTokensFromDb()
  }
})
</script>

<style scoped>
.quest-tracker {
  padding-bottom: 100px;
  background-color: #f2f2ee;
}

.header-section {
  margin-bottom: 1.5rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0 1rem;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-button {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  font-weight: 600;
  color: #424242;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  border-color: #32a287;
  color: #32a287;
}

.tab-button.active {
  background: #32a287;
  border-color: #32a287;
  color: #fff;
}

.sort-control {
  display: flex;
  align-items: center;
}

.sort-select {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
}

.sort-select:focus {
  outline: none;
  border-color: #32a287;
}

.new-quest-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #32a287;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
  margin-left: auto;
}

.new-quest-button:hover {
  background: #2d826d;
  transform: translateY(-1px);
}

.new-quest-button:active {
  transform: translateY(0);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-state button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #32a287;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-state svg {
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-family: Trajan;
  font-size: 1.5em;
  margin-bottom: 0.5rem;
  color: #424242;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.content {
  padding: 0 1rem;
}

.quests-list {
  margin-bottom: 2rem;
}

.unassigned-section {
  border-top: 2px solid #e0e0e0;
  padding: 2rem 1rem 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: Trajan;
  font-size: 1.25em;
  color: #424242;
  margin: 0 0 1rem 0;
}

.empty-tasks {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.unassigned-tasks-list {
  display: flex;
  flex-direction: column;
}

.token-count-wrapper {
  position: fixed;
  bottom: calc(20px + var(--nav-bottom-offset, 0px));
  right: 76px;
  z-index: 100;
  transition: bottom 0.3s ease;
}

/* Quick add button bottom offset is overridden via inline style using --nav-bottom-offset */

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .filter-tabs {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    padding-right: 0.5rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .filter-tabs::-webkit-scrollbar {
    display: none;
  }

  .tab-button {
    flex-shrink: 0;
    padding: 0.5rem 0.875rem;
    font-size: 0.8em;
  }

  .tab-button:last-child {
    margin-right: 1rem;
  }

  .sort-control {
    width: 100%;
  }

  .sort-select {
    width: 100%;
  }

  .new-quest-button {
    margin-left: 0;
    width: 100%;
    justify-content: center;
    order: 3;
  }
}

@media (max-width: 480px) {
  .controls {
    padding: 0 0.5rem;
  }

  .tab-button {
    padding: 0.4rem 0.75rem;
    font-size: 0.75em;
  }

  .new-quest-button {
    padding: 0.5rem 0.875rem;
    font-size: 0.8em;
  }
}
</style>
