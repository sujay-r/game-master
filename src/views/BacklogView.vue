<template>
  <div class="backlog-view">
    <!-- Header Section -->
    <div class="header-section">
      <HKTitle :img_path="backlogTitleURL" :size="1" />

      <div class="controls">
        <RouterLink to="/quests" class="back-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="18px"
            viewBox="0 -960 960 960"
            width="18px"
            fill="currentColor"
          >
            <path d="M360-240 120-480l240-240 56 56-144 144h488v80H272l144 144-56 56Z" />
          </svg>
          Back to Quests
        </RouterLink>

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
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="taskStore.loading || questStore.loading" class="loading-state">
      <p>Loading backlog...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="questStore.error" class="error-state">
      <p>{{ questStore.error }}</p>
      <button @click="loadData">Retry</button>
    </div>

    <!-- Backlog List -->
    <div v-else class="content">
      <!-- Empty State -->
      <div v-if="filteredQuests.length === 0" class="empty-state">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="64px"
          viewBox="0 -960 960 960"
          width="64px"
          fill="#ccc"
        >
          <path
            d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-640v560h560v-560H200Zm80-80v-80h560q33 0 56.5 23.5T920-760v480h-80v-480H280Zm160 320h320v-80H440v80Zm0-160h320v-80H440v80ZM200-200h560v-560H200v560Z"
          />
        </svg>
        <h3>Your backlog is empty</h3>
        <p>Planned quests that aren't active yet will appear here.</p>
      </div>

      <!-- Quest Cards -->
      <div v-else class="quests-list">
        <QuestCard
          v-for="quest in filteredQuests"
          :key="quest.id"
          :quest="quest"
          :tasks="taskStore.getQuestTasks(quest.id)"
          :is-expanded="questStore.isQuestExpanded(quest.id)"
          :show-add-task="false"
          @toggle-expand="questStore.toggleQuestExpansion(quest.id)"
          @edit="openEditModal"
          @delete="openDeleteModal"
          @request-complete="openCompleteModal"
          @open-quest="openQuestDetail"
          @task-delete="handleTaskDelete"
          @toggle-status="handleToggleStatus"
        />
      </div>
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
      :tasks="selectedQuestForDetail ? taskStore.getQuestTasks(selectedQuestForDetail.id) : []"
      @save-notes="handleSaveQuestNotes"
      @save-description="handleSaveQuestDescription"
      @open-task="handleOpenTaskFromQuest"
    />

    <!-- Complete Quest Modal -->
    <CompleteQuestModal
      v-model="showCompleteModal"
      :quest-title="questToComplete?.title || ''"
      @confirm="handleCompleteQuest"
      @cancel="showCompleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import HKTitle from '@/components/common/HKTitle.vue'
import QuestCard from '@/components/quests/QuestCard.vue'
import QuestModal from '@/components/quests/QuestModal.vue'
import QuestDetailModal from '@/components/quests/QuestDetailModal.vue'
import DeleteQuestModal from '@/components/quests/DeleteQuestModal.vue'
import CompleteQuestModal from '@/components/quests/CompleteQuestModal.vue'
import { useQuestStore } from '@/stores/quests'
import { useTaskStore } from '@/stores/taskStore'
import { QuestStatus, type Quest, type QuestType, type TaskType } from '@/types/common'

const backlogTitleURL = new URL('@/assets/imgs/theQuests.png', import.meta.url).href

const questStore = useQuestStore()
const taskStore = useTaskStore()

// Filter State
const currentFilter = ref<'all' | 'main' | 'side' | 'lifeAdmin'>('all')

const filterTabs: Array<{ value: 'all' | 'main' | 'side' | 'lifeAdmin'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'main', label: 'Main' },
  { value: 'side', label: 'Side' },
  { value: 'lifeAdmin', label: 'Life Admin' },
]

// Modal State
const isQuestModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isQuestDetailModalOpen = ref(false)
const editingQuest = ref<Quest | undefined>(undefined)
const deletingQuest = ref<Quest | null>(null)
const questToComplete = ref<Quest | null>(null)
const showCompleteModal = ref(false)
const selectedQuestForDetail = ref<Quest | null>(null)

// Computed
const filteredQuests = computed(() => {
  // Show only todo (backlog) quests
  let quests = questStore.quests.filter((q) => q.status === QuestStatus.Todo)

  // Filter by type
  if (currentFilter.value === 'main') {
    quests = quests.filter((q) => q.type === 'main')
  } else if (currentFilter.value === 'side') {
    quests = quests.filter((q) => q.type === 'side')
  } else if (currentFilter.value === 'lifeAdmin') {
    quests = quests.filter((q) => q.type === 'lifeAdmin')
  }

  // Sort by created date, newest first
  return [...quests].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})

// Methods
async function loadData() {
  await Promise.all([taskStore.loadTasks(), questStore.loadQuests()])
}

function openEditModal(quest: Quest) {
  editingQuest.value = quest
  isQuestModalOpen.value = true
}

function openDeleteModal(quest: Quest) {
  deletingQuest.value = quest
  isDeleteModalOpen.value = true
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

async function handleSaveQuest(data: {
  title: string
  description: string
  type: QuestType
  tagIds?: number[]
}) {
  if (editingQuest.value) {
    await questStore.updateQuest(editingQuest.value.id, data)
    if (data.tagIds !== undefined) {
      await questStore.setQuestTags(editingQuest.value.id, data.tagIds)
    }
  }
}

async function handleSaveQuestNotes(data: { questId: number; notes: string }) {
  await questStore.updateQuestNotes(data.questId, data.notes)
}

async function handleSaveQuestDescription(data: { questId: number; description: string }) {
  await questStore.updateQuest(data.questId, { description: data.description })
}

function handleOpenTaskFromQuest(task: TaskType) {
  if (!task.id) return

  // Backlog view does not render task modals; close the detail modal when a task is selected.
  isQuestDetailModalOpen.value = false
}

async function handleTaskDelete(taskId: number | string) {
  try {
    const questId = await taskStore.deleteTask(taskId)
    if (questId) {
      questStore.detachTaskFromQuest(taskId)
    }
  } catch (err) {
    console.error('Failed to delete task:', err)
  }
}

async function handleToggleStatus(quest: Quest) {
  const newStatus = quest.status === QuestStatus.Todo ? QuestStatus.Active : QuestStatus.Todo
  try {
    await questStore.updateQuest(quest.id, { status: newStatus })
  } catch (err) {
    console.error('Failed to toggle quest status:', err)
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.backlog-view {
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

.back-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  background: #fff;
  color: #666;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.8em;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.back-link:hover {
  border-color: #32a287;
  color: #32a287;
  transform: translateY(-1px);
}

.back-link:active {
  transform: translateY(0);
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

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .back-link {
    width: 100%;
    justify-content: center;
    order: 2;
  }

  .filter-tabs {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    padding-right: 0.5rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    order: 1;
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
}

@media (max-width: 480px) {
  .controls {
    padding: 0 0.5rem;
  }

  .tab-button {
    padding: 0.4rem 0.75rem;
    font-size: 0.75em;
  }

  .back-link {
    padding: 0.5rem 0.875rem;
    font-size: 0.8em;
  }
}
</style>
