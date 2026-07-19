<template>
  <div class="finance-dashboard">
    <HKTitle :img_path="financeTitleURL" :size="1" />

    <div class="dashboard-header">
      <div class="dashboard-title-section">
        <h1 class="dashboard-title">Finance Dashboard</h1>
        <p class="dashboard-subtitle">Track income, expenses, and budgets in one place</p>
      </div>
      <div class="dashboard-actions">
        <RouterLink to="/finance/entry" class="action-button primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Transaction
        </RouterLink>
        <RouterLink to="/finance/history" class="action-button secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 3v5h5" />
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
            <path d="M12 7v5l4 2" />
          </svg>
          Query History
        </RouterLink>
      </div>
    </div>

    <FinanceFilterBar />

    <div class="dashboard-grid">
      <DashboardSlot test-id="summary-bar-slot" class="slot-summary" enable-error-toggle>
        <SummaryBar />
      </DashboardSlot>

      <DashboardSlot test-id="budget-status-slot" class="slot-budget" enable-error-toggle>
        <BudgetStatus />
      </DashboardSlot>

      <DashboardSlot test-id="spend-breakdown-slot" class="slot-breakdown" enable-error-toggle>
        <SpendBreakdown />
      </DashboardSlot>

      <DashboardSlot test-id="transaction-list-slot" class="slot-transactions" enable-error-toggle>
        <TransactionList />
      </DashboardSlot>

      <DashboardSlot test-id="income-expense-chart-slot" class="slot-chart" enable-error-toggle>
        <div class="placeholder" data-testid="income-expense-chart-placeholder">
          <h3>Income vs. Expense Chart</h3>
          <p>Chart will be rendered here</p>
        </div>
      </DashboardSlot>

      <DashboardSlot test-id="nlq-panel-slot" class="slot-nlq" enable-error-toggle>
        <div class="placeholder" data-testid="nlq-panel-placeholder">
          <h3>NLQ Panel</h3>
          <p>Selected types: {{ selectedTypeNames }}</p>
        </div>
      </DashboardSlot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import HKTitle from '@/components/common/HKTitle.vue'
import FinanceFilterBar from '@/components/finance/FinanceFilterBar.vue'
import DashboardSlot from '@/components/finance/DashboardSlot.vue'
import SummaryBar from '@/components/finance/SummaryBar.vue'
import BudgetStatus from '@/components/finance/BudgetStatus.vue'
import SpendBreakdown from '@/components/finance/SpendBreakdown.vue'
import TransactionList from '@/components/finance/TransactionList.vue'
import { useFinanceStore } from '@/stores/finance'

const financeStore = useFinanceStore()

const financeTitleURL = new URL('@/assets/imgs/Moneylog.png', import.meta.url).href

const selectedTypeNames = computed(() => {
  const names = financeStore.selectedTransactionTypes.map((type) => type.name)
  return names.length > 0 ? names.join(', ') : 'All types'
})

onMounted(() => {
  if (import.meta.env.DEV && financeStore.transactionTypes.length === 0) {
    financeStore.seedFinanceData()
  } else if (financeStore.transactionTypes.length === 0) {
    financeStore.loadTransactionTypes()
  }
})
</script>

<style scoped>
.finance-dashboard {
  padding: 0 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.dashboard-title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 1.75em;
  color: #424242;
  margin: 0;
}

.dashboard-subtitle {
  color: #666;
  margin: 0.25rem 0 0;
  font-size: 0.95em;
}

.dashboard-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.action-button.primary {
  background: #32a287;
  color: #fff;
}

.action-button.primary:hover {
  background: #2d826d;
}

.action-button.secondary {
  background: #fff;
  color: #424242;
  border-color: #e0e0e0;
}

.action-button.secondary:hover {
  border-color: #32a287;
  color: #32a287;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.slot-summary,
.slot-budget,
.slot-breakdown,
.slot-transactions,
.slot-chart,
.slot-nlq {
  grid-column: span 12;
}

@media (min-width: 769px) {
  .slot-summary {
    grid-column: span 12;
  }

  .slot-budget,
  .slot-breakdown {
    grid-column: span 6;
  }

  .slot-chart {
    grid-column: span 6;
  }

  .slot-transactions {
    grid-column: span 12;
  }

  .slot-nlq {
    grid-column: span 12;
  }
}

@media (min-width: 1024px) {
  .slot-summary {
    grid-column: span 12;
  }

  .slot-budget,
  .slot-breakdown {
    grid-column: span 6;
  }

  .slot-transactions {
    grid-column: span 12;
  }

  .slot-chart,
  .slot-nlq {
    grid-column: span 6;
  }
}

.placeholder {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.placeholder h3 {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 1.1em;
  color: #424242;
  margin: 0;
}

.placeholder p {
  color: #666;
  margin: 0;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-actions {
    width: 100%;
  }

  .action-button {
    flex: 1;
    justify-content: center;
  }
}
</style>
