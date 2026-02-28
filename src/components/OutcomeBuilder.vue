<template>
  <div class="outcome-builder">
    <label class="outcome-label">Task Outcomes <span class="optional">(optional)</span></label>

    <div v-if="outcomeRows.length === 0" class="no-outcomes">
      <p>No outcomes set</p>
    </div>

    <div v-for="(row, index) in outcomeRows" :key="index" class="outcome-row">
      <DropdownBase
        :model-value="row.token_type"
        :options="tokenOptions"
        :show-secondary-field="true"
        :secondary-value="row.quantity"
        :secondary-min="1"
        :secondary-max="99"
        placeholder="Select token"
        @update:model-value="(value) => updateOutcome(index, 'token_type', value as string)"
        @update:secondary-value="(value) => updateOutcome(index, 'quantity', value)"
      />

      <button type="button" class="remove-btn" @click="removeOutcome(index)" title="Remove outcome">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="currentColor"
        >
          <path
            d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
          />
        </svg>
      </button>
    </div>

    <button
      v-if="outcomeRows.length < availableTokenCount"
      type="button"
      class="add-outcome-btn"
      @click="addOutcome"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="18px"
        viewBox="0 -960 960 960"
        width="18px"
        fill="currentColor"
      >
        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
      </svg>
      Add Outcome
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DropdownBase from './DropdownBase.vue'
import type { TokenType, TaskOutcomeType } from '@/types/common'

interface OutcomeRow {
  token_type: string
  quantity: number
}

const props = defineProps<{
  tokens: TokenType[]
  modelValue: TaskOutcomeType[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TaskOutcomeType[]): void
}>()

const availableTokenCount = computed(() => props.tokens.length)

const tokenOptions = computed(() =>
  props.tokens.map((token) => ({
    value: token.token_type,
    label: token.token_type.charAt(0).toUpperCase() + token.token_type.slice(1),
    icon: token.icon,
  })),
)

// Use ref instead of computed to avoid circular updates
const outcomeRows = ref<OutcomeRow[]>([])

// Initialize from props (one-time sync)
watch(
  () => props.modelValue,
  (newValue) => {
    outcomeRows.value = newValue.map((outcome) => ({
      token_type: outcome.token_type,
      quantity: parseInt(outcome.quantity, 10) || 1,
    }))
  },
  { immediate: true },
)

// Helper function to build and emit outcomes
function emitOutcomes() {
  // Merge duplicates
  const merged = new Map<string, number>()

  outcomeRows.value.forEach((row) => {
    if (row.token_type) {
      const current = merged.get(row.token_type) || 0
      const newQuantity = Math.min(current + row.quantity, 99)
      merged.set(row.token_type, newQuantity)
    }
  })

  // Convert back to TaskOutcomeType format
  const outcomes: TaskOutcomeType[] = Array.from(merged.entries()).map(([token_type, quantity]) => {
    const token = props.tokens.find((t) => t.token_type === token_type)
    return {
      token_type,
      quantity: quantity.toString(),
      icon_filename: token?.icon_filename || '',
      icon_color: token?.icon_color || '',
      icon: token?.icon,
    }
  })

  emit('update:modelValue', outcomes)
}

function addOutcome() {
  // Find first available token type not already selected
  const usedTokens = new Set(outcomeRows.value.map((r) => r.token_type).filter(Boolean))
  const availableToken = props.tokens.find((t) => !usedTokens.has(t.token_type))

  if (availableToken) {
    outcomeRows.value.push({ token_type: availableToken.token_type, quantity: 1 })
    emitOutcomes()
  }
}

function removeOutcome(index: number) {
  outcomeRows.value.splice(index, 1)
  emitOutcomes()
}

function updateOutcome(index: number, field: 'token_type' | 'quantity', value: string | number) {
  if (field === 'token_type') {
    // Check if this token type is already used in another row
    const existingIndex = outcomeRows.value.findIndex(
      (r, i) => r.token_type === value && i !== index,
    )

    if (existingIndex !== -1) {
      // Merge with existing row
      const existingQuantity = outcomeRows.value[existingIndex].quantity
      const newQuantity = outcomeRows.value[index].quantity
      const mergedQuantity = Math.min(existingQuantity + newQuantity, 99)

      outcomeRows.value[existingIndex] = {
        ...outcomeRows.value[existingIndex],
        quantity: mergedQuantity,
      }
      outcomeRows.value.splice(index, 1)
    } else {
      outcomeRows.value[index] = { ...outcomeRows.value[index], token_type: value as string }
    }
  } else {
    outcomeRows.value[index] = { ...outcomeRows.value[index], quantity: value as number }
  }

  emitOutcomes()
}
</script>

<style scoped>
.outcome-builder {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.outcome-label {
  font-size: 0.875em;
  font-weight: 600;
  color: #666;
}

.optional {
  font-weight: 400;
  color: #999;
  font-style: italic;
}

.no-outcomes {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-style: italic;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 2px dashed #e0e0e0;
}

.no-outcomes p {
  margin: 0;
}

.outcome-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #ffcdd2;
  transform: scale(1.05);
}

.remove-btn:active {
  transform: scale(0.95);
}

.add-outcome-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.625rem 1rem;
  border: 2px dashed #32a287;
  background: transparent;
  color: #32a287;
  border-radius: 8px;
  font-family: 'Trajan', 'Perpetua', serif;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.add-outcome-btn:hover {
  background: rgba(50, 162, 135, 0.1);
  border-style: solid;
}

.add-outcome-btn:active {
  transform: translateY(1px);
}

.max-outcomes {
  font-size: 0.85em;
  color: #999;
  text-align: center;
  margin: 0.5rem 0 0 0;
  font-style: italic;
}
</style>
