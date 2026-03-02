<template>
  <Modal v-model="isOpen" :include-close-button="true">
    <div v-if="questData" class="quest-detail-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="quest-title">{{ questData.title }}</h2>
      </div>

      <!-- Metadata Pills -->
      <div class="metadata-pills">
        <span class="pill" :class="questData.type">{{ typeLabel }} Quest</span>
        <span class="pill progress">{{ progress.completed }}/{{ progress.total }} Tasks</span>
        <span class="pill status" :class="questData.status">{{ statusLabel }}</span>
      </div>

      <!-- Description Section -->
      <div class="section">
        <label class="section-label">Description</label>
        <div class="description-container" @click="editDescription">
          <p
            v-if="!isEditingDescription"
            class="description-text"
            :class="{ placeholder: !questData.description }"
          >
            {{ questData.description || 'Add a quest description...' }}
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
            placeholder="Add a quest description..."
          ></textarea>
          <span class="edit-icon" v-if="!isEditingDescription && !isCompleted">
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
      </div>

      <!-- Notes Section -->
      <div class="section">
        <label class="section-label">Notes</label>
        <LiveEditor
          v-model="notesModel"
          :text-box="true"
          placeholder="Add quest notes here..."
          :disabled="isCompleted"
        />
        <div v-if="hasUnsavedChanges && !isCompleted" class="unsaved-warning">
          You have unsaved changes
        </div>
        <button v-if="hasUnsavedChanges && !isCompleted" class="save-button" @click="saveNotes">
          Save
        </button>
      </div>

      <!-- Tasks Section -->
      <div class="section">
        <label class="section-label">Tasks</label>

        <!-- Active Tasks -->
        <div v-if="activeTasks.length > 0" class="task-list">
          <div v-for="task in activeTasks" :key="task.id" class="task-item" @click="openTask(task)">
            <input type="checkbox" class="task-checkbox" disabled />
            <span class="task-title">{{ task.title }}</span>
          </div>
        </div>

        <div v-else-if="completedTasks.length === 0" class="empty-tasks">
          No tasks in this quest yet
        </div>

        <!-- Completed Tasks Toggle -->
        <div
          v-if="completedTasks.length > 0"
          class="completed-tasks-toggle"
          @click="showCompleted = !showCompleted"
        >
          <span class="toggle-icon">{{ showCompleted ? '▼' : '▶' }}</span>
          <span
            >{{ completedTasks.length }} completed task{{
              completedTasks.length === 1 ? '' : 's'
            }}</span
          >
        </div>

        <!-- Completed Tasks List -->
        <div v-if="showCompleted" class="completed-tasks-list">
          <div
            v-for="task in completedTasks"
            :key="task.id"
            class="task-item completed"
            @click="openTask(task)"
          >
            <input type="checkbox" class="task-checkbox" checked disabled />
            <span class="task-title">{{ task.title }}</span>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted, toRaw } from 'vue'
import Modal from './Modal.vue'
import LiveEditor from './LiveEditor.vue'
import type { Quest, QuestType, TaskType } from '@/types/common'
import { QuestStatus, TaskStatus } from '@/types/common'
import { updateQuestDescription } from '@/lib/supabase'

