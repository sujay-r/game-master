<template>
  <div v-if="taskData" class="task-container" @click="taskOpen = true">
    <input type="checkbox" class="task-checkbox" @click.self.stop>
    <p v-if="!isEditingTitle" class="task-title" @click.self.stop @click.self="editTitle">{{ taskData.title }}</p>
    <input v-else type="text" class='task-title' v-model="editedTitle" @click.self.stop @keyup.enter="saveTitle"
      @blur="cancelEditing" @keyup.esc="cancelEditing" ref="titleInput" />
    <div class="token-section">
      <div v-for="outcome in taskData.outcomes" :key="outcome.token_type" class="token-container">
        <span class="token-count-text" :style="`color: ${outcome.icon_color}`">{{ outcome.quantity }}</span> <span
          class="icon-container" v-html="outcome.icon"></span>
      </div>
    </div>
  </div>
  <Modal v-if="taskData" v-model="taskOpen" :include-close-button="false">
    <h2>{{ taskData.title }}</h2>
    <p>{{ taskData.description }}</p>
    <div class="metadata-pills">
      <DatePill color="#A9D5C7" :date="taskData.dueDate" fallback-text="Set due date" />
    </div>
    <LiveEditor v-model="taskData.notes" :text-box="true" placeholder="Add any notes for the task here..." />
  </Modal>
</template>

<script setup lang="ts">
import { onMounted, ref, toRaw, nextTick } from 'vue';
import Modal from './Modal.vue';
import LiveEditor from './LiveEditor.vue';
import DatePill from './DatePill.vue';
import type { TaskType, TaskOutcomeType } from '@/types/common';
import { fetchTokenIconSvg, updateTaskTitle } from '@/lib/supabase';
import { changeSvgColor, changeSvgSize } from '@/utils/svg';

// TODO: Fix issue where size of task component changes when inline editing is active.
// TODO: Create design for task pop-up modal.
// TODO: Create a modal window for whenever a task gets clicked on.

const props = defineProps<{
  task: TaskType
}>();

const taskData = ref<TaskType>();
const taskOpen = ref<boolean>(false);

const isEditingTitle = ref<boolean>(false);
const editedTitle = ref<string>('');
const titleInput = ref<HTMLInputElement | null>(null);

function editTitle() {
  isEditingTitle.value = true;
  editedTitle.value = taskData.value?.title || '';
  nextTick(() => {
    titleInput.value?.focus();
  })
}

async function saveTitle() {
  if (!taskData.value) return;
  const newTitle = editedTitle.value.trim();

  if (newTitle && newTitle !== taskData.value.title) {
    taskData.value.title = newTitle;
    if (taskData.value.id) {
      updateTaskTitle(taskData.value.id, newTitle);
    }
    else {
      console.error(`Task ID not found for ${taskData.value.title}. Can't update title.`)
    }
  }

  isEditingTitle.value = false;
}

function cancelEditing() {
  isEditingTitle.value = false;
}

onMounted(async () => {
  taskData.value = structuredClone(toRaw(props.task));
  if (taskData.value.outcomes) {
    // TODO: Figure out whether the Promise.all makes the task object not render until icons are
    // found.
    // await Promise.all(
    taskData.value.outcomes.map(async (taskOutcome: TaskOutcomeType) => {
      const svgText = await fetchTokenIconSvg(taskOutcome.icon_filename);
      const coloredSvg = changeSvgColor(svgText, taskOutcome.icon_color);
      const finalSvg = changeSvgSize(coloredSvg, 15);

      taskOutcome.icon = finalSvg;
    })
    // );
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
  font-family: Trajan;
  font-weight: bold;
  font-size: 1em;
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
  font-size: 1.25em;
  font-weight: bold;
}

.icon-container {
  display: contents;
  margin: 0;
  padding: 0;
}

.metadata-pills {
  margin-bottom: 0.5em;
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
