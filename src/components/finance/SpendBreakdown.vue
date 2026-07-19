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
        <Doughnut :data="chartData" :options="chartOptions" data-testid="spend-breakdown-chart" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, DoughnutController, Tooltip, Legend } from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import { useFinanceStore } from '@/stores/finance'
import { useFilteredTransactions } from '@/composables/useFilteredTransactions'
import { TransactionKind } from '@/types/common'

ChartJS.register(ArcElement, DoughnutController, Tooltip, Legend)

const financeStore = useFinanceStore()
const { filteredTransactions } = useFilteredTransactions()

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

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: expenseTotals.value.map((item) => item.name),
  datasets: [
    {
      data: expenseTotals.value.map((item) => item.amount),
      backgroundColor: expenseTotals.value.map((item) => item.color),
      borderWidth: 0,
    },
  ],
}))

const chartOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 8,
        usePointStyle: false,
      },
    },
    tooltip: {
      callbacks: {
        title: (items) => {
          const item = items[0]
          if (!item) {
            return ''
          }
          return expenseTotals.value[item.dataIndex].name
        },
        label: (context) => {
          const amount = expenseTotals.value[context.dataIndex].amount
          const percent = Math.round((amount / totalExpense.value) * 100)
          return `${formatCurrency(amount)} (${percent}%)`
        },
      },
    },
  },
}))
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
  width: 160px;
  height: 160px;
  margin: 0 auto;
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

@media (max-width: 480px) {
  .spend-breakdown__chart-wrapper {
    width: 140px;
    height: 140px;
  }
}
</style>
