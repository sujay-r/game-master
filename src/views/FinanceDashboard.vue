<template>
  <div class="finance-dashboard">
    <HKTitle :img_path="financeTitleURL" :size="1" />

    <div class="dashboard-header">
      <div class="dashboard-actions">
        <RouterLink to="/finance/entry" class="action-button primary">
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Transaction
        </RouterLink>
        <RouterLink to="/finance/history" class="action-button secondary">
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
            <path d="M3 3v5h5" />
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
            <path d="M12 7v5l4 2" />
          </svg>
          Query History
        </RouterLink>
        <button
          type="button"
          class="action-button secondary refresh-button"
          :disabled="isRefreshing"
          data-testid="finance-dashboard-refresh"
          @click="handleRefresh"
        >
          <svg
            v-if="!isRefreshing"
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
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          <svg
            v-else
            class="refresh-spinner"
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
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <FinanceFilterBar />

    <div class="dashboard-grid">
      <DashboardSlot test-id="summary-bar-slot" class="slot-summary">
        <SummaryBar />
      </DashboardSlot>

      <DashboardSlot test-id="budget-status-slot" class="slot-budget">
        <BudgetStatus />
      </DashboardSlot>

      <DashboardSlot test-id="spend-breakdown-slot" class="slot-breakdown">
        <SpendBreakdown />
      </DashboardSlot>

      <DashboardSlot test-id="transaction-list-slot" class="slot-transactions">
        <TransactionList />
      </DashboardSlot>

      <DashboardSlot test-id="income-expense-chart-slot" class="slot-chart">
        <IncomeExpenseChart />
      </DashboardSlot>

      <DashboardSlot test-id="nlq-panel-slot" class="slot-nlq">
        <div class="placeholder" data-testid="nlq-panel-placeholder">
          <h3>NLQ Panel</h3>
          <p>Selected types: {{ selectedTypeNames }}</p>
        </div>
      </DashboardSlot>
    </div>

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
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import HKTitle from '@/components/common/HKTitle.vue'
import FinanceFilterBar from '@/components/finance/FinanceFilterBar.vue'
import DashboardSlot from '@/components/finance/DashboardSlot.vue'
import SummaryBar from '@/components/finance/SummaryBar.vue'
import BudgetStatus from '@/components/finance/BudgetStatus.vue'
import SpendBreakdown from '@/components/finance/SpendBreakdown.vue'
import TransactionList from '@/components/finance/TransactionList.vue'
import IncomeExpenseChart from '@/components/finance/IncomeExpenseChart.vue'
import TokenCountDisplay from '@/components/common/TokenCountDisplay.vue'
import QuickAddButton from '@/components/common/QuickAddButton.vue'
import TaskCreationModal from '@/components/tasks/TaskCreationModal.vue'
import { useFinanceStore } from '@/stores/finance'
import { useQuestStore } from '@/stores/quests'
import { useTaskSync } from '@/composables/useTaskSync'
import { useTokenStore } from '@/stores/resources'
import { getLatestIncome } from '@/utils/finance'
import type { TaskStatus, TaskOutcomeType } from '@/types/common'

const financeStore = useFinanceStore()
const questStore = useQuestStore()
const taskSync = useTaskSync()
const tokenStore = useTokenStore()

const isRefreshing = ref(false)
const isTaskCreationModalOpen = ref(false)

const financeTitleURL = new URL('@/assets/imgs/Moneylog.png', import.meta.url).href

const selectedTypeNames = computed(() => {
  const names = financeStore.selectedTransactionTypes.map((type) => type.name)
  return names.length > 0 ? names.join(', ') : 'All types'
})

async function handleRefresh() {
  isRefreshing.value = true
  try {
    await Promise.all([financeStore.loadTransactions(), financeStore.loadBudgets()])
  } catch (err) {
    console.error('Error refreshing finance data:', err)
  } finally {
    isRefreshing.value = false
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
  await financeStore.loadTransactionTypes()
  await financeStore.loadTransactions()
  await financeStore.loadBudgets()

  if (import.meta.env.DEV && financeStore.transactions.length === 0) {
    await financeStore.seedFinanceData()
  }

  const latestIncome = getLatestIncome(financeStore.transactions)
  if (latestIncome) {
    const start = new Date(latestIncome.date)
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    financeStore.setDateRange({ start: start.toISOString(), end: end.toISOString() })
  }

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
.finance-dashboard {
  padding: 0 1rem 100px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.dashboard-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.action-button.primary {
  background: #32a287;
  color: #fff;
}

.action-button.primary:hover {
  background: #2d826d;
}

.action-button.secondary {
  background: #fff;
  color: #424242;
  border-color: #e0e0e0;
}

.action-button.secondary:hover {
  border-color: #32a287;
  color: #32a287;
}

.refresh-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.refresh-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.token-count-wrapper {
  position: fixed;
  bottom: calc(20px + var(--nav-bottom-offset, 0px));
  right: 76px;
  z-index: 100;
  transition: bottom 0.3s ease;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.slot-summary,
.slot-budget,
.slot-breakdown,
.slot-transactions,
.slot-chart,
.slot-nlq {
  grid-column: span 12;
}

@media (min-width: 769px) {
  .slot-summary {
    grid-column: span 12;
  }

  .slot-budget,
  .slot-breakdown {
    grid-column: span 6;
  }

  .slot-chart {
    grid-column: span 6;
  }

  .slot-transactions {
    grid-column: span 12;
  }

  .slot-nlq {
    grid-column: span 12;
  }
}

@media (min-width: 1024px) {
  .slot-summary {
    grid-column: span 12;
  }

  .slot-budget,
  .slot-breakdown {
    grid-column: span 6;
  }

  .slot-transactions {
    grid-column: span 12;
  }

  .slot-chart,
  .slot-nlq {
    grid-column: span 6;
  }
}

.placeholder {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.placeholder h3 {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 1.1em;
  color: #424242;
  margin: 0;
}

.placeholder p {
  color: #666;
  margin: 0;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-actions {
    width: 100%;
  }

  .action-button {
    flex: 1;
    justify-content: center;
  }
}
</style>
