<template>
  <div class="summary-bar" data-testid="summary-bar">
    <div class="metric-card" data-testid="total-income">
      <h3 class="metric-label">Total Income</h3>
      <p class="metric-value metric-value--income">{{ formattedIncome }}</p>
    </div>

    <div class="metric-card" data-testid="total-expense">
      <h3 class="metric-label">Total Expense</h3>
      <p class="metric-value metric-value--expense">{{ formattedExpense }}</p>
    </div>

    <div class="metric-card" data-testid="net-total">
      <h3 class="metric-label">Net</h3>
      <p class="metric-value" :class="netClass">{{ formattedNet }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { TransactionKind } from '@/types/common'
import type { Transaction } from '@/types/common'

const financeStore = useFinanceStore()

function isWithinDateRange(transaction: Transaction): boolean {
  const start = new Date(financeStore.filters.dateRange.start).getTime()
  const end = new Date(financeStore.filters.dateRange.end).getTime()
  const date = transaction.date.getTime()
  return date >= start && date <= end
}

function kindMatches(transaction: Transaction): boolean {
  if (financeStore.filters.kind === 'all') {
    return true
  }
  const type = financeStore.transactionTypes.find((t) => t.id === transaction.transactionTypeId)
  return type?.kind === financeStore.filters.kind
}

function typeFilterMatches(transaction: Transaction): boolean {
  const selectedIds = financeStore.filters.transactionTypeIds
  if (selectedIds.length === 0) {
    return true
  }
  return selectedIds.includes(transaction.transactionTypeId)
}

const filteredTransactions = computed(() =>
  financeStore.transactions.filter(
    (transaction) =>
      isWithinDateRange(transaction) && kindMatches(transaction) && typeFilterMatches(transaction),
  ),
)

const incomeTotal = computed(() =>
  filteredTransactions.value
    .filter((transaction) => {
      const type = financeStore.transactionTypes.find((t) => t.id === transaction.transactionTypeId)
      return type?.kind === TransactionKind.Income
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0),
)

const expenseTotal = computed(() =>
  filteredTransactions.value
    .filter((transaction) => {
      const type = financeStore.transactionTypes.find((t) => t.id === transaction.transactionTypeId)
      return type?.kind === TransactionKind.Expense
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0),
)

const netTotal = computed(() => incomeTotal.value - expenseTotal.value)

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

const formattedIncome = computed(() => formatCurrency(incomeTotal.value))
const formattedExpense = computed(() => formatCurrency(expenseTotal.value))
const formattedNet = computed(() => formatCurrency(netTotal.value))

const netClass = computed(() =>
  netTotal.value >= 0 ? 'metric-value--positive' : 'metric-value--negative',
)
</script>

<style scoped>
.summary-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.metric-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-label {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.95em;
  color: #424242;
  margin: 0;
}

.metric-value {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 1.5em;
  font-weight: 600;
  color: #666;
  margin: 0;
}

.metric-value--income {
  color: #32a287;
}

.metric-value--expense {
  color: #c62828;
}

.metric-value--positive {
  color: #32a287;
}

.metric-value--negative {
  color: #c62828;
}

@media (max-width: 768px) {
  .summary-bar {
    grid-template-columns: 1fr;
  }
}
</style>
