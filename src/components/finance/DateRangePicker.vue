<template>
  <div class="date-range-picker">
    <label v-if="label" class="date-range-label">{{ label }}</label>
    <VueDatePicker
      :model-value="dateRange"
      range
      :auto-apply="true"
      :close-on-auto-apply="false"
      :enable-time-picker="true"
      :format="formatRange"
      :preview-format="formatRange"
      :placeholder="placeholder"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import type { DateRangeContext } from '@/types/finance'

const props = withDefaults(
  defineProps<{
    modelValue: DateRangeContext
    label?: string
    placeholder?: string
  }>(),
  {
    label: undefined,
    placeholder: 'Select date range',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: DateRangeContext): void
}>()

const dateRange = computed(() => {
  return [new Date(props.modelValue.start), new Date(props.modelValue.end)]
})

function formatRange(dates: unknown): string {
  if (!Array.isArray(dates) || dates.length < 2) {
    return props.placeholder
  }
  const [start, end] = dates as Date[]
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (start.getFullYear() !== end.getFullYear()) {
    options.year = 'numeric'
  }
  return `${start.toLocaleDateString('en-IN', options)} - ${end.toLocaleDateString('en-IN', options)}`
}

function handleUpdate(value: unknown) {
  if (!Array.isArray(value) || value.length < 2 || !value[0] || !value[1]) {
    return
  }
  const [start, end] = value as Date[]
  emit('update:modelValue', {
    start: start.toISOString(),
    end: end.toISOString(),
  })
}
</script>

<style scoped>
.date-range-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.date-range-label {
  font-size: 0.875em;
  font-weight: 600;
  color: #666;
}

.date-range-picker :deep(.dp__input) {
  font-family: Perpetua, Avenir, Helvetica, Arial, sans-serif;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  font-size: 0.95em;
  color: #424242;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.date-range-picker :deep(.dp__input:hover),
.date-range-picker :deep(.dp__input:focus) {
  border-color: #32a287;
}

.date-range-picker :deep(.dp__input_icon) {
  color: #666;
}

@media (max-width: 768px) {
  .date-range-picker :deep(.dp__input) {
    padding: 0.75rem 1rem;
    min-height: 44px;
  }
}
</style>
