<template>
  <div class="budget-management">
    <div class="management-header">
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

    <template v-if="mode === 'list'">
      <div class="management-title-section">
        <h1 class="management-title">Budgets</h1>
        <p class="management-description">
          Set spending limits for each expense category. Amounts can be a percentage of your latest
          income.
        </p>
      </div>

      <div class="management-actions">
        <button
          type="button"
          class="action-button primary"
          data-testid="budget-new-button"
          @click="mode = 'create'"
        >
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
          New Budget
        </button>
      </div>

      <div
        v-if="financeStore.budgets.length === 0"
        class="empty-state"
        data-testid="budget-empty-state"
      >
        <p>No budgets yet.</p>
        <p class="empty-state-hint">Create a budget to start tracking spending limits.</p>
      </div>

      <div v-else class="budget-list">
        <div class="budget-list__header">
          <span class="budget-list__col budget-list__col--type">Type</span>
          <span class="budget-list__col budget-list__col--amount">Amount</span>
          <span class="budget-list__col budget-list__col--period">Period</span>
          <span class="budget-list__col budget-list__col--percentage">% of Income</span>
          <span class="budget-list__col budget-list__col--actions">Actions</span>
        </div>

        <ul class="budget-list__body">
          <li
            v-for="budget in financeStore.budgets"
            :key="budget.id"
            class="budget-list__row"
            data-testid="budget-list-row"
            @click="openEdit(budget.id)"
          >
            <span class="budget-list__col budget-list__col--type" data-testid="budget-list-type">
              {{ budget.transactionType?.name ?? 'Unknown' }}
            </span>
            <span
              class="budget-list__col budget-list__col--amount"
              data-testid="budget-list-amount"
            >
              {{ formatCurrency(budget.amount) }}
            </span>
            <span
              class="budget-list__col budget-list__col--period"
              data-testid="budget-list-period"
            >
              {{ formatPeriod(budget.period) }}
            </span>
            <span
              class="budget-list__col budget-list__col--percentage"
              data-testid="budget-list-percentage"
            >
              {{ percentageLabel(budget.amount) }}
            </span>
            <span
              class="budget-list__col budget-list__col--actions"
              data-testid="budget-list-actions"
              @click.stop
            >
              <button
                type="button"
                class="icon-button delete-button"
                title="Delete budget"
                data-testid="budget-list-delete"
                @click="handleDelete(budget.id)"
              >
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
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                </svg>
              </button>
            </span>
          </li>
        </ul>
      </div>
    </template>

    <template v-else>
      <h1 class="management-title">{{ mode === 'create' ? 'New Budget' : 'Edit Budget' }}</h1>
      <p class="management-description">
        {{ mode === 'create' ? 'Create a new spending limit.' : 'Update this budget.' }}
      </p>

      <BudgetForm
        :budget="selectedBudget"
        :latest-income-amount="latestIncomeAmount"
        data-testid="budget-form-wrapper"
        @saved="onSaved"
        @cancel="mode = 'list'"
      />
    </template>

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
import { useFinanceStore } from '@/stores/finance'
import { useQuestStore } from '@/stores/quests'
import { useTaskSync } from '@/composables/useTaskSync'
import { useTokenStore } from '@/stores/resources'
import BudgetForm from '@/components/finance/BudgetForm.vue'
import TokenCountDisplay from '@/components/common/TokenCountDisplay.vue'
import QuickAddButton from '@/components/common/QuickAddButton.vue'
import TaskCreationModal from '@/components/tasks/TaskCreationModal.vue'
import { getLatestIncome } from '@/utils/finance'
import { BudgetPeriod, type Budget } from '@/types/common'
import type { TaskStatus, TaskOutcomeType } from '@/types/common'

type BudgetMode = 'list' | 'create' | 'edit'

const financeStore = useFinanceStore()
const questStore = useQuestStore()
const taskSync = useTaskSync()
const tokenStore = useTokenStore()

const mode = ref<BudgetMode>('list')
const selectedBudgetId = ref<number | null>(null)
const isTaskCreationModalOpen = ref(false)

const selectedBudget = computed<Budget | undefined>(() =>
  financeStore.budgets.find((budget) => budget.id === selectedBudgetId.value),
)

const latestIncomeAmount = computed(() => {
  const latestIncome = getLatestIncome(financeStore.transactions)
  return latestIncome?.amount ?? 0
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPeriod(period: BudgetPeriod): string {
  return period === BudgetPeriod.Weekly ? 'Weekly' : 'Monthly'
}

function percentageLabel(amount: number): string {
  if (latestIncomeAmount.value <= 0) {
    return '—'
  }
  const percentage = Math.round((amount / latestIncomeAmount.value) * 100)
  return `${percentage}%`
}

function openEdit(id: number) {
  selectedBudgetId.value = id
  mode.value = 'edit'
}

async function handleDelete(id: number) {
  if (!window.confirm('Are you sure you want to delete this budget?')) {
    return
  }

  try {
    await financeStore.deleteBudget(id)
  } catch (err) {
    console.error('Error deleting budget: ', err)
  }
}

async function onSaved() {
  mode.value = 'list'
  selectedBudgetId.value = null
  await financeStore.loadBudgets()
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
.budget-management {
  padding: 2rem 1rem 100px;
  max-width: 900px;
  margin: 0 auto;
}

.management-header {
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

.management-title-section {
  margin-bottom: 1.5rem;
}

.management-title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 2em;
  color: #424242;
  margin: 0 0 0.5rem;
}

.management-description {
  color: #666;
  font-size: 1em;
  margin: 0 0 1.5rem;
}

.management-actions {
  margin-bottom: 1.5rem;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.9em;
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

.empty-state {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  color: #666;
}

.empty-state p {
  margin: 0;
}

.empty-state-hint {
  font-size: 0.9em;
  margin-top: 0.25rem;
}

.budget-list {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

.budget-list__header,
.budget-list__row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 3rem;
  align-items: center;
  padding: 0.875rem 1rem;
  gap: 0.75rem;
}

.budget-list__header {
  background: #f8f8f8;
  font-weight: 600;
  color: #424242;
  font-size: 0.9em;
}

.budget-list__row {
  border-top: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.budget-list__row:hover {
  background: #fafafa;
}

.budget-list__col {
  color: #424242;
  font-size: 0.95em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.budget-list__col--type {
  font-weight: 600;
}

.budget-list__col--actions {
  display: flex;
  justify-content: flex-end;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.icon-button:hover {
  background: #ffebee;
  color: #c62828;
}

.token-count-wrapper {
  position: fixed;
  bottom: calc(20px + var(--nav-bottom-offset, 0px));
  right: 76px;
  z-index: 100;
  transition: bottom 0.3s ease;
}

/* Quick add button bottom offset is overridden via inline style using --nav-bottom-offset */

@media (max-width: 768px) {
  .budget-list__header,
  .budget-list__row {
    grid-template-columns: 1.5fr 1fr 1fr;
    row-gap: 0.25rem;
  }

  .budget-list__col--percentage,
  .budget-list__col--actions {
    display: none;
  }
}
</style>
