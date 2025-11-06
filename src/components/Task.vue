<template>
  <div class="task-container" @click="taskOpen = true">
    <input type="checkbox" class="task-checkbox" @click.self.stop>
    <h4 class="task-title">{{ task.title }}</h4>
    <div class="token-section">
      <div v-for="outcome in task.outcomes" :key="outcome.token_type" class="token-container">
        <span class="token-count-text" :style="`color: ${outcome.icon_color}`">{{ outcome.quantity }}</span> <span
          class="icon-container" v-html="outcome.icon"></span>
      </div>
    </div>
  </div>
  <Modal v-model="taskOpen" :include-close-button="true">
    <h2>{{ task.title }}</h2>
    <p>{{ task.description }}</p>
  </Modal>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Modal from './Modal.vue';
import type { TaskType, TaskOutcomeType } from '@/types/common';
import { getTokenIconSvg } from '@/lib/supabase';
import { changeSvgColor, changeSvgSize } from '@/utils/svg';

// TODO: Create design for task pop-up modal.
// TODO: Create a modal window for whenever a task gets clicked on.

const props = defineProps<{
  task: TaskType
}>();

const taskOpen = ref<boolean>(false);

onMounted(async () => {
  if (props.task.outcomes) {
    await Promise.all(
      props.task.outcomes.map(async (taskOutcome: TaskOutcomeType) => {
        const svgText = await getTokenIconSvg(taskOutcome.icon_filename);
        const coloredSvg = changeSvgColor(svgText, taskOutcome.icon_color);
        const finalSvg = changeSvgSize(coloredSvg, 15);

        taskOutcome.icon = finalSvg;
      })
    );
  }
})

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
  cursor: pointer;
}

.task-container:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 3px 8px rgba(0, 0, 0, 0.10);
}

.task-title {
  cursor: text;
}

.token-section {
  position: absolute;
  right: 20px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.token-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0.1em;
}

.token-count-text {
  display: contents;
  font-size: 1.3em;
  font-weight: bold;
}

.icon-container {
  display: contents;
  margin: 0;
  padding: 0;
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
