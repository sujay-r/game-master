<template>
  <div v-if="taskData" class="task-container" :class="taskStatusClass" @click="taskOpen = true">
    <input
      type="checkbox"
      class="task-checkbox"
      v-model="isCompleted"
      @click.self.stop
      :disabled="isCompleted"
    />
    <p
      v-if="!isEditingTitle"
      class="task-title"
      :class="{
        'task-completed-text': taskData.status === TaskStatus.Done,
      }"
      @click.self.stop
      @click.self="editTitle"
    >
      {{ taskData.title }}
    </p>
    <input
      v-else
      type="text"
      class="task-title"
      v-model="editedTitle"
      @click.self.stop
      @keyup.enter="saveTitle"
      @blur="cancelEditing"
      @keyup.esc="cancelEditing"
      ref="titleInput"
    />
    <div class="token-section">
      <div v-for="outcome in taskData.outcomes" :key="outcome.token_type" class="token-container">
        <span class="token-count-text" :style="`color: ${outcome.icon_color}`">{{
          outcome.quantity
        }}</span>
        <span class="icon-container" v-html="outcome.icon"></span>
      </div>
    </div>
  </div>
  <Modal v-if="taskData" v-model="taskOpen" :include-close-button="false">
    <h2>{{ taskData.title }}</h2>
    <div class="description-container" @click="editDescription">
      <p
        v-if="!isEditingDescription"
        class="task-description"
        :class="{ placeholder: !taskData.description }"
      >
        {{ taskData.description || 'Add a task description...' }}
      </p>
      <textarea
        v-else
        v-model="editedDescription"
        @blur="saveDescription"
        @keydown.enter.prevent="saveDescription"
        @keydown.esc="cancelDescriptionEditing"
        ref="descriptionInput"
        class="description-textarea"
        rows="3"
        placeholder="Add a task description..."
      ></textarea>
      <span class="edit-icon" v-if="!isEditingDescription">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="18px"
          viewBox="0 -960 960 960"
          width="18px"
          fill="#929292"
        >
          <path
            d="M120-120v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm584-528 56-56-56-56-56 56 56 56Z"
          />
        </svg>
      </span>
    </div>
    <div class="metadata-pills">
      <DatePill
        color="#A9D5C7"
        :date="taskData.dueDate ?? null"
        fallback-text="Set due date"
        :disabled="isCompleted"
        @update:date="onDueDateChanged"
      />
    </div>
    <LiveEditor
      v-model="taskData.notes"
      :text-box="true"
      placeholder="Add any notes for the task here..."
      :disabled="isCompleted"
    />
    <div v-if="hasUnsavedChanges && !isCompleted" class="unsaved-warning">
      You have unsaved changes
    </div>
    <button v-if="hasUnsavedChanges && !isCompleted" class="save-button" @click="saveNotes">
      Save
    </button>
  </Modal>
</template>

<script setup lang="ts">
import { onMounted, ref, toRaw, nextTick, computed, watch } from 'vue'
import Modal from './Modal.vue'
import LiveEditor from './LiveEditor.vue'
import DatePill from './DatePill.vue'
import { type TaskType, type TaskOutcomeType, TaskStatus } from '@/types/common'
import { useIconStore } from '@/stores/resources'
import {
  updateTaskDueDate,
  updateTaskTitle,
  updateTaskNotes,
  updateTaskDescription,
  markTaskDone,
} from '@/lib/supabase'

// TODO: Fix issue where size of task component changes when inline editing is active.
// TODO: Create design for task pop-up modal.
// TODO: Create a modal window for whenever a task gets clicked on.

const props = defineProps<{
  task: TaskType
}>()

const taskData = ref<TaskType>()
const originalNotes = ref<string>('')
const taskOpen = ref<boolean>(false)
const isCompleted = ref<boolean>(false)

const isEditingTitle = ref<boolean>(false)
const editedTitle = ref<string>('')
const titleInput = ref<HTMLInputElement | null>(null)

const isEditingDescription = ref<boolean>(false)
const editedDescription = ref<string>('')
const descriptionInput = ref<HTMLTextAreaElement | null>(null)

const icons = useIconStore()

watch(isCompleted, async (newVal) => {
  if (taskData.value) {
    if (!(taskData.value.status === TaskStatus.Done)) {
      taskData.value.status = newVal ? TaskStatus.Done : TaskStatus.Todo

      if (taskData.value.id) {
        await markTaskDone(taskData.value)
      } else {
        console.error('Cannot update task because id not found.')
      }
    } else {
      console.warn('Task already marked complete. Cannot undo it now.')
    }
  }
})

const taskStatusClass = computed(() => {
  if (!taskData.value) return ''
  switch (taskData.value.status) {
    case TaskStatus.Done:
      return 'task-completed'
    default:
      return ''
  }
})

