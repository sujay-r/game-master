import { computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import type { Transaction } from '@/types/common'

export function useFilteredTransactions() {
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

  const filteredTransactions = computed<Transaction[]>(() =>
    financeStore.transactions.filter(
      (transaction) =>
        isWithinDateRange(transaction) &&
        kindMatches(transaction) &&
        typeFilterMatches(transaction),
    ),
  )

  return {
    filteredTransactions,
  }
}
