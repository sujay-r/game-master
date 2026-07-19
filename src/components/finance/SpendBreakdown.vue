<template>
  <div class="spend-breakdown" data-testid="spend-breakdown">
    <h3 class="spend-breakdown__title">Spend Breakdown</h3>

    <div
      v-if="expenseTotals.length === 0"
      class="spend-breakdown__empty"
      data-testid="spend-breakdown-empty"
    >
      <p>No expense data</p>
    </div>

    <template v-else>
      <div class="spend-breakdown__chart-wrapper">
        <svg
          class="spend-breakdown__chart"
          viewBox="0 0 100 100"
          data-testid="spend-breakdown-chart"
        >
          <path
            v-for="segment in segments"
            :key="segment.typeId"
            :d="segment.path"
            :fill="segment.color"
          />
        </svg>
      </div>

      <ul class="spend-breakdown__legend" data-testid="spend-breakdown-legend">
        <li
          v-for="item in legendItems"
          :key="item.typeId"
          class="spend-breakdown__legend-item"
          data-testid="spend-breakdown-legend-item"
        >
          <span class="spend-breakdown__swatch" :style="{ backgroundColor: item.color }" />
          <span class="spend-breakdown__type-name">{{ item.name }}</span>
          <span class="spend-breakdown__amount">{{ item.formattedAmount }}</span>
          <span class="spend-breakdown__percent">{{ item.percent }}%</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { TransactionKind } from '@/types/common'
import type { Transaction } from '@/types/common'

const financeStore = useFinanceStore()

const FIXED_COLOURS: Record<string, string> = {
  Need: '#32a287',
  Want: '#e6a817',
  Investment: '#c62828',
}

const FALLBACK_PALETTE = ['#5c6bc0', '#8e24aa', '#d84315', '#00897b', '#3949ab']

function colourForType(typeId: number, name: string): string {
  if (FIXED_COLOURS[name]) {
    return FIXED_COLOURS[name]
  }
  return FALLBACK_PALETTE[Math.abs(typeId) % FALLBACK_PALETTE.length]
}

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

const filteredTransactions = computed(() =>
  financeStore.transactions.filter(
    (transaction) =>
      isWithinDateRange(transaction) && kindMatches(transaction) && typeFilterMatches(transaction),
  ),
)

interface ExpenseTotal {
  typeId: number
  name: string
  amount: number
  color: string
}

const expenseTotals = computed<ExpenseTotal[]>(() => {
  const totals = new Map<number, number>()

  filteredTransactions.value.forEach((transaction) => {
    const type = financeStore.transactionTypes.find((t) => t.id === transaction.transactionTypeId)
    if (!type || type.kind !== TransactionKind.Expense) {
      return
    }
    totals.set(type.id, (totals.get(type.id) ?? 0) + transaction.amount)
  })

  return Array.from(totals.entries())
    .map(([typeId, amount]) => {
      const type = financeStore.transactionTypes.find((t) => t.id === typeId)
      return {
        typeId,
        name: type?.name ?? 'Unknown',
        amount,
        color: colourForType(typeId, type?.name ?? ''),
      }
    })
    .sort((a, b) => b.amount - a.amount)
})

const totalExpense = computed(() => expenseTotals.value.reduce((sum, item) => sum + item.amount, 0))

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

interface LegendItem {
  typeId: number
  name: string
  formattedAmount: string
  percent: number
  color: string
}

const legendItems = computed<LegendItem[]>(() =>
  expenseTotals.value.map((item) => ({
    typeId: item.typeId,
    name: item.name,
    formattedAmount: formatCurrency(item.amount),
    percent: Math.round((item.amount / totalExpense.value) * 100),
    color: item.color,
  })),
)

const CHART_CX = 50
const CHART_CY = 50
const OUTER_RADIUS = 50
const INNER_RADIUS = 30

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  sweep: number,
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? '1' : '0'

  return ['A', radius, radius, 0, largeArcFlag, sweep, start.x, start.y].join(' ')
}

function describeDonutSegment(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle)
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle)
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle)

  const angleSweep = endAngle - startAngle

  // Full ring: draw two half-arcs so the path does not collapse to zero area.
  if (Math.abs(angleSweep) >= 360) {
    const mid = startAngle + 180
    const outerMid = polarToCartesian(cx, cy, outerRadius, mid)
    const innerMid = polarToCartesian(cx, cy, innerRadius, mid)

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${outerMid.x} ${outerMid.y}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${outerStart.x} ${outerStart.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${innerMid.x} ${innerMid.y}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ')
  }

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    describeArc(cx, cy, outerRadius, startAngle, endAngle, 1),
    `L ${innerEnd.x} ${innerEnd.y}`,
    describeArc(cx, cy, innerRadius, endAngle, startAngle, 0),
    'Z',
  ].join(' ')
}

interface Segment {
  typeId: number
  path: string
  color: string
}

const segments = computed<Segment[]>(() => {
  const total = totalExpense.value
  if (total === 0) {
    return []
  }

  let currentAngle = 0
  const result: Segment[] = []

  expenseTotals.value.forEach((item, index) => {
    const isLast = index === expenseTotals.value.length - 1
    const sweep = isLast ? 360 - currentAngle : (item.amount / total) * 360
    const endAngle = currentAngle + sweep

    result.push({
      typeId: item.typeId,
      path: describeDonutSegment(
        CHART_CX,
        CHART_CY,
        INNER_RADIUS,
        OUTER_RADIUS,
        currentAngle,
        endAngle,
      ),
      color: item.color,
    })

    currentAngle = endAngle
  })

  return result
})
</script>

<style scoped>
.spend-breakdown {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.spend-breakdown__title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 1.1em;
  color: #424242;
  margin: 0;
}

.spend-breakdown__chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.spend-breakdown__chart {
  width: 160px;
  height: 160px;
}

.spend-breakdown__empty {
  color: #666;
  font-size: 0.95em;
  text-align: center;
  padding: 1.5rem 0;
}

.spend-breakdown__empty p {
  margin: 0;
}

.spend-breakdown__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.spend-breakdown__legend-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9em;
}

.spend-breakdown__swatch {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.spend-breakdown__type-name {
  font-family: Trajan, 'Perpetua', serif;
  color: #424242;
}

.spend-breakdown__amount {
  color: #666;
  white-space: nowrap;
}

.spend-breakdown__percent {
  color: #666;
  min-width: 2.5rem;
  text-align: right;
}

@media (max-width: 480px) {
  .spend-breakdown__legend-item {
    font-size: 0.85em;
  }
}
</style>
