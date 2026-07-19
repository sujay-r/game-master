import { TransactionKind } from '@/types/common'
import type { Transaction, TransactionType } from '@/types/common'

export type BucketSize = 'day' | 'week'

export interface Bucket {
  key: string
  label: string
  start: Date
  end: Date
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function startOfWeek(date: Date): Date {
  const day = date.getDay()
  const daysToMonday = day === 0 ? -6 : 1 - day
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysToMonday)
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getISOWeek(date: Date): number {
  const tmp = new Date(date.valueOf())
  const dayNumber = (date.getDay() + 6) % 7
  tmp.setDate(tmp.getDate() - dayNumber + 3)
  const firstThursday = tmp.valueOf()
  tmp.setMonth(0, 1)
  if (tmp.getDay() !== 4) {
    tmp.setMonth(0, 1 + ((4 - tmp.getDay() + 7) % 7))
  }
  return 1 + Math.ceil((firstThursday - tmp.getTime()) / (MS_PER_DAY * 7))
}

function getISOWeekYear(date: Date): number {
  const tmp = new Date(date.valueOf())
  const dayNumber = (date.getDay() + 6) % 7
  tmp.setDate(tmp.getDate() - dayNumber + 3)
  return tmp.getFullYear()
}

function formatWeekKey(date: Date): string {
  const year = getISOWeekYear(date)
  const week = String(getISOWeek(date)).padStart(2, '0')
  return `${year}-W${week}`
}

export function getBucketSize(start: Date, end: Date): BucketSize {
  const startMidnight = startOfDay(start)
  const endMidnight = startOfDay(end)
  const dayCount = Math.floor((endMidnight.getTime() - startMidnight.getTime()) / MS_PER_DAY) + 1
  return dayCount <= 31 ? 'day' : 'week'
}

export function generateBuckets(start: Date, end: Date, bucketSize: BucketSize): Bucket[] {
  const buckets: Bucket[] = []

  if (bucketSize === 'day') {
    const startMidnight = startOfDay(start)
    const endMidnight = startOfDay(end)
    const dayCount = Math.floor((endMidnight.getTime() - startMidnight.getTime()) / MS_PER_DAY) + 1

    for (let index = 0; index < dayCount; index++) {
      const bucketStart = new Date(startMidnight)
      bucketStart.setDate(bucketStart.getDate() + index)
      const bucketEnd = endOfDay(bucketStart)
      const label = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(
        bucketStart,
      )
      buckets.push({ key: formatDateKey(bucketStart), label, start: bucketStart, end: bucketEnd })
    }

    return buckets
  }

  const rangeEnd = endOfDay(end)
  let bucketStart = startOfWeek(startOfDay(start))

  while (bucketStart.getTime() <= rangeEnd.getTime()) {
    const bucketEnd = endOfDay(
      new Date(bucketStart.getFullYear(), bucketStart.getMonth(), bucketStart.getDate() + 6),
    )
    const week = getISOWeek(bucketStart)
    const year = getISOWeekYear(bucketStart)
    const key = `${year}-W${String(week).padStart(2, '0')}`
    const label = `W${week}`
    buckets.push({ key, label, start: new Date(bucketStart), end: bucketEnd })
    bucketStart = new Date(
      bucketStart.getFullYear(),
      bucketStart.getMonth(),
      bucketStart.getDate() + 7,
    )
  }

  return buckets
}

export function bucketTransactions(
  transactions: Transaction[],
  buckets: Bucket[],
  transactionTypes: TransactionType[],
  bucketSize: BucketSize,
): { income: number[]; expense: number[] } {
  const typeMap = new Map(transactionTypes.map((type) => [type.id, type]))
  const bucketMap = new Map<string, { income: number; expense: number }>()

  for (const bucket of buckets) {
    bucketMap.set(bucket.key, { income: 0, expense: 0 })
  }

  for (const transaction of transactions) {
    const type = typeMap.get(transaction.transactionTypeId)
    if (!type) {
      continue
    }

    const key =
      bucketSize === 'day' ? formatDateKey(transaction.date) : formatWeekKey(transaction.date)
    const totals = bucketMap.get(key)
    if (!totals) {
      continue
    }

    if (type.kind === TransactionKind.Income) {
      totals.income += transaction.amount
    } else {
      totals.expense += transaction.amount
    }
  }

  return {
    income: buckets.map((bucket) => bucketMap.get(bucket.key)?.income ?? 0),
    expense: buckets.map((bucket) => bucketMap.get(bucket.key)?.expense ?? 0),
  }
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}
