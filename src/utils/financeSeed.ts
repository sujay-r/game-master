import { BudgetPeriod, TransactionKind, TransactionSource } from '@/types/common'
import type { Budget, Transaction, TransactionType } from '@/types/common'

function currentMonthDate(day: number, hour = 12): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), day, hour, 0, 0, 0)
}

/**
 * Fallback — only used when Supabase is unavailable.
 * IDs here are arbitrary; they are never sent to Supabase.
 */
export function seedTransactionTypes(): TransactionType[] {
  return [
    {
      id: 1,
      name: 'Need',
      kind: TransactionKind.Expense,
      description: 'Essential expenses such as rent, groceries, and utilities',
      createdAt: new Date(),
    },
    {
      id: 2,
      name: 'Want',
      kind: TransactionKind.Expense,
      description: 'Discretionary spending such as dining and entertainment',
      createdAt: new Date(),
    },
    {
      id: 3,
      name: 'Investment',
      kind: TransactionKind.Expense,
      description: 'Savings and investment contributions',
      createdAt: new Date(),
    },
    {
      id: 4,
      name: 'Income',
      kind: TransactionKind.Income,
      description: 'Salary and other income sources',
      createdAt: new Date(),
    },
  ]
}

interface SeedTransactionSpec {
  amount: number
  typeName: string
  description: string
  date: Date
}

const transactionSpecs: SeedTransactionSpec[] = [
  { amount: 5000, typeName: 'Income', description: 'Monthly salary deposit', date: currentMonthDate(1) },
  { amount: 1200, typeName: 'Need', description: 'Rent payment', date: currentMonthDate(3) },
  { amount: 350, typeName: 'Need', description: 'Weekly groceries', date: currentMonthDate(5) },
  { amount: 120, typeName: 'Want', description: 'Dinner with friends', date: currentMonthDate(8) },
  { amount: 80, typeName: 'Want', description: 'Movie and streaming subscriptions', date: currentMonthDate(10) },
  { amount: 500, typeName: 'Investment', description: 'Index fund contribution', date: currentMonthDate(12) },
  { amount: 150, typeName: 'Need', description: 'Electricity and internet bill', date: currentMonthDate(15) },
  { amount: 45, typeName: 'Want', description: 'Mobile app subscription', date: currentMonthDate(20) },
]

interface SeedBudgetSpec {
  typeName: string
  amount: number
}

const budgetSpecs: SeedBudgetSpec[] = [
  { typeName: 'Need', amount: 2000 },
  { typeName: 'Want', amount: 500 },
  { typeName: 'Investment', amount: 1000 },
]

/**
 * Build a name → id lookup from whatever types are currently loaded
 * (real Supabase IDs or fallback hardcoded IDs).
 */
function buildTypeMap(types: TransactionType[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const type of types) {
    map.set(type.name, type.id)
  }
  return map
}

export function seedTransactions(types: TransactionType[]): Transaction[] {
  const typeMap = buildTypeMap(types)

  return transactionSpecs.map((spec, index) => {
    const typeId = typeMap.get(spec.typeName)
    const createdAt = currentMonthDate(spec.date.getDate(), spec.date.getHours())
    return {
      id: 2001 + index,
      amount: spec.amount,
      transactionTypeId: typeId ?? 0,
      transactionType: types.find((t) => t.id === typeId),
      description: spec.description,
      date: spec.date,
      source: TransactionSource.Manual,
      createdAt,
    }
  })
}

export function seedBudgets(types: TransactionType[]): Budget[] {
  const typeMap = buildTypeMap(types)

  return budgetSpecs.map((spec, index) => {
    const typeId = typeMap.get(spec.typeName)
    return {
      id: 3001 + index,
      transactionTypeId: typeId ?? 0,
      transactionType: types.find((t) => t.id === typeId),
      amount: spec.amount,
      period: BudgetPeriod.Monthly,
      startDate: currentMonthDate(1, 0),
      endDate: null,
      createdAt: new Date(),
    }
  })
}
