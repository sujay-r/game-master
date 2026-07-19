<template>
  <div class="income-expense-chart" data-testid="income-expense-chart">
    <h3 class="income-expense-chart__title">Income vs. Expense</h3>

    <div
      v-if="hasVisibleData"
      class="income-expense-chart__canvas-wrapper"
      data-testid="income-expense-chart-canvas"
    >
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <div v-else class="income-expense-chart__empty" data-testid="income-expense-chart-empty">
      <p>No data</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import { useFinanceStore } from '@/stores/finance'
import { useFilteredTransactions } from '@/composables/useFilteredTransactions'
import { getBucketSize, generateBuckets, bucketTransactions, formatINR } from '@/utils/financeChart'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const financeStore = useFinanceStore()
const { filteredTransactions } = useFilteredTransactions()

const INCOME_COLOR = '#32a287'
const EXPENSE_COLOR = '#c62828'

const bucketSize = computed(() => {
  const start = new Date(financeStore.filters.dateRange.start)
  const end = new Date(financeStore.filters.dateRange.end)
  return getBucketSize(start, end)
})

const buckets = computed(() => {
  const start = new Date(financeStore.filters.dateRange.start)
  const end = new Date(financeStore.filters.dateRange.end)
  return generateBuckets(start, end, bucketSize.value)
})

const series = computed(() =>
  bucketTransactions(
    filteredTransactions.value,
    buckets.value,
    financeStore.transactionTypes,
    bucketSize.value,
  ),
)

const chartData = computed<ChartData<'bar'>>(() => {
  const datasets = []

  if (financeStore.filters.kind !== 'expense') {
    datasets.push({
      label: 'Income',
      data: series.value.income,
      backgroundColor: INCOME_COLOR,
      stack: 'total',
    })
  }

  if (financeStore.filters.kind !== 'income') {
    datasets.push({
      label: 'Expense',
      data: series.value.expense,
      backgroundColor: EXPENSE_COLOR,
      stack: 'total',
    })
  }

  return {
    labels: buckets.value.map((bucket) => bucket.label),
    datasets,
  }
})

const hasVisibleData = computed(() =>
  chartData.value.datasets.some((dataset) => (dataset.data as number[]).some((value) => value > 0)),
)

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
    },
    tooltip: {
      callbacks: {
        title: (items) => (items[0]?.label ? String(items[0].label) : ''),
        label: (context) => `${context.dataset.label}: ${formatINR(context.raw as number)}`,
      },
    },
  },
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
      beginAtZero: true,
    },
  },
  barPercentage: 0.95,
  categoryPercentage: 0.9,
}))
</script>

<style scoped>
.income-expense-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.income-expense-chart__title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 1.1em;
  color: #424242;
  margin: 0;
}

.income-expense-chart__canvas-wrapper {
  position: relative;
  flex: 1;
  min-height: 280px;
}

.income-expense-chart__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 280px;
  color: #666;
  font-size: 0.95em;
}

.income-expense-chart__empty p {
  margin: 0;
}
</style>
