import { TransactionKind, type Transaction, type TransactionType } from '@/types/common'

export function assertExpenseType(type: TransactionType): void {
  if (type.kind !== TransactionKind.Expense) {
    throw new Error(
      `Budgets can only be linked to expense transaction types. Received kind: ${type.kind}`,
    )
  }
}

export function getLatestIncome(transactions: Transaction[]): Transaction | undefined {
  return transactions
    .filter((transaction) => transaction.transactionType?.kind === TransactionKind.Income)
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0]
}
