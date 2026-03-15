<template>
  <span class="pill" :style="{ backgroundColor: color }">
    {{ text }}
    <span class="pill-close" @click="deletePill">&times;</span>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  text: string
  color?: string
}>();

const emits = defineEmits<{
  (e: 'delete', value: boolean): void

}>();

const deletePill = () => {
  emits('delete', true);
}
</script>

<style scoped>
.pill {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0.25em 1em;
  max-height: 1.1em;
  font-size: 0.95em;
  background: #e0e0e0;
  color: #424242;
  border: none;
  border-radius: 25px;
  user-select: none;
}

.pill-close {
  margin-left: 0.3em;
  cursor: pointer;
  font-weight: bold;
  color: #888;
  transition: color 0.2s;
}

.pill-close:hover {
  color: #DC143C;
}

.pill-close:active {
  color: #B11B32;
}
</style>
