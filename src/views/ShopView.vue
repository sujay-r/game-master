<template>
  <div class="shop-view">
    <!-- Header Section -->
    <div class="header-section">
      <HKTitle :img_path="shopTitleURL" :size="1" />

      <div class="controls">
        <button class="create-reward-button" @click="openCreateModal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="currentColor"
          >
            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
          </svg>
          Create Reward
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="rewardStore.loading" class="loading-state">
      <p>Loading rewards...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="rewardStore.error" class="error-state">
      <p>{{ rewardStore.error }}</p>
      <button @click="loadData">Retry</button>
    </div>

    <!-- Rewards List -->
    <div v-else class="content">
      <!-- Empty State for No Rewards -->
      <div v-if="rewardStore.rewards.length === 0" class="empty-state">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="64px"
          viewBox="0 0 24 24"
          width="64px"
          fill="none"
          stroke="#ccc"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
        <h3>No rewards yet</h3>
        <p>Create your first reward to start spending your tokens!</p>
      </div>

      <!-- Reward Cards -->
      <div v-else class="rewards-list">
        <RewardCard
          v-for="reward in rewardStore.rewards"
          :key="reward.id"
          :reward="reward"
          @claim="handleClaim"
          @error="handleError"
          @edit="handleEdit"
          @delete="handleDelete"
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

  <!-- Create Reward Modal -->
  <CreateRewardModal
    v-model="isCreateModalOpen"
    @save="handleCreateReward"
    @cancel="handleCancel"
  />

  <!-- Edit Reward Modal -->
  <EditRewardModal
    v-model="isEditModalOpen"
    :reward="selectedReward"
    @save="handleEditSave"
    @cancel="isEditModalOpen = false"
  />

  <!-- Delete Reward Modal -->
  <DeleteRewardModal
    v-model="isDeleteModalOpen"
    :reward-title="selectedReward?.title || ''"
    @confirm="handleDeleteConfirm"
  />

  <!-- Task Creation Modal -->
  <TaskCreationModal
    v-model="isTaskCreationModalOpen"
    :quests="questStore.activeQuests"
    :initial-quest-id="null"
    @created="handleTaskCreated"
    @cancelled="handleTaskCreationCancelled"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HKTitle from '@/components/common/HKTitle.vue'
import RewardCard from '@/components/shop/RewardCard.vue'
import CreateRewardModal from '@/components/shop/CreateRewardModal.vue'
import EditRewardModal from '@/components/shop/EditRewardModal.vue'
import DeleteRewardModal from '@/components/shop/DeleteRewardModal.vue'
import TokenCountDisplay from '@/components/common/TokenCountDisplay.vue'
import QuickAddButton from '@/components/common/QuickAddButton.vue'
import TaskCreationModal from '@/components/tasks/TaskCreationModal.vue'
import { useRewardStore } from '@/stores/rewards'
import { useQuestStore } from '@/stores/quests'
import { useTokenStore } from '@/stores/resources'
import type { Reward, RewardCost } from '@/types/common'
import type { TaskStatus, TaskOutcomeType } from '@/types/common'
import { fetchTasksWithOutcomes } from '@/lib/supabase'

const shopTitleURL = new URL('@/assets/imgs/TheShop.png', import.meta.url).href

const rewardStore = useRewardStore()
const questStore = useQuestStore()
const tokenStore = useTokenStore()

// Modal State
const isCreateModalOpen = ref(false)
const isTaskCreationModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const selectedReward = ref<Reward | null>(null)

// Methods
async function loadData() {
  await rewardStore.fetchActiveRewards()
  // Load quests for task creation modal
  const tasks = await fetchTasksWithOutcomes()
  await questStore.loadQuests(tasks)
}

function openCreateModal() {
  isCreateModalOpen.value = true
}

async function handleCreateReward(data: {
  title: string
  description: string
  costs: RewardCost[]
}) {
  try {
    await rewardStore.createReward(data)
    rewardStore.clearError()
  } catch (err) {
    console.error('Failed to create reward:', err)
  }
}

function handleCancel() {
  // Modal handles its own cleanup
}

async function handleClaim(rewardId: number) {
  try {
    await rewardStore.claimReward(rewardId)
    rewardStore.clearError()
  } catch (err) {
    console.error('Failed to claim reward:', err)
  }
}

function handleError(message: string) {
  console.error('Reward error:', message)
}

function handleEdit(reward: Reward) {
  selectedReward.value = reward
  isEditModalOpen.value = true
}

function handleDelete(reward: Reward) {
  selectedReward.value = reward
  isDeleteModalOpen.value = true
}

async function handleEditSave(data: {
  rewardId: number
  title: string
  description: string
  costs: RewardCost[]
}) {
  try {
    await rewardStore.updateReward(
      data.rewardId,
      {
        title: data.title,
        description: data.description,
      },
      data.costs,
    )
    rewardStore.clearError()
    isEditModalOpen.value = false
    selectedReward.value = null
  } catch (err) {
    console.error('Failed to update reward:', err)
  }
}

async function handleDeleteConfirm() {
  if (!selectedReward.value) return

  try {
    await rewardStore.deleteReward(selectedReward.value.id)
    rewardStore.clearError()
    isDeleteModalOpen.value = false
    selectedReward.value = null
  } catch (err) {
    console.error('Failed to delete reward:', err)
  }
}

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
}) {
  try {
    await questStore.createTask(taskData)
  } catch (err) {
    console.error('Failed to create task:', err)
  }
}

function handleTaskCreationCancelled() {
  // Modal handles its own cleanup
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
.shop-view {
  padding-bottom: 100px;
  background-color: #f2f2ee;
  min-height: 100vh;
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
  justify-content: flex-end;
}

.create-reward-button {
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
}

.create-reward-button:hover {
  background: #2d826d;
  transform: translateY(-1px);
}

.create-reward-button:active {
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

.rewards-list {
  margin-bottom: 2rem;
}

.token-count-wrapper {
  position: fixed;
  bottom: calc(20px + var(--nav-bottom-offset, 0px));
  right: 76px;
  z-index: 100;
  transition: bottom 0.3s ease;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .create-reward-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .controls {
    padding: 0 0.5rem;
  }

  .create-reward-button {
    padding: 0.5rem 0.875rem;
    font-size: 0.8em;
  }
}
</style>
