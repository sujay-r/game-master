<template>
  <div class="task-container">
    <input type="checkbox" class="task-checkbox">
    <h5>{{ task.title }}</h5>
    <div class="token-container">
      <p v-for="token in taskOutcomes" :key="token.tokenType" style="margin-right: 5px">{{ token.tokenType }}: {{
        token.quantity }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaskType } from '@/types/common';

// TODO: Add icons for task outcomes.
// TODO: Create a modal window for whenever a task gets clicked on.

const props = defineProps<{
  task: TaskType
}>();

const taskOutcomes = [
  {
    tokenType: "Care",
    quantity: 2
  },
  {
    tokenType: "Grind",
    quantity: 4
  }
]
</script>

<style scoped>
.task-container {
  position: relative;
  background: #F7F7F4;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1.5px 4px rgba(0, 0, 0, 0.06);
  padding: 1rem 1.25rem;
  margin: 0.75rem 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  min-height: 48px;
  transition: box-shadow 0.2s;
}

.task-container:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 3px 8px rgba(0, 0, 0, 0.10);
}

.token-container {
  position: absolute;
  right: 20px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.task-checkbox {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #bbb;
  border-radius: 4px;
  background: #fff;
  margin-right: 1rem;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  display: inline-block;
  vertical-align: middle;
  position: relative;
}

.task-checkbox:checked {
  background: #32A287;
  border-color: #4BAB91;
}

.task-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 0px;
  width: 6px;
  height: 12px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  pointer-events: none;
}
</style>
