import {
  TransactionKind,
  TransactionSource,
  BudgetPeriod,
  type TransactionType,
  type Transaction,
  type Budget,
  type UserQuery,
} from '@/types/common'

export type { TransactionKind, TransactionSource, BudgetPeriod }

export interface DateRangeContext {
  start: string
  end: string
}

export type CreateTransactionTypeInput = Omit<TransactionType, 'id' | 'createdAt'>

export type CreateTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'transactionType'>

export type CreateBudgetInput = Omit<Budget, 'id' | 'createdAt' | 'transactionType'>

export type CreateUserQueryInput = Omit<UserQuery, 'id' | 'createdAt'>

export function isTransactionKind(value: unknown): value is TransactionKind {
  return (
    typeof value === 'string' && Object.values(TransactionKind).includes(value as TransactionKind)
  )
}

export function isTransactionSource(value: unknown): value is TransactionSource {
  return (
    typeof value === 'string' &&
    Object.values(TransactionSource).includes(value as TransactionSource)
  )
}

export function isBudgetPeriod(value: unknown): value is BudgetPeriod {
  return typeof value === 'string' && Object.values(BudgetPeriod).includes(value as BudgetPeriod)
}

export function isDateRangeContext(value: unknown): value is DateRangeContext {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const context = value as Record<string, unknown>
  return typeof context.start === 'string' && typeof context.end === 'string'
}

export type TransactionKindFilter = TransactionKind | 'all'

export interface FinanceFilters {
  dateRange: DateRangeContext
  transactionTypeIds: number[]
  kind: TransactionKindFilter
}

export function isTransactionKindFilter(value: unknown): value is TransactionKindFilter {
  return typeof value === 'string' && (isTransactionKind(value) || value === 'all')
}
