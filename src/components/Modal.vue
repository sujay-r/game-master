<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <slot />
      <button class="modal-close" @click="close">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, (val) => {
  visible.value = val;
})

function close() {
  emits("update:modelValue", false);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  min-width: 300px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  position: relative;
}

.modal-close {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #32A287;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.modal-close:hover {
  background-color: #4BAB91;
}

.modal-close:active {
  background-color: #2D826D;
}
</style>
