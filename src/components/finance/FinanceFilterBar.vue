<template>
  <div class="finance-filter-bar">
    <DateRangePicker
      :model-value="financeStore.filters.dateRange"
      label="Date Range"
      @update:model-value="financeStore.setDateRange"
    />

    <TransactionTypeFilter
      :model-value="financeStore.filters.transactionTypeIds"
      label="Transaction Types"
      @update:model-value="financeStore.setTransactionTypeIds"
    />

    <TransactionKindToggle
      :model-value="financeStore.filters.kind"
      label="Kind"
      @update:model-value="financeStore.setKind"
    />

    <button
      v-if="financeStore.isFiltered"
      type="button"
      class="reset-filters-button"
      @click="financeStore.resetFilters"
      aria-label="Reset filters"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
      Reset
    </button>
  </div>
</template>

<script setup lang="ts">
import { useFinanceStore } from '@/stores/finance'
import DateRangePicker from '@/components/finance/DateRangePicker.vue'
import TransactionTypeFilter from '@/components/finance/TransactionTypeFilter.vue'
import TransactionKindToggle from '@/components/finance/TransactionKindToggle.vue'

const financeStore = useFinanceStore()
</script>

<style scoped>
.finance-filter-bar {
  display: grid;
  grid-template-columns: minmax(200px, 1.25fr) minmax(180px, 1.5fr) auto auto;
  align-items: flex-end;
  gap: 1rem;
  padding: 1rem;
  background: #f8f8f6;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
}

.reset-filters-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.625rem 1rem;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.reset-filters-button:hover {
  border-color: #32a287;
  color: #32a287;
}

@media (max-width: 900px) {
  .finance-filter-bar {
    grid-template-columns: 1fr 1fr;
  }

  .reset-filters-button {
    justify-self: start;
  }
}

@media (max-width: 640px) {
  .finance-filter-bar {
    grid-template-columns: 1fr;
  }

  .reset-filters-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
