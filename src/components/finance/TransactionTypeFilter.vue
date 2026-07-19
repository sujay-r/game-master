<template>
  <div class="transaction-type-filter">
    <label v-if="label" class="type-filter-label">{{ label }}</label>
    <MultiselectDropdown
      :options="availableTypes"
      :model-value="selectedTypes"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MultiselectDropdown from '@/components/forms/MultiselectDropdown.vue'
import { useFinanceStore } from '@/stores/finance'
import type { TransactionType } from '@/types/common'

const props = withDefaults(
  defineProps<{
    modelValue: number[]
    label?: string
    placeholder?: string
  }>(),
  {
    label: undefined,
    placeholder: 'Select types',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const financeStore = useFinanceStore()

const availableTypes = computed<TransactionType[]>(() => financeStore.transactionTypes)

const selectedTypes = computed<TransactionType[]>(() =>
  financeStore.transactionTypes.filter((type) => props.modelValue.includes(type.id)),
)

function handleUpdate(selected: TransactionType[]) {
  emit(
    'update:modelValue',
    selected.map((type) => type.id),
  )
}
</script>

<style scoped>
.transaction-type-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.type-filter-label {
  font-size: 0.875em;
  font-weight: 600;
  color: #666;
}
</style>
