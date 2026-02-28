<template>
  <button class="quick-add-button" @click="handleClick" aria-label="Add new task">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="currentColor"
    >
      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'click'): void
}>()

function handleClick() {
  emit('click')
}
</script>

<style scoped>
.quick-add-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #32a287;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1);
  transition:
    background-color 0.2s,
    transform 0.1s,
    box-shadow 0.2s;
  z-index: 100;
}

.quick-add-button:hover {
  background: #2d826d;
  transform: translateY(-2px);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.2),
    0 3px 6px rgba(0, 0, 0, 0.12);
}

.quick-add-button:active {
  transform: translateY(0);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.12),
    0 1px 3px rgba(0, 0, 0, 0.08);
}

.quick-add-button:focus {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(50, 162, 135, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
