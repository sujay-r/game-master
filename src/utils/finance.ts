import { TransactionKind, type TransactionType } from '@/types/common'

export function assertExpenseType(type: TransactionType): void {
  if (type.kind !== TransactionKind.Expense) {
    throw new Error(
      `Budgets can only be linked to expense transaction types. Received kind: ${type.kind}`,
    )
  }
}
