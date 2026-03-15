<template>
  <Modal v-model="isOpen" :include-close-button="false" @close="cancel">
    <h2 class="modal-title">{{ isEditing ? 'Edit Quest' : 'Create New Quest' }}</h2>

    <form @submit.prevent="save" class="quest-form">
      <div class="form-group">
        <label for="quest-title">Title <span class="required">*</span></label>
        <input
          id="quest-title"
          type="text"
          v-model="formData.title"
          placeholder="Enter quest title..."
          maxlength="100"
          :class="{ error: validationError }"
        />
        <span v-if="validationError" class="error-message">{{ validationError }}</span>
        <span class="char-count">{{ formData.title.length }}/100</span>
      </div>

      <div class="form-group">
        <label for="quest-description">Description</label>
        <textarea
          id="quest-description"
          v-model="formData.description"
          placeholder="Add quest details (optional)..."
          maxlength="500"
          rows="4"
        ></textarea>
        <span class="char-count">{{ formData.description.length }}/500</span>
      </div>

      <div class="form-group">
        <label for="quest-type">Type</label>
        <select id="quest-type" v-model="formData.type">
          <option :value="QuestTypeEnum.Main">Main Quest</option>
          <option :value="QuestTypeEnum.Side">Side Quest</option>
          <option :value="QuestTypeEnum.LifeAdmin">Life Admin</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="button" class="button cancel" @click="cancel">Cancel</button>
        <button type="submit" class="button save" :disabled="!isValid">Save</button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Quest, QuestType } from '@/types/common'
import { QuestType as QuestTypeEnum } from '@/types/common'
import Modal from '@/components/base/Modal.vue'

const props = defineProps<{
  modelValue: boolean
  quest?: Quest
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: { title: string; description: string; type: QuestType }): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditing = computed(() => !!props.quest)

const formData = ref({
  title: '',
  description: '',
  type: QuestTypeEnum.Main,
})

const validationError = ref('')

const isValid = computed(() => {
  return formData.value.title.trim().length > 0
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (props.quest) {
        formData.value = {
          title: props.quest.title,
          description: props.quest.description || '',
          type: props.quest.type,
        }
      } else {
        formData.value = {
          title: '',
          description: '',
          type: QuestTypeEnum.Main,
        }
      }
      validationError.value = ''
    }
  },
)

function validate(): boolean {
  validationError.value = ''

  const title = formData.value.title.trim()
  if (!title) {
    validationError.value = 'Title is required'
    return false
  }

  if (title.length > 100) {
    validationError.value = 'Title must be 100 characters or less'
    return false
  }

  return true
}

function save() {
  if (!validate()) return

  emit('save', {
    title: formData.value.title.trim(),
    description: formData.value.description.trim(),
    type: formData.value.type,
  })

  close()
}

function cancel() {
  close()
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-title {
  font-family: Trajan;
  font-size: 1.5em;
  font-weight: bold;
  margin: 0 0 1.5rem 0;
  color: #424242;
}

.quest-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #424242;
  font-size: 0.95em;
}

.required {
  color: #c62828;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1em;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #32a287;
  box-shadow: 0 0 0 3px rgba(50, 162, 135, 0.1);
}

.form-group input.error {
  border-color: #c62828;
}

.form-group input.error:focus {
  box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.1);
}

.error-message {
  color: #c62828;
  font-size: 0.875em;
}

.char-count {
  font-size: 0.8em;
  color: #999;
  text-align: right;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group select {
  cursor: pointer;
  background: #fff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.button {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.button:hover {
  transform: translateY(-1px);
}

.button:active {
  transform: translateY(0);
}

.button.cancel {
  background: #e8e8e8;
  color: #424242;
}

.button.cancel:hover {
  background: #d8d8d8;
}

.button.save {
  background: #32a287;
  color: #fff;
}

.button.save:hover {
  background: #2d826d;
}

.button.save:disabled {
  background: #a8d5c7;
  cursor: not-allowed;
  transform: none;
}
</style>
