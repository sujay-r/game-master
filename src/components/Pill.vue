<template>
  <span class="pill" :style="{ backgroundColor: color }">{{ text }}</span>
</template>

<script setup lang="ts">
// TODO: Add a close button to delete pill.

const props = defineProps<{
  text: string
  color?: string
}>()
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
</style>
