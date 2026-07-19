import { defineStore } from 'pinia'
import type { TransactionType, Transaction, Budget, UserQuery } from '@/types/common'
import type {
  CreateTransactionTypeInput,
  CreateTransactionInput,
  CreateBudgetInput,
  CreateUserQueryInput,
} from '@/types/finance'
import {
  fetchTransactionTypes,
  createTransactionType,
  fetchTransactions,
  createTransaction,
  fetchBudgets,
  createBudget,
  fetchUserQueries,
  createUserQuery,
} from '@/lib/supabase'

interface FinanceStoreState {
  transactionTypes: TransactionType[]
  transactions: Transaction[]
  budgets: Budget[]
  userQueries: UserQuery[]
  loading: boolean
  error: string | null
}

const useFinanceStore = defineStore('finance', {
  state: (): FinanceStoreState => ({
    transactionTypes: [],
    transactions: [],
    budgets: [],
    userQueries: [],
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
  },

  getters: {
    expenseTypes: (state) => state.transactionTypes.filter((type) => type.kind === 'expense'),
    incomeTypes: (state) => state.transactionTypes.filter((type) => type.kind === 'income'),
  },
})

export { useFinanceStore }
