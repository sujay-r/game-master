import { defineStore } from 'pinia'
import type { TransactionType, Transaction, Budget, UserQuery } from '@/types/common'
import type {
  CreateTransactionTypeInput,
  CreateTransactionInput,
  CreateBudgetInput,
  CreateUserQueryInput,
  FinanceFilters,
  TransactionKindFilter,
} from '@/types/finance'
import {
  fetchTransactionTypes,
  createTransactionType,
  fetchTransactions,
  createTransaction,
  fetchBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  fetchUserQueries,
  createUserQuery,
} from '@/lib/supabase'
import { seedBudgets, seedTransactionTypes, seedTransactions } from '@/utils/financeSeed'

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

interface FinanceStoreState {
  transactionTypes: TransactionType[]
  transactions: Transaction[]
  budgets: Budget[]
  userQueries: UserQuery[]
  filters: FinanceFilters
  loading: boolean
  error: string | null
}

const useFinanceStore = defineStore('finance', {
  state: (): FinanceStoreState => ({
    transactionTypes: [],
    transactions: [],
    budgets: [],
    userQueries: [],
    filters: {
      dateRange: getCurrentMonthRange(),
      transactionTypeIds: [],
      kind: 'all',
    },
    loading: false,
    error: null,
  }),

  actions: {
    async loadTransactionTypes() {
      this.loading = true
      this.error = null
      try {
        this.transactionTypes = await fetchTransactionTypes()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load transaction types'
        console.error('Error loading transaction types: ', err)
      } finally {
        this.loading = false
      }
    },

    async seedFinanceData() {
      // Always try Supabase types first — they're FK targets and must be real.
      // Fall back to hardcoded types only when Supabase is unavailable.
      try {
        await this.loadTransactionTypes()
      } catch {
        this.transactionTypes = seedTransactionTypes()
      }
      this.transactions = seedTransactions(this.transactionTypes)
      this.budgets = seedBudgets(this.transactionTypes)
      this.loading = false
      this.error = null
    },

    async addTransactionType(input: CreateTransactionTypeInput): Promise<TransactionType> {
      try {
        const created = await createTransactionType(input)
        this.transactionTypes.push(created)
        this.transactionTypes.sort((a, b) => a.name.localeCompare(b.name))
        return created
      } catch (err) {
        console.error('Error adding transaction type: ', err)
        throw err
      }
    },

    async loadTransactions() {
      this.loading = true
      this.error = null
      try {
        this.transactions = await fetchTransactions()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load transactions'
        console.error('Error loading transactions: ', err)
      } finally {
        this.loading = false
      }
    },

    async addTransaction(input: CreateTransactionInput): Promise<Transaction> {
      try {
        const created = await createTransaction(input)
        this.transactions.unshift(created)
        return created
      } catch (err) {
        console.error('Error adding transaction: ', err)
        throw err
      }
    },

    async loadBudgets() {
      this.loading = true
      this.error = null
      try {
        this.budgets = await fetchBudgets()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load budgets'
        console.error('Error loading budgets: ', err)
      } finally {
        this.loading = false
      }
    },

    async addBudget(input: CreateBudgetInput): Promise<Budget> {
      try {
        const created = await createBudget(input)
        this.budgets.unshift(created)
        return created
      } catch (err) {
        console.error('Error adding budget: ', err)
        throw err
      }
    },

    async updateBudget(id: number, updates: Partial<CreateBudgetInput>): Promise<Budget> {
      try {
        const updated = await updateBudget(id, updates)
        const index = this.budgets.findIndex((budget) => budget.id === id)
        if (index !== -1) {
          this.budgets[index] = updated
        } else {
          this.budgets.unshift(updated)
        }
        return updated
      } catch (err) {
        console.error('Error updating budget: ', err)
        throw err
      }
    },

    async deleteBudget(id: number): Promise<void> {
      try {
        await deleteBudget(id)
        this.budgets = this.budgets.filter((budget) => budget.id !== id)
      } catch (err) {
        console.error('Error deleting budget: ', err)
        throw err
      }
    },

    async loadUserQueries() {
      this.loading = true
      this.error = null
      try {
        this.userQueries = await fetchUserQueries()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load user queries'
        console.error('Error loading user queries: ', err)
      } finally {
        this.loading = false
      }
    },

    async addUserQuery(input: CreateUserQueryInput): Promise<UserQuery> {
      try {
        const created = await createUserQuery(input)
        this.userQueries.unshift(created)
        return created
      } catch (err) {
        console.error('Error adding user query: ', err)
        throw err
      }
    },

    clearError() {
      this.error = null
    },

    setDateRange(dateRange: FinanceFilters['dateRange']) {
      this.filters.dateRange = { ...dateRange }
    },

    setTransactionTypeIds(ids: number[]) {
      this.filters.transactionTypeIds = [...ids]
    },

    setKind(kind: TransactionKindFilter) {
      this.filters.kind = kind
    },

    resetFilters() {
      this.filters = {
        dateRange: getCurrentMonthRange(),
        transactionTypeIds: [],
        kind: 'all',
      }
    },
  },

  getters: {
    expenseTypes: (state) => state.transactionTypes.filter((type) => type.kind === 'expense'),
    incomeTypes: (state) => state.transactionTypes.filter((type) => type.kind === 'income'),
    selectedTransactionTypes: (state) =>
      state.transactionTypes.filter((type) => state.filters.transactionTypeIds.includes(type.id)),
    isFiltered: (state) => {
      const defaultRange = getCurrentMonthRange()
      return (
        state.filters.kind !== 'all' ||
        state.filters.transactionTypeIds.length > 0 ||
        state.filters.dateRange.start !== defaultRange.start ||
        state.filters.dateRange.end !== defaultRange.end
      )
    },
  },
})

export { useFinanceStore }
