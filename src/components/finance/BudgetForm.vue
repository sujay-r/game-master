<template>
  <form class="budget-form" data-testid="budget-form" @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="budget-type" class="form-label">Transaction Type</label>
      <select
        id="budget-type"
        v-model.number="transactionTypeId"
        class="form-select"
        :class="{ 'form-input--error': showTypeError }"
        data-testid="budget-form-type"
      >
        <option value="" disabled>Select an expense type</option>
        <option
          v-for="type in financeStore.expenseTypes"
          :key="type.id"
          :value="type.id"
          data-testid="budget-form-type-option"
        >
          {{ type.name }}
        </option>
      </select>
      <span v-if="showTypeError" class="form-error" data-testid="budget-form-type-error">
        Please select an expense transaction type.
      </span>
    </div>

    <div class="form-group">
      <label for="budget-period" class="form-label">Period</label>
      <select
        id="budget-period"
        v-model="period"
        class="form-select"
        :class="{ 'form-input--error': showPeriodError }"
        data-testid="budget-form-period"
      >
        <option :value="BudgetPeriod.Monthly">Monthly</option>
        <option :value="BudgetPeriod.Weekly">Weekly</option>
      </select>
      <span v-if="showPeriodError" class="form-error" data-testid="budget-form-period-error">
        Please select a valid period.
      </span>
    </div>

    <div class="form-group">
      <label for="budget-start-date" class="form-label">Start Date</label>
      <input
        id="budget-start-date"
        v-model="startDate"
        type="date"
        class="form-input"
        :class="{ 'form-input--error': showStartDateError }"
        data-testid="budget-form-start-date"
      />
      <span v-if="showStartDateError" class="form-error" data-testid="budget-form-start-date-error">
        Start date is required.
      </span>
    </div>

    <div class="form-group">
      <label class="form-label">Income Baseline</label>
      <p class="baseline-text" data-testid="budget-form-income-baseline">
        <template v-if="latestIncomeAmount > 0">
          Latest income: {{ formatCurrency(latestIncomeAmount) }}
        </template>
        <template v-else>No income transactions found.</template>
      </p>
    </div>

    <div class="form-group">
      <label for="budget-percentage" class="form-label">Percentage of Income</label>
      <div class="percentage-row">
        <input
          id="budget-percentage"
          v-model.number="percentage"
          type="range"
          min="0"
          max="100"
          class="form-range"
          :disabled="latestIncomeAmount <= 0"
          data-testid="budget-form-percentage-slider"
        />
        <input
          v-model.number="percentage"
          type="number"
          min="0"
          max="100"
          class="form-input percentage-input"
          :disabled="latestIncomeAmount <= 0"
          data-testid="budget-form-percentage-number"
        />
        <span class="percentage-suffix">%</span>
      </div>
    </div>

    <div class="form-group">
      <label for="budget-amount" class="form-label">Budget Amount</label>
      <input
        id="budget-amount"
        v-model.number="amount"
        type="number"
        min="1"
        step="1"
        class="form-input"
        :class="{ 'form-input--error': showAmountError }"
        placeholder="Enter budget amount"
        data-testid="budget-form-amount"
      />
      <span v-if="showAmountError" class="form-error" data-testid="budget-form-amount-error">
        {{ amountError }}
      </span>
    </div>

    <div
      v-if="submitError"
      class="form-error form-error--submit"
      data-testid="budget-form-submit-error"
    >
      {{ submitError }}
    </div>

    <div class="form-actions">
      <button
        type="submit"
        class="action-button primary"
        :disabled="isSubmitting"
        data-testid="budget-form-submit"
      >
        {{ isSubmitting ? 'Saving...' : submitLabel }}
      </button>
      <button
        type="button"
        class="action-button secondary"
        data-testid="budget-form-cancel"
        @click="handleCancel"
      >
        Cancel
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { BudgetPeriod, type Budget } from '@/types/common'
import type { CreateBudgetInput } from '@/types/finance'

const props = withDefaults(
  defineProps<{
    budget?: Budget
    latestIncomeAmount?: number
  }>(),
  {
    latestIncomeAmount: 0,
  },
)

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'cancel'): void
}>()

const financeStore = useFinanceStore()

const transactionTypeId = ref<number | ''>('')
const period = ref<BudgetPeriod>(BudgetPeriod.Monthly)
const startDate = ref(todayDate())
const amount = ref<number | null>(null)
const attemptedSubmit = ref(false)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const isEdit = computed(() => props.budget !== undefined)
const submitLabel = computed(() => (isEdit.value ? 'Update Budget' : 'Create Budget'))

const percentage = computed({
  get: () => {
    if (props.latestIncomeAmount <= 0 || amount.value === null || amount.value <= 0) {
      return 0
    }
    return Math.round((amount.value / props.latestIncomeAmount) * 100)
  },
  set: (value: number) => {
    if (props.latestIncomeAmount > 0) {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        const clamped = Math.max(0, Math.min(100, numeric))
        amount.value = Math.round((props.latestIncomeAmount * clamped) / 100)
      }
    }
  },
})

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

const showTypeError = computed(() => attemptedSubmit.value && transactionTypeId.value === '')
const showPeriodError = computed(
  () => attemptedSubmit.value && !Object.values(BudgetPeriod).includes(period.value),
)
const showStartDateError = computed(() => attemptedSubmit.value && startDate.value === '')
const showAmountError = computed(() => attemptedSubmit.value && amountError.value !== null)

function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

function handleCancel() {
  emit('cancel')
}

async function handleSubmit() {
  attemptedSubmit.value = true
  submitError.value = null

  if (
    showTypeError.value ||
    showPeriodError.value ||
    showStartDateError.value ||
    showAmountError.value
  ) {
    return
  }

  const input: CreateBudgetInput = {
    transactionTypeId: transactionTypeId.value as number,
    amount: Number(amount.value),
    period: period.value,
    startDate: parseLocalDate(startDate.value),
    endDate: null,
  }

  isSubmitting.value = true
  try {
    if (isEdit.value && props.budget) {
      await financeStore.updateBudget(props.budget.id, input)
    } else {
      await financeStore.addBudget(input)
    }
    emit('saved')
  } catch (err) {
    console.error('Error saving budget: ', err)
    submitError.value = err instanceof Error ? err.message : 'Failed to save budget.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (props.budget) {
    transactionTypeId.value = props.budget.transactionTypeId
    period.value = props.budget.period
    startDate.value = props.budget.startDate.toISOString().split('T')[0]
    amount.value = props.budget.amount
  }
})
</script>

<style scoped>
.budget-form {
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

.baseline-text {
  margin: 0;
  color: #666;
  font-size: 0.95em;
}

.percentage-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-range {
  flex: 1;
  accent-color: #32a287;
}

.percentage-input {
  width: 5rem;
  text-align: right;
}

.percentage-suffix {
  color: #666;
  font-size: 0.95em;
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

@media (max-width: 480px) {
  .form-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }

  .percentage-row {
    flex-wrap: wrap;
  }
}
</style>
