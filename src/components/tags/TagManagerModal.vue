<template>
  <Modal v-model="isOpen" :include-close-button="true">
    <div class="tag-manager">
      <h2 class="modal-title">Manage Tags</h2>

      <div v-if="tagsStore.loading" class="loading">Loading tags...</div>

      <div v-else-if="tagsStore.tags.length === 0" class="empty">
        <p>No tags yet.</p>
      </div>

      <div v-else class="tag-list">
        <div v-for="tag in tagsStore.tags" :key="tag.id" class="tag-row">
          <div class="tag-row__left">
            <span
              class="color-swatch"
              :style="{ backgroundColor: tag.color }"
              @click="openColorPicker(tag)"
              title="Change color"
            ></span>

            <span
              v-if="editingTagId !== tag.id"
              class="tag-name"
              @click="startEdit(tag)"
              title="Click to rename"
            >
              {{ tag.name }}
            </span>
            <input
              v-else
              ref="editInput"
              v-model="editName"
              class="tag-name-input"
              @blur="saveEdit(tag)"
              @keydown.enter.prevent="saveEdit(tag)"
              @keydown.esc="cancelEdit"
            />
          </div>

          <div class="tag-row__right">
            <span class="usage-count" :class="{ used: tagsStore.isTagInUse(tag.id) }">
              {{ tagsStore.usageCounts.get(tag.id) || 0 }} use{{
                (tagsStore.usageCounts.get(tag.id) || 0) === 1 ? '' : 's'
              }}
            </span>
            <button
              class="delete-btn"
              :disabled="tagsStore.isTagInUse(tag.id)"
              :title="
                tagsStore.isTagInUse(tag.id)
                  ? 'Tag is in use and cannot be deleted'
                  : 'Delete tag'
              "
              @click="tagsStore.removeTag(tag.id)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="16px"
                viewBox="0 -960 960 960"
                width="16px"
                fill="currentColor"
              >
                <path
                  d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Inline color picker popover -->
      <div v-if="pickingTag" class="color-picker-popover">
        <div class="color-grid">
          <button
            v-for="color in tagsStore.tagColors"
            :key="color"
            class="color-option"
            :style="{ backgroundColor: color }"
            :class="{ active: pickingTag.color === color }"
            @click="applyColor(color)"
          ></button>
        </div>
        <button class="close-picker" @click="pickingTag = null">Done</button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Tag } from '@/types/common'
import Modal from '@/components/base/Modal.vue'
import { useTagsStore } from '@/stores/tags'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const tagsStore = useTagsStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const editingTagId = ref<number | null>(null)
const editName = ref('')
const editInput = ref<HTMLInputElement | null>(null)

const pickingTag = ref<Tag | null>(null)

watch(isOpen, (open) => {
  if (open) {
    tagsStore.loadUsageCounts()
  } else {
    editingTagId.value = null
    pickingTag.value = null
  }
})

function startEdit(tag: Tag) {
  editingTagId.value = tag.id
  editName.value = tag.name
  nextTick(() => {
    editInput.value?.focus()
  })
}

async function saveEdit(tag: Tag) {
  const name = editName.value.trim().toLowerCase()
  if (name && name !== tag.name) {
    try {
      await tagsStore.renameTag(tag.id, name)
    } catch (err) {
      console.error('Failed to rename tag:', err)
    }
  }
  editingTagId.value = null
}

function cancelEdit() {
  editingTagId.value = null
}

function openColorPicker(tag: Tag) {
  pickingTag.value = tag
}

async function applyColor(color: string) {
  if (!pickingTag.value) return
  try {
    await tagsStore.recolorTag(pickingTag.value.id, color)
  } catch (err) {
    console.error('Failed to recolor tag:', err)
  }
  pickingTag.value = null
}
</script>

<style scoped>
.tag-manager {
  min-width: 400px;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
  padding-bottom: 1rem;
}

.modal-title {
  font-family: 'Trajan', 'Perpetua', serif;
  font-size: 1.25em;
  color: #424242;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.loading,
.empty {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-size: 0.95em;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f7f7f4;
  border-radius: 8px;
}

.tag-row__left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.tag-row__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.color-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  border: 2px solid transparent;
  transition: transform 0.1s;
}

.color-swatch:hover {
  transform: scale(1.1);
  border-color: rgba(0, 0, 0, 0.2);
}

.tag-name {
  font-size: 0.95em;
  color: #424242;
  cursor: pointer;
  text-transform: lowercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-name:hover {
  text-decoration: underline;
}

.tag-name-input {
  flex: 1;
  font-size: 0.95em;
  padding: 0.25rem 0.5rem;
  border: 2px solid #32a287;
  border-radius: 6px;
  outline: none;
  background: #fff;
  color: #424242;
}

.usage-count {
  font-size: 0.8em;
  color: #999;
}

.usage-count.used {
  color: #666;
  font-weight: 500;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #c62828;
  cursor: pointer;
  transition: background 0.15s;
}

.delete-btn:hover:not(:disabled) {
  background: #ffebee;
}

.delete-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.color-picker-popover {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.color-option {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s;
}

.color-option:hover {
  transform: scale(1.15);
}

.color-option.active {
  border-color: #424242;
}

.close-picker {
  margin-top: 0.75rem;
  padding: 0.4rem 0.8rem;
  background: #e8e8e8;
  color: #424242;
  border: none;
  border-radius: 6px;
  font-size: 0.85em;
  cursor: pointer;
  transition: background 0.15s;
}

.close-picker:hover {
  background: #d8d8d8;
}

@media (max-width: 768px) {
  .tag-manager {
    min-width: auto;
    width: 100%;
    max-width: 100%;
  }
}
</style>
