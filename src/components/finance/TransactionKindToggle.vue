<template>
  <div class="kind-toggle">
    <label v-if="label" class="kind-toggle-label">{{ label }}</label>
    <div class="kind-toggle-group" role="group" aria-label="Transaction kind filter">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="kind-toggle-button"
        :class="{ active: modelValue === option.value }"
        :aria-pressed="modelValue === option.value"
        @click="selectKind(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TransactionKind } from '@/types/common'
import type { TransactionKindFilter } from '@/types/finance'

const props = withDefaults(
  defineProps<{
    modelValue: TransactionKindFilter
    label?: string
  }>(),
  {
    label: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: TransactionKindFilter): void
}>()

const options: Array<{ value: TransactionKindFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: TransactionKind.Income, label: 'Income' },
  { value: TransactionKind.Expense, label: 'Expense' },
]

function selectKind(value: TransactionKindFilter) {
  if (value !== props.modelValue) {
    emit('update:modelValue', value)
  }
}
</script>

<style scoped>
.kind-toggle {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.kind-toggle-label {
  font-size: 0.875em;
  font-weight: 600;
  color: #666;
}

.kind-toggle-group {
  display: inline-flex;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.kind-toggle-button {
  flex: 1;
  padding: 0.625rem 1rem;
  border: none;
  background: #fff;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  font-weight: 600;
  color: #424242;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.kind-toggle-button:hover {
  background: #f5f5f5;
}

.kind-toggle-button.active {
  background: #32a287;
  color: #fff;
}

.kind-toggle-button:not(:last-child) {
  border-right: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .kind-toggle-button {
    padding: 0.75rem 0.875rem;
    min-height: 44px;
  }
}
</style>
