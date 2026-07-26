<template>
  <div class="transaction-entry">
    <div class="entry-header">
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

    <h1 class="entry-title">Transaction Entry</h1>
    <p class="entry-description">Add a new income or expense transaction.</p>

    <form class="entry-form" data-testid="transaction-entry-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="amount" class="form-label">Amount</label>
        <input
          id="amount"
          v-model.number="amount"
          type="number"
          step="0.01"
          min="0.01"
          class="form-input"
          :class="{ 'form-input--error': showAmountError }"
          placeholder="Enter amount"
          data-testid="transaction-entry-amount"
        />
        <span
          v-if="showAmountError"
          class="form-error"
          data-testid="transaction-entry-amount-error"
        >
          {{ amountError }}
        </span>
      </div>

      <div class="form-group">
        <label for="transaction-type" class="form-label">Transaction Type</label>
        <select
          id="transaction-type"
          v-model.number="transactionTypeId"
          class="form-select"
          :class="{ 'form-input--error': showTypeError }"
          data-testid="transaction-entry-type"
        >
          <option value="" disabled>Select a type</option>
          <optgroup label="Income">
            <option
              v-for="type in incomeTypes"
              :key="type.id"
              :value="type.id"
              data-testid="transaction-entry-type-option"
            >
              {{ type.name }}
            </option>
          </optgroup>
          <optgroup label="Expense">
            <option
              v-for="type in expenseTypes"
              :key="type.id"
              :value="type.id"
              data-testid="transaction-entry-type-option"
            >
              {{ type.name }}
            </option>
          </optgroup>
        </select>
        <span v-if="showTypeError" class="form-error" data-testid="transaction-entry-type-error">
          Please select a transaction type.
        </span>
      </div>

      <div class="form-group">
        <label for="description" class="form-label">Description</label>
        <input
          id="description"
          v-model="description"
          type="text"
          class="form-input"
          :class="{ 'form-input--error': showDescriptionError }"
          placeholder="Enter description"
          data-testid="transaction-entry-description"
        />
        <span
          v-if="showDescriptionError"
          class="form-error"
          data-testid="transaction-entry-description-error"
        >
          Description is required.
        </span>
      </div>

      <div class="form-group">
        <label for="date" class="form-label">Date</label>
        <input
          id="date"
          v-model="date"
          type="date"
          class="form-input form-input--date"
          data-testid="transaction-entry-date"
        />
        <input
          id="time"
          v-model="time"
          type="time"
          class="form-input form-input--time"
          data-testid="transaction-entry-time"
        />
      </div>

      <div
        v-if="submitError"
        class="form-error form-error--submit"
        data-testid="transaction-entry-submit-error"
      >
        {{ submitError }}
      </div>

      <div class="form-actions">
        <button
          type="submit"
          class="action-button primary"
          :disabled="isSubmitting"
          data-testid="transaction-entry-submit"
        >
          {{ isSubmitting ? 'Saving...' : 'Save Transaction' }}
        </button>
        <button
          type="button"
          class="action-button secondary"
          data-testid="transaction-entry-cancel"
          @click="handleCancel"
        >
          Cancel
        </button>
      </div>
    </form>

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
import { useRouter, RouterLink } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'
import { useQuestStore } from '@/stores/quests'
import { useTaskSync } from '@/composables/useTaskSync'
import { useTokenStore } from '@/stores/resources'
import TokenCountDisplay from '@/components/common/TokenCountDisplay.vue'
import QuickAddButton from '@/components/common/QuickAddButton.vue'
import TaskCreationModal from '@/components/tasks/TaskCreationModal.vue'
import { TransactionKind, TransactionSource } from '@/types/common'
import type { CreateTransactionInput } from '@/types/finance'
import type { TaskStatus, TaskOutcomeType } from '@/types/common'

const financeStore = useFinanceStore()
const questStore = useQuestStore()
const taskSync = useTaskSync()
const tokenStore = useTokenStore()
const router = useRouter()

const amount = ref<number | null>(null)
const transactionTypeId = ref<number | ''>('')
const description = ref('')
const date = ref(todayDate())
const time = ref(todayTime())
const attemptedSubmit = ref(false)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const isTaskCreationModalOpen = ref(false)

const incomeTypes = computed(() =>
  financeStore.transactionTypes.filter((type) => type.kind === TransactionKind.Income),
)
const expenseTypes = computed(() =>
  financeStore.transactionTypes.filter((type) => type.kind === TransactionKind.Expense),
)

const amountError = computed(() => {
  if (amount.value === null) {
    return 'Amount is required.'
  }
  const numeric = Number(amount.value)
  if (Number.isNaN(numeric) || numeric <= 0) {
    return 'Amount must be a positive number.'
  }
  return null
})

const showAmountError = computed(() => attemptedSubmit.value && amountError.value !== null)
const showTypeError = computed(() => attemptedSubmit.value && transactionTypeId.value === '')
const showDescriptionError = computed(
  () => attemptedSubmit.value && description.value.trim() === '',
)

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function todayTime(): string {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function parseDateTime(dateString: string, timeString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  const [hour, minute] = timeString ? timeString.split(':').map(Number) : [0, 0]
  return new Date(year, month - 1, day, hour, minute)
}

async function handleSubmit() {
  attemptedSubmit.value = true
  submitError.value = null

  if (amountError.value || transactionTypeId.value === '' || description.value.trim() === '') {
    return
  }

  const dateValue = date.value ? parseDateTime(date.value, time.value) : new Date()

  const input: CreateTransactionInput = {
    amount: Number(amount.value),
    transactionTypeId: transactionTypeId.value,
    description: description.value.trim(),
    date: dateValue,
    source: TransactionSource.Manual,
  }

  isSubmitting.value = true
  try {
    await financeStore.addTransaction(input)
    await router.push('/finance')
  } catch (err) {
    console.error('Error saving transaction: ', err)
    submitError.value = err instanceof Error ? err.message : 'Failed to save transaction.'
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  router.push('/finance')
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
  if (import.meta.env.DEV && financeStore.transactions.length === 0) {
    await financeStore.seedFinanceData()
  } else if (financeStore.transactionTypes.length === 0) {
    await financeStore.loadTransactionTypes()
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
.transaction-entry {
  padding: 2rem 1rem 100px;
  max-width: 800px;
  margin: 0 auto;
}

.entry-header {
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

.entry-title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 2em;
  color: #424242;
  margin: 0 0 0.5rem;
}

.entry-description {
  color: #666;
  font-size: 1em;
  margin: 0 0 1.5rem;
}

.entry-form {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-weight: 600;
  color: #424242;
  font-size: 0.95em;
}

.form-input,
.form-select {
  padding: 0.625rem 0.875rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  color: #424242;
  background: #fff;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #32a287;
}

.form-input--error {
  border-color: #c62828;
}

.form-error {
  color: #c62828;
  font-size: 0.85em;
}

.form-error--submit {
  padding: 0.75rem;
  background: #ffebee;
  border-radius: 8px;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
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

.action-button.primary:hover:not(:disabled) {
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

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.token-count-wrapper {
  position: fixed;
  bottom: calc(20px + var(--nav-bottom-offset, 0px));
  right: 76px;
  z-index: 100;
  transition: bottom 0.3s ease;
}

/* Quick add button bottom offset is overridden via inline style using --nav-bottom-offset */

@media (max-width: 480px) {
  .form-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}
</style>
