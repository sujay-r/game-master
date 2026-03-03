<template>
  <Modal v-model="isOpen" :include-close-button="false" @close="cancel">
    <div class="complete-modal-content">
      <div class="success-icon">
        <!-- TODO: Move to icons store -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="48px"
          viewBox="0 -960 960 960"
          width="48px"
          fill="#32a287"
        >
          <path
            d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Zm-86 166 226-226-57-57-169 169-85-85-57 57 142 142Z"
          />
        </svg>
      </div>

      <h2 class="modal-title">Complete "{{ questTitle }}"?</h2>

      <p class="confirmation-text">
        This will mark the quest as completed and hide it from your active quests.
      </p>

      <div class="action-buttons">
        <button class="button complete" @click="confirm">
          <!-- TODO: Move to icons store -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="currentColor"
          >
            <path
              d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Zm-86 166 226-226-57-57-169 169-85-85-57 57 142 142Z"
            />
          </svg>
          Complete Quest
        </button>

        <button class="button cancel" @click="cancel">Cancel</button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Modal from './Modal.vue'

const props = defineProps<{
  modelValue: boolean
  questTitle: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function confirm() {
  emit('confirm')
  close()
}

function cancel() {
  emit('cancel')
  close()
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.complete-modal-content {
  text-align: center;
  padding: 0.5rem;
}

.success-icon {
  margin-bottom: 1rem;
}

.modal-title {
  font-family: Trajan;
  font-size: 1.5em;
  font-weight: bold;
  margin: 0 0 1rem 0;
  color: #424242;
}

.confirmation-text {
  font-size: 1.1em;
  color: #424242;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.button:hover {
  transform: translateY(-1px);
}

.button:active {
  transform: translateY(0);
}

.button.complete {
  background: #32a287;
  color: #fff;
}

.button.complete:hover {
  background: #2d826d;
}

.button.cancel {
  background: #e8e8e8;
  color: #424242;
}

.button.cancel:hover {
  background: #d8d8d8;
}
</style>
