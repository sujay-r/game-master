<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="modal-close" @click="close">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
          <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
        </svg>
      </button>
      <slot />
      <button v-if="props.includeCloseButton" class="modal-button" @click="close">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean,
  includeCloseButton: boolean
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
  padding: 2rem 3.5rem;
  border-radius: 12px;
  min-width: 300px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.modal-close>svg {
  height: 20px;
  width: 20px;
  fill: #929292;
}


.modal-close:hover {
  background: #f2dede;
  box-shadow: 0 4px 12px rgba(192, 57, 43, 0.12);
}

.modal-close:active {
  background: #D9C8C8;
}

.modal-close>svg:hover {
  fill: #DC143C;
}

.modal-close>svg:active {
  fill: #B11B32
}

.modal-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #32A287;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.modal-button:hover {
  background-color: #4BAB91;
}

.modal-button:active {
  background-color: #2D826D;
}
</style>
