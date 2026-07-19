import { BudgetPeriod, TransactionKind, TransactionSource } from '@/types/common'
import type { Budget, Transaction, TransactionType } from '@/types/common'

const TYPE_IDS = {
  need: 1001,
  want: 1002,
  investment: 1003,
  income: 1004,
}

function currentMonthDate(day: number, hour = 12): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), day, hour, 0, 0, 0)
}

export function seedTransactionTypes(): TransactionType[] {
  return [
    {
      id: TYPE_IDS.need,
      name: 'Need',
      kind: TransactionKind.Expense,
      description: 'Essential expenses such as rent, groceries, and utilities',
      createdAt: new Date(),
    },
    {
      id: TYPE_IDS.want,
      name: 'Want',
      kind: TransactionKind.Expense,
      description: 'Discretionary spending such as dining and entertainment',
      createdAt: new Date(),
    },
    {
      id: TYPE_IDS.investment,
      name: 'Investment',
      kind: TransactionKind.Expense,
      description: 'Savings and investment contributions',
      createdAt: new Date(),
    },
    {
      id: TYPE_IDS.income,
      name: 'Income',
      kind: TransactionKind.Income,
      description: 'Salary and other income sources',
      createdAt: new Date(),
    },
  ]
}

export function seedTransactions(): Transaction[] {
  const types = seedTransactionTypes()
  const typeMap = new Map(types.map((type) => [type.id, type]))

  const items: Array<{
    id: number
    amount: number
    transactionTypeId: number
    description: string
    date: Date
  }> = [
    {
      id: 2001,
      amount: 5000,
      transactionTypeId: TYPE_IDS.income,
      description: 'Monthly salary deposit',
      date: currentMonthDate(1),
    },
    {
      id: 2002,
      amount: 1200,
      transactionTypeId: TYPE_IDS.need,
      description: 'Rent payment',
      date: currentMonthDate(3),
    },
    {
      id: 2003,
      amount: 350,
      transactionTypeId: TYPE_IDS.need,
      description: 'Weekly groceries',
      date: currentMonthDate(5),
    },
    {
      id: 2004,
      amount: 120,
      transactionTypeId: TYPE_IDS.want,
      description: 'Dinner with friends',
      date: currentMonthDate(8),
    },
    {
      id: 2005,
      amount: 80,
      transactionTypeId: TYPE_IDS.want,
      description: 'Movie and streaming subscriptions',
      date: currentMonthDate(10),
    },
    {
      id: 2006,
      amount: 500,
      transactionTypeId: TYPE_IDS.investment,
      description: 'Index fund contribution',
      date: currentMonthDate(12),
    },
    {
      id: 2007,
      amount: 150,
      transactionTypeId: TYPE_IDS.need,
      description: 'Electricity and internet bill',
      date: currentMonthDate(15),
    },
    {
      id: 2008,
      amount: 45,
      transactionTypeId: TYPE_IDS.want,
      description: 'Mobile app subscription',
      date: currentMonthDate(20),
    },
  ]

  return items.map((item) => {
    const createdAt = currentMonthDate(item.date.getDate(), item.date.getHours())
    return {
      ...item,
      source: TransactionSource.Manual,
      createdAt,
      transactionType: typeMap.get(item.transactionTypeId),
    }
  })
}

export function seedBudgets(): Budget[] {
  const types = seedTransactionTypes()
  const typeMap = new Map(types.map((type) => [type.id, type]))

  return [
    {
      id: 3001,
      transactionTypeId: TYPE_IDS.need,
      transactionType: typeMap.get(TYPE_IDS.need),
      amount: 2000,
      period: BudgetPeriod.Monthly,
      startDate: currentMonthDate(1, 0),
      endDate: null,
      createdAt: new Date(),
    },
    {
      id: 3002,
      transactionTypeId: TYPE_IDS.want,
      transactionType: typeMap.get(TYPE_IDS.want),
      amount: 500,
      period: BudgetPeriod.Monthly,
      startDate: currentMonthDate(1, 0),
      endDate: null,
      createdAt: new Date(),
    },
    {
      id: 3003,
      transactionTypeId: TYPE_IDS.investment,
      transactionType: typeMap.get(TYPE_IDS.investment),
      amount: 1000,
      period: BudgetPeriod.Monthly,
      startDate: currentMonthDate(1, 0),
      endDate: null,
      createdAt: new Date(),
    },
  ]
}