const props = defineProps<{
  modelValue: boolean
  quest: Quest | null
  tasks: TaskType[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save-notes', data: { questId: number; notes: string }): void
  (e: 'open-task', task: TaskType): void
  (e: 'save-description', data: { questId: number; description: string }): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const questData = ref<Quest | null>(null)
const originalNotes = ref<string>('')

const isEditingDescription = ref(false)
const editedDescription = ref('')
const descriptionInput = ref<HTMLTextAreaElement | null>(null)

const showCompleted = ref(false)

const typeLabels: Record<QuestType, string> = {
  main: 'Main',
  side: 'Side',
  lifeAdmin: 'Life Admin',
}

const statusLabels: Record<QuestStatus, string> = {
  [QuestStatus.Active]: 'Active',
  [QuestStatus.Completed]: 'Completed',
  [QuestStatus.Todo]: 'Todo',
}

const typeLabel = computed(() => {
  if (!questData.value) return ''
  return typeLabels[questData.value.type]
})

const statusLabel = computed(() => {
  if (!questData.value) return ''
  return statusLabels[questData.value.status]
})

const isCompleted = computed(() => {
  return questData.value?.status === QuestStatus.Completed
})

const notesModel = computed({
  get: () => questData.value?.notes ?? '',
  set: (value) => {
    if (questData.value) {
      questData.value.notes = value || undefined
    }
  },
})

const progress = computed(() => {
  const total = props.tasks.length
  const completed = props.tasks.filter((t) => t.status === TaskStatus.Done).length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percentage }
})

const activeTasks = computed(() => {
  return props.tasks.filter((t) => t.status !== TaskStatus.Done)
})

const completedTasks = computed(() => {
  return props.tasks.filter((t) => t.status === TaskStatus.Done)
})

const hasUnsavedChanges = computed(() => {
  return questData.value !== null && (questData.value.notes ?? '') !== originalNotes.value
})

function editDescription() {
  if (isCompleted.value || !questData.value) return
  isEditingDescription.value = true
  editedDescription.value = questData.value.description || ''
  nextTick(() => {
    descriptionInput.value?.focus()
  })
}

async function saveDescription() {
  if (!questData.value) return

  const newDescription = editedDescription.value.trim()

  if (newDescription !== questData.value.description) {
    questData.value.description = newDescription
    if (questData.value.id) {
      await updateQuestDescription(questData.value.id, newDescription)
      emit('save-description', {
        questId: questData.value.id,
        description: newDescription,
      })
    }
  }

  isEditingDescription.value = false
}

function cancelDescriptionEditing() {
  isEditingDescription.value = false
}

function saveNotes() {
  if (!questData.value?.id) return

  const notesToSave = questData.value.notes ?? ''
  emit('save-notes', {
    questId: questData.value.id,
    notes: notesToSave,
  })

  originalNotes.value = notesToSave
}

function openTask(task: TaskType) {
  emit('open-task', task)
}

function close() {
  emit('update:modelValue', false)
}

function discardChanges() {
  if (questData.value) {
    questData.value.notes = originalNotes.value || undefined
  }
}

watch(isOpen, (isOpen) => {
  if (!isOpen && hasUnsavedChanges.value) {
    discardChanges()
  }
})

watch(
  () => props.quest,
  (newQuest) => {
    if (newQuest) {
      questData.value = structuredClone(toRaw(newQuest))
      originalNotes.value = questData.value.notes || ''
      questData.value.notes = originalNotes.value
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (props.quest) {
    questData.value = structuredClone(toRaw(props.quest))
    originalNotes.value = questData.value.notes || ''
    questData.value.notes = originalNotes.value
  }
})
</script>

<style scoped>
.quest-detail-modal {
  width: 780px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.quest-title {
  font-family: Trajan;
  font-size: 1.5em;
  font-weight: bold;
  margin: 0;
  color: #424242;
  text-align: center;
}

.quest-type-badge {
  font-size: 0.8em;
  font-weight: 600;
  padding: 0.4em 0.8em;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quest-type-badge.main {
  background: #c9a227;
  color: #fff;
}

.quest-type-badge.side {
  background: #6b8cae;
  color: #fff;
}

.metadata-pills {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.pill {
  font-size: 0.875em;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.pill.main {
  background: #c9a227;
  color: #fff;
}

.pill.side {
  background: #6b8cae;
  color: #fff;
}

.pill.lifeAdmin {
  background: #20b2aa;
  color: #fff;
}

.pill.progress {
  background: rgba(0, 0, 0, 0.05);
  color: #424242;
}

.pill.status.active,
.pill.status.todo {
  background: #32a287;
  color: #fff;
}

.pill.status.completed {
  background: #4caf50;
  color: #fff;
}

.section {
  margin-bottom: 1.5rem;
}

.section-label {
  display: block;
  font-weight: 600;
  color: #424242;
  font-size: 0.95em;
  margin-bottom: 0.5rem;
}

.description-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  transition: background 0.15s;
}

.description-container:hover {
  background: rgba(0, 0, 0, 0.04);
}

.description-text {
  flex: 1;
  margin: 0;
  line-height: 1.5;
  color: #424242;
}

.description-text.placeholder {
  color: #929292;
  font-style: italic;
}

.description-textarea {
  flex: 1;
  width: 100%;
  padding: 0;
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

.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f7f7f4;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.task-item:hover {
  background: #e8e8e8;
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-title {
  text-decoration: line-through;
}

.task-checkbox {
  width: 16px;
  height: 16px;
  cursor: default;
  accent-color: #32a287;
}

.task-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-tasks {
  padding: 2rem;
  text-align: center;
  color: #999;
  font-style: italic;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.completed-tasks-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9em;
  color: #666;
  transition: background 0.15s;
}

.completed-tasks-toggle:hover {
  background: rgba(0, 0, 0, 0.08);
}

.toggle-icon {
  font-size: 0.8em;
}

.completed-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.unsaved-warning {
  color: #dc143c;
  font-size: 0.875em;
  margin: 0.5rem 0;
}

.save-button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #32a287;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-button:hover {
  background-color: #4bab91;
}

.save-button:active {
  background-color: #2d826d;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.close-button {
  padding: 0.625rem 1.25rem;
  background: #e8e8e8;
  color: #424242;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.close-button:hover {
  background: #d8d8d8;
  transform: translateY(-1px);
}

.close-button:active {
  transform: translateY(0);
}
</style>
