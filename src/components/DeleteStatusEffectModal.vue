<template>
  <Modal :model-value="visible" :include-close-button="false" @update:model-value="close">
    <div class="delete-effect-container">
      <HeadingFleur heading-text="Delete Status Effect" heading-size="1.6em" :clean="false" />
      <div class="confirmation-message">
        <p>Are you sure you want to delete:</p>
        <p class="effect-name" :class="{ buff: isBuff, debuff: !isBuff }">
          {{ effectText }}
        </p>
      </div>
      <div class="button-row">
        <button class="action-button cancel" @click="close">Cancel</button>
        <button class="action-button delete" @click="confirmDelete">Delete</button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from './Modal.vue'
import HeadingFleur from './HeadingFleur.vue'

const props = defineProps<{
  modelValue: boolean
  effectText: string
  isBuff: boolean
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()

const visible = ref(props.modelValue)

const effectSign = computed(() => {
  return props.isBuff ? '+' : '-'
})

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
  },
)

function close() {
  emits('update:modelValue', false)
}

function confirmDelete() {
  emits('confirm')
  close()
}
</script>

<style scoped>
.delete-effect-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 280px;
  max-width: 350px;
}

.confirmation-message {
  text-align: center;
  margin: 1.5rem 0;
}

.confirmation-message p {
  margin: 0.5rem 0;
  color: #424242;
  font-size: 1.1em;
}

.effect-name {
  font-size: 1.3em;
  font-weight: 600;
  font-style: italic;
  margin-top: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
}

.buff {
  color: #43a047;
}

.debuff {
  color: #e53935;
}

.button-row {
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: center;
  margin-top: 0.5rem;
}

.action-button {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-family: 'Perpetua', serif;
  font-size: 0.95em;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.1s;
  min-width: auto;
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

.action-button.delete {
  background: #e53935;
  color: #fff;
}

.action-button.delete:hover {
  background: #c62828;
}

.action-button.delete:active {
  background: #b71c1c;
  transform: scale(0.98);
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .delete-effect-container {
    min-width: auto;
    width: 100%;
  }

  .confirmation-message {
    margin: 1rem 0;
  }

  .confirmation-message p {
    font-size: 1em;
  }

  .effect-name {
    font-size: 1.15em;
    padding: 0.625rem 1rem;
  }

  .action-button {
    padding: 0.25rem 0.625rem;
    font-size: 0.9em;
    min-width: auto;
  }
}
</style>
