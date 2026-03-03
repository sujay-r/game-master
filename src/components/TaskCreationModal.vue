<template>
  <Modal v-model="visible" :include-close-button="false">
    <div class="task-creation-modal">
      <h2 class="modal-title">Create New Task</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="task-title" class="form-label">Title <span class="required">*</span></label>
          <input
            id="task-title"
            v-model="formData.title"
            type="text"
            class="form-input"
            placeholder="Enter task title"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <LiveEditor
            v-model="formData.description"
            :text-box="true"
            placeholder="Task description..."
          />
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <LiveEditor v-model="formData.notes" :text-box="true" placeholder="Additional notes..." />
        </div>

        <div class="form-row">
          <div class="form-group half">
            <label for="task-due-date" class="form-label">Due Date</label>
            <input
              id="task-due-date"
              v-model="formData.dueDate"
              type="date"
              class="form-input date-input"
            />
          </div>

          <div class="form-group half">
            <TaskAssignmentDropdown
              v-model="formData.questId"
              :quests="quests"
              label="Assign to Quest"
            />
          </div>
        </div>

        <div class="form-group">
          <OutcomeBuilder v-model="formData.outcomes" :tokens="tokenStore.tokens" />
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="handleCancel">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="!formData.title.trim()">
            Create Task
          </button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, defineAsyncComponent } from 'vue'
import Modal from './Modal.vue'
const LiveEditor = defineAsyncComponent(() => import('./LiveEditor.vue'))
import TaskAssignmentDropdown from './TaskAssignmentDropdown.vue'
import OutcomeBuilder from './OutcomeBuilder.vue'
import type { Quest, TaskStatus, TaskOutcomeType } from '@/types/common'
import { useTokenStore } from '@/stores/resources'
import { stripHtml } from '@/utils/html'

interface FormData {
  title: string
  description: string
  notes: string
  dueDate: string
  questId: number | null
  outcomes: TaskOutcomeType[]
}

const props = defineProps<{
  modelValue: boolean
  quests: Quest[]
  initialQuestId?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'created',
    taskData: {
      title: string
      description: string
      notes: string
      status: TaskStatus
      dueDate: Date | null
      questId?: number
      outcomes?: TaskOutcomeType[]
    },
  ): void
  (e: 'cancelled'): void
}>()

const visible = ref(props.modelValue)
const tokenStore = useTokenStore()

const defaultFormData: FormData = {
  title: '',
  description: '',
  notes: '',
  dueDate: '',
  questId: null,
  outcomes: [],
}

const formData = ref<FormData>({ ...defaultFormData })

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      // Reset form and set initial quest if provided
      formData.value = {
        ...defaultFormData,
        questId: props.initialQuestId ?? null,
        outcomes: [],
      }
    }
  },
)

watch(
  () => visible.value,
  (val) => {
    emit('update:modelValue', val)
  },
)

function handleCancel() {
  visible.value = false
  emit('cancelled')
}

function handleSubmit() {
  if (!formData.value.title.trim()) return

  const taskData = {
    title: formData.value.title.trim(),
    description: stripHtml(formData.value.description),
    notes: formData.value.notes,
    status: 'TODO' as TaskStatus,
    dueDate: formData.value.dueDate ? new Date(formData.value.dueDate) : null,
    questId: formData.value.questId ?? undefined,
    outcomes: formData.value.outcomes.length > 0 ? formData.value.outcomes : undefined,
  }

  emit('created', taskData)
  visible.value = false
}
</script>

<style scoped>
.task-creation-modal {
  min-width: 500px;
  max-width: 600px;
  max-height: 85vh;
  overflow-y: auto;
  padding-right: 18px;
}

/* Custom scrollbar styling */
.task-creation-modal::-webkit-scrollbar {
  width: 6px;
}

.task-creation-modal::-webkit-scrollbar-track {
  background: transparent;
}

.task-creation-modal::-webkit-scrollbar-thumb {
  background: #c7c7c7;
  border-radius: 3px;
}

.task-creation-modal::-webkit-scrollbar-thumb:hover {
  background: #a7a7a7;
}

.modal-title {
  font-family: 'Trajan', 'Perpetua', serif;
  font-size: 1.5em;
  color: #424242;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e0e0e0;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.form-group.half {
  flex: 1;
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.875em;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
}

.required {
  color: #c62828;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  font-family: inherit;
  color: #424242;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #32a287;
  box-shadow: 0 0 0 3px rgba(50, 162, 135, 0.1);
}

.form-input::placeholder {
  color: #999;
}

.date-input {
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95em;
  font-family: 'Trajan', 'Perpetua', serif;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.btn-primary {
  background: #32a287;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #2d826d;
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: #a8d5c9;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e8e8e8;
  color: #424242;
}

.btn-secondary:hover {
  background: #d8d8d8;
  transform: translateY(-1px);
}

.btn-secondary:active {
  transform: translateY(0);
}
</style>
