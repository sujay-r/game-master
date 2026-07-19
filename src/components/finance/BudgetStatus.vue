<template>
  <div class="budget-status" data-testid="budget-status">
    <h3 class="budget-status__title">Budget Status</h3>

    <div v-if="financeStore.filters.kind === 'income'" class="budget-status__empty">
      <p>Budgets apply to expenses only</p>
    </div>

    <div v-else-if="financeStore.budgets.length === 0" class="budget-status__empty">
      <p>No budgets set</p>
    </div>

    <div v-else-if="visibleBudgets.length === 0" class="budget-status__empty">
      <p>No budgets match the current filters</p>
    </div>

    <ul v-else class="budget-status__list">
      <li
        v-for="item in visibleBudgets"
        :key="item.budget.id"
        class="budget-status__row"
        data-testid="budget-row"
      >
        <div class="budget-status__header">
          <span class="budget-status__name">{{ item.typeName }}</span>
          <span class="budget-status__amount">{{ formattedSpend(item) }}</span>
        </div>

        <div class="budget-status__progress-wrapper">
          <div class="budget-status__progress-track">
            <div
              class="budget-status__progress-fill"
              :class="item.statusClass"
              :style="{ width: `${item.progressPercent}%` }"
            />
          </div>
          <span
            v-if="item.isBreached"
            class="budget-status__warning"
            title="Budget breached"
          >
            ⚠️
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { TransactionKind } from '@/types/common'
import type { Budget, Transaction, TransactionType } from '@/types/common'

type BudgetStatus = 'safe' | 'warning' | 'breached'

interface BudgetRow {
  budget: Budget
  type: TransactionType
  typeName: string
  spend: number
  progressPercent: number
  statusClass: string
  isBreached: boolean
}

const financeStore = useFinanceStore()

function isWithinDateRange(transaction: Transaction): boolean {
  const start = new Date(financeStore.filters.dateRange.start).getTime()
  const end = new Date(financeStore.filters.dateRange.end).getTime()
  const date = transaction.date.getTime()
  return date >= start && date <= end
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formattedSpend(item: BudgetRow): string {
  return `${formatCurrency(item.spend)} of ${formatCurrency(item.budget.amount)}`
}

function computeStatus(spend: number, budgetAmount: number): BudgetStatus {
  if (budgetAmount <= 0) {
    return 'breached'
  }

  const percent = (spend / budgetAmount) * 100
  if (percent > 100) {
    return 'breached'
  }
  if (percent >= 80) {
    return 'warning'
  }
  return 'safe'
}

const visibleBudgets = computed<BudgetRow[]>(() => {
  if (financeStore.filters.kind === 'income') {
    return []
  }

  const selectedTypeIds = financeStore.filters.transactionTypeIds

  return financeStore.budgets
    .map((budget) => {
      const type =
        budget.transactionType ??
        financeStore.transactionTypes.find((t) => t.id === budget.transactionTypeId)

      if (!type) {
        return null
      }

      return { budget, type }
    })
    .filter((item): item is { budget: Budget; type: TransactionType } => {
      if (!item) {
        return false
      }

      if (item.type.kind !== TransactionKind.Expense) {
        return false
      }

      if (selectedTypeIds.length > 0 && !selectedTypeIds.includes(item.type.id)) {
        return false
      }

      return true
    })
    .map((item) => {
      const spend = financeStore.transactions
        .filter(
          (transaction) =>
            transaction.transactionTypeId === item.type.id &&
            isWithinDateRange(transaction),
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0)

      const status = computeStatus(spend, item.budget.amount)
      const rawPercent = item.budget.amount > 0 ? (spend / item.budget.amount) * 100 : 100
      const progressPercent = Math.min(rawPercent, 100)

      return {
        budget: item.budget,
        type: item.type,
        typeName: item.type.name,
        spend,
        progressPercent,
        statusClass: `budget-status__progress-fill--${status}`,
        isBreached: status === 'breached',
      }
    })
})
</script>

<style scoped>
.budget-status {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.budget-status__title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 1.1em;
  color: #424242;
  margin: 0;
}

.budget-status__empty {
  color: #666;
  font-size: 0.95em;
}

.budget-status__empty p {
  margin: 0;
}

.budget-status__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.budget-status__row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.budget-status__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.budget-status__name {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.95em;
  color: #424242;
}

.budget-status__amount {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  color: #666;
  white-space: nowrap;
}

.budget-status__progress-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.budget-status__progress-track {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.budget-status__progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.budget-status__progress-fill--safe {
  background: #32a287;
}

.budget-status__progress-fill--warning {
  background: #e6a817;
}

.budget-status__progress-fill--breached {
  background: #c62828;
}

.budget-status__warning {
  font-size: 0.9em;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .budget-status__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
