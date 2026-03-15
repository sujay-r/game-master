<template>
  <Modal :model-value="visible" :include-close-button="false" @update:model-value="close">
    <div class="edit-stat-container">
      <HeadingFleur :heading-text="title" heading-size="1.8em" :clean="false" />
      <div class="input-section">
        <label for="statValue" class="input-label">New Value:</label>
        <div class="value-input-wrapper">
          <button class="adjust-button minus" @click="decrementValue" type="button">−</button>
          <input
            type="number"
            id="statValue"
            v-model.number="localValue"
            class="stat-value-input"
            min="0"
            max="100"
            @keydown.enter="save"
          />
          <button class="adjust-button plus" @click="incrementValue" type="button">+</button>
        </div>
        <div class="value-hint">Range: 0-100</div>
      </div>
      <div class="button-row">
        <button class="action-button cancel" @click="close">Cancel</button>
        <button class="action-button save" @click="save">Save</button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/base/Modal.vue'
import HeadingFleur from '@/components/base/HeadingFleur.vue'

const props = defineProps<{
  modelValue: boolean
  statName: string
  currentValue: number
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: number): void
}>()

const visible = ref(props.modelValue)
const localValue = ref(props.currentValue)

const title = `Edit ${props.statName}`

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      localValue.value = props.currentValue
    }
  },
)

watch(
  () => props.currentValue,
  (val) => {
    if (visible.value) {
      localValue.value = val
    }
  },
)

function incrementValue() {
  if (localValue.value < 100) {
    localValue.value++
  }
}

function decrementValue() {
  if (localValue.value > 0) {
    localValue.value--
  }
}

function close() {
  emits('update:modelValue', false)
}

function save() {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, localValue.value))
  emits('save', clampedValue)
  close()
}
</script>

<style scoped>
.edit-stat-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 280px;
}

.input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin: 1.5rem 0;
  width: 100%;
}

.input-label {
  font-family: 'Perpetua', serif;
  font-size: 1.1em;
  color: #424242;
}

.value-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.adjust-button {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  font-size: 1.5em;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.2s,
    transform 0.1s;
  user-select: none;
}

.adjust-button.minus {
  background: #f5f5f5;
  color: #e53935;
}

.adjust-button.minus:hover {
  background: #ffebee;
}

.adjust-button.minus:active {
  background: #ffcdd2;
  transform: scale(0.95);
}

.adjust-button.plus {
  background: #f5f5f5;
  color: #43a047;
}

.adjust-button.plus:hover {
  background: #e8f5e9;
}

.adjust-button.plus:active {
  background: #c8e6c9;
  transform: scale(0.95);
}

.stat-value-input {
  width: 80px;
  height: 48px;
  text-align: center;
  font-size: 1.5em;
  font-family: 'Perpetua', serif;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}

.stat-value-input:focus {
  border-color: #32a287;
}

/* Remove number input spinners */
.stat-value-input::-webkit-outer-spin-button,
.stat-value-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.stat-value-input[type='number'] {
  -moz-appearance: textfield;
}

.value-hint {
  font-size: 0.85em;
  color: #888;
  font-style: italic;
}

.button-row {
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: center;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-family: 'Perpetua', serif;
  font-size: 1.1em;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.1s;
  min-width: 100px;
}

.action-button.cancel {
  background: #f5f5f5;
  color: #424242;
}

.action-button.cancel:hover {
  background: #e0e0e0;
}

.action-button.cancel:active {
  background: #d0d0d0;
  transform: scale(0.98);
}

.action-button.save {
  background: #32a287;
  color: #fff;
}

.action-button.save:hover {
  background: #2d826d;
}

.action-button.save:active {
  background: #247a66;
  transform: scale(0.98);
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .edit-stat-container {
    min-width: auto;
    width: 100%;
  }

  .input-section {
    margin: 1rem 0;
    gap: 0.5rem;
  }

  .adjust-button {
    width: 40px;
    height: 40px;
    font-size: 1.25em;
  }

  .stat-value-input {
    width: 70px;
    height: 44px;
    font-size: 1.25em;
  }

  .action-button {
    padding: 0.625rem 1.25rem;
    font-size: 1em;
    min-width: 90px;
  }
}
</style>
