<template>
  <div class="transaction-list" data-testid="transaction-list">
    <h3 class="transaction-list__title">Transaction List</h3>

    <div
      v-if="sortedTransactions.length === 0"
      class="transaction-list__empty"
      data-testid="transaction-list-empty"
    >
      <p>No transactions match the current filters</p>
    </div>

    <template v-else>
      <div class="transaction-list__table-wrapper">
        <table class="transaction-list__table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Type</th>
              <th scope="col">Description</th>
              <th scope="col" class="transaction-list__amount-header">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="transaction in paginatedTransactions"
              :key="transaction.id"
              class="transaction-list__row"
              data-testid="transaction-list-row"
            >
              <td data-label="Date">{{ formatDate(transaction.date) }}</td>
              <td data-label="Type">{{ resolveTypeName(transaction) }}</td>
              <td data-label="Description">{{ transaction.description }}</td>
              <td
                data-label="Amount"
                class="transaction-list__amount"
                :class="amountClass(transaction)"
              >
                {{ formatCurrency(transaction.amount) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="transaction-list__pagination">
        <button
          type="button"
          class="transaction-list__page-button"
          :disabled="currentPage <= 1"
          data-testid="transaction-list-previous"
          @click="currentPage--"
        >
          Previous
        </button>

        <span class="transaction-list__page-info" data-testid="transaction-list-page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button
          type="button"
          class="transaction-list__page-button"
          :disabled="currentPage >= totalPages"
          data-testid="transaction-list-next"
          @click="currentPage++"
        >
          Next
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useFilteredTransactions } from '@/composables/useFilteredTransactions'
import { TransactionKind } from '@/types/common'
import type { Transaction, TransactionType } from '@/types/common'

const PAGE_SIZE = 10

const financeStore = useFinanceStore()
const { filteredTransactions } = useFilteredTransactions()

const currentPage = ref(1)

function resolveType(transaction: Transaction): TransactionType | undefined {
  return (
    transaction.transactionType ??
    financeStore.transactionTypes.find((t) => t.id === transaction.transactionTypeId)
  )
}

function resolveTypeName(transaction: Transaction): string {
  return resolveType(transaction)?.name ?? 'Unknown'
}

function formatDate(date: Date): string {
  const datePart = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${datePart} ${timePart}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function amountClass(transaction: Transaction): string {
  const kind = resolveType(transaction)?.kind
  return kind === TransactionKind.Income
    ? 'transaction-list__amount--income'
    : 'transaction-list__amount--expense'
}

const sortedTransactions = computed<Transaction[]>(() =>
  [...filteredTransactions.value].sort((a, b) => b.date.getTime() - a.date.getTime()),
)

const totalPages = computed(() => {
  const count = sortedTransactions.value.length
  if (count === 0) {
    return 0
  }
  return Math.ceil(count / PAGE_SIZE)
})

const paginatedTransactions = computed<Transaction[]>(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedTransactions.value.slice(start, start + PAGE_SIZE)
})

watch(
  sortedTransactions,
  () => {
    currentPage.value = 1
  },
  { flush: 'post' },
)
</script>

<style scoped>
.transaction-list {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transaction-list__title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 1.1em;
  color: #424242;
  margin: 0;
}

.transaction-list__empty {
  color: #666;
  font-size: 0.95em;
  text-align: center;
  padding: 1.5rem 0;
}

.transaction-list__empty p {
  margin: 0;
}

.transaction-list__table-wrapper {
  overflow-x: auto;
}

.transaction-list__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

.transaction-list__table thead {
  display: none;
}

.transaction-list__table th,
.transaction-list__table td {
  padding: 0.75rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-list__table th {
  color: #666;
  font-weight: 600;
  font-family: Trajan, 'Perpetua', serif;
  border-bottom: 1px solid #e0e0e0;
}

.transaction-list__amount-header {
  text-align: right;
}

.transaction-list__row {
  display: block;
  margin-bottom: 0.75rem;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.transaction-list__table td {
  display: block;
  padding: 0.5rem;
  border-bottom: none;
}

.transaction-list__table td::before {
  content: attr(data-label) ': ';
  font-weight: 600;
  color: #666;
}

.transaction-list__amount {
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
}

.transaction-list__amount--income {
  color: #32a287;
}

.transaction-list__amount--expense {
  color: #c62828;
}

.transaction-list__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.transaction-list__page-button {
  padding: 0.5rem 0.875rem;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  font-weight: 600;
  color: #424242;
  cursor: pointer;
  transition: all 0.2s;
}

.transaction-list__page-button:hover:not(:disabled) {
  border-color: #32a287;
  color: #32a287;
}

.transaction-list__page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.transaction-list__page-info {
  font-size: 0.9em;
  color: #666;
  white-space: nowrap;
}

@media (min-width: 769px) {
  .transaction-list__table thead {
    display: table-header-group;
  }

  .transaction-list__table tbody {
    display: table-row-group;
  }

  .transaction-list__table tr {
    display: table-row;
    margin-bottom: 0;
    border: none;
    border-radius: 0;
  }

  .transaction-list__table td {
    display: table-cell;
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #f0f0f0;
  }

  .transaction-list__table td::before {
    content: none;
  }

  .transaction-list__amount {
    text-align: right;
  }
}
</style>