const hasUnsavedChanges = computed(() => {
  return taskData.value !== undefined && taskData.value.notes !== originalNotes.value
})

function onDueDateChanged(newDate: Date | null) {
  if (newDate) {
    if (taskData.value) {
      taskData.value.dueDate = newDate
      if (taskData.value.id) {
        updateTaskDueDate(taskData.value.id, newDate.toLocaleDateString('en-CA'))
      }
    }
  }
}

function editTitle() {
  if (isCompleted.value) return
  isEditingTitle.value = true
  editedTitle.value = taskData.value?.title || ''
  nextTick(() => {
    titleInput.value?.focus()
  })
}

async function saveTitle() {
  if (!taskData.value) return
  const newTitle = editedTitle.value.trim()

  if (newTitle && newTitle !== taskData.value.title) {
    taskData.value.title = newTitle
    if (taskData.value.id) {
      updateTaskTitle(taskData.value.id, newTitle)
    } else {
      console.error(`Task ID not found for ${taskData.value.title}. Can't update title.`)
    }
  }

  isEditingTitle.value = false
}

function cancelEditing() {
  isEditingTitle.value = false
}

function editDescription() {
  if (isCompleted.value) return
  isEditingDescription.value = true
  editedDescription.value = taskData.value?.description || ''
  nextTick(() => {
    descriptionInput.value?.focus()
  })
}

async function saveDescription() {
  if (!taskData.value) return

  const newDescription = editedDescription.value.trim()

  if (newDescription !== taskData.value.description) {
    taskData.value.description = newDescription
    if (taskData.value.id) {
      updateTaskDescription(taskData.value.id, newDescription)
    } else {
      console.error(`Task ID not found for ${taskData.value.title}. Can't update description.`)
    }
  }

  isEditingDescription.value = false
}

function cancelDescriptionEditing() {
  isEditingDescription.value = false
}

async function saveNotes() {
  if (!taskData.value?.id) {
    console.error('Cannot save notes - task ID not found')
    return
  }

  try {
    await updateTaskNotes(taskData.value.id, taskData.value.notes)
    originalNotes.value = taskData.value.notes
  } catch (err) {
    console.error('Error saving notes:', err)
  }
}

function discardChanges() {
  if (taskData.value) {
    taskData.value.notes = originalNotes.value
  }
}

watch(taskOpen, (isOpen) => {
  if (!isOpen && hasUnsavedChanges.value) {
    discardChanges()
  }
})

onMounted(async () => {
  taskData.value = structuredClone(toRaw(props.task))
  originalNotes.value = taskData.value.notes || ''
  taskData.value.notes = originalNotes.value
  isCompleted.value = taskData.value.status === TaskStatus.Done
  if (taskData.value.outcomes) {
    // TODO: Figure out whether the Promise.all makes the task object not render until icons are
    // found.
    // await Promise.all(
    taskData.value.outcomes.map(async (taskOutcome: TaskOutcomeType) => {
      taskOutcome.icon = await icons.getIcon(taskOutcome.icon_filename, taskOutcome.icon_color, 15)
    })
    // );
  }
})
</script>

<style scoped>
.task-container {
  position: relative;
  background: #f7f7f4;
  border-radius: 12px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1.5px 4px rgba(0, 0, 0, 0.06);
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
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.1);
}

.task-completed {
  opacity: 0.6;
}

.task-completed-text {
  text-decoration: line-through;
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
  transition:
    border-color 0.2s,
    background 0.2s;
  display: inline-block;
  vertical-align: middle;
  position: relative;
}

.task-checkbox:checked {
  background: #32a287;
  border-color: #4bab91;
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

.task-checkbox:disabled {
  cursor: default;
  opacity: 0.7;
}

.unsaved-warning {
  color: #dc143c;
  font-size: 0.875em;
  margin: 0.5em 0;
}

.save-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #32a287;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.save-button:hover {
  background-color: #4bab91;
}

.save-button:active {
  background-color: #2d826d;
}

.description-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
}

.task-description {
  flex: 1;
  margin: 0;
  line-height: 1.5;
  color: #424242;
}

.task-description.placeholder {
  color: #929292;
  font-style: italic;
}

.edit-icon {
  display: flex;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.description-container:hover .edit-icon {
  opacity: 1;
}

.edit-icon svg {
  transition: fill 0.2s;
}

.description-container:hover .edit-icon svg {
  fill: #424242;
}

.description-textarea {
  flex: 1;
  width: 100%;
  padding: 8px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.5;
  resize: none;
  outline: none;
  color: #424242;
}

.description-textarea::placeholder {
  color: #929292;
  font-style: italic;
}

.description-textarea:focus {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 0 0 1.5px #4bab91;
}
</style>
