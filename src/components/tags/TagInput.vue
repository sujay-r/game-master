<template>
  <div class="tag-input" v-click-outside="closeDropdown" @click="focusInput">
    <div class="tag-input__pills">
      <TagPill
        v-for="tag in selectedTags"
        :key="tag.id"
        :tag="tag"
        removable
        @remove="removeTag(tag)"
      />
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        class="tag-input__field"
        :placeholder="selectedTags.length ? '' : 'Add tags...'"
        @keydown.enter.prevent="handleEnter"
        @keydown.backspace="handleBackspace"
        @keydown.escape="closeDropdown"
        @focus="isOpen = true"
      />
    </div>

    <div v-if="isOpen && filteredTags.length > 0" class="tag-input__dropdown">
      <div
        v-for="tag in filteredTags"
        :key="tag.id"
        class="tag-input__option"
        @mousedown.prevent="selectTag(tag)"
      >
        <span class="tag-input__swatch" :style="{ backgroundColor: tag.color }"></span>
        <span class="tag-input__name">{{ tag.name }}</span>
      </div>
    </div>

    <div v-else-if="isOpen && query.trim() && !exactMatch" class="tag-input__dropdown">
      <div class="tag-input__option tag-input__create" @mousedown.prevent="createAndSelect">
        <span>Create "{{ query.trim().toLowerCase() }}"</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Tag } from '@/types/common'
import TagPill from '@/components/tags/TagPill.vue'

const props = defineProps<{
  modelValue: Tag[]
  availableTags: Tag[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', tags: Tag[]): void
  (e: 'create', name: string): void
}>()

const query = ref('')
const isOpen = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const selectedTags = computed(() => props.modelValue)

const selectedIds = computed(() => new Set(selectedTags.value.map((t) => t.id)))

const filteredTags = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) {
    return props.availableTags.filter((t) => !selectedIds.value.has(t.id))
  }
  return props.availableTags.filter(
    (t) => t.name.includes(q) && !selectedIds.value.has(t.id),
  )
})

const exactMatch = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return false
  return props.availableTags.some((t) => t.name === q)
})

function focusInput() {
  inputRef.value?.focus()
}

function selectTag(tag: Tag) {
  emit('update:modelValue', [...selectedTags.value, tag])
  query.value = ''
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function removeTag(tag: Tag) {
  emit(
    'update:modelValue',
    selectedTags.value.filter((t) => t.id !== tag.id),
  )
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function handleEnter() {
  if (filteredTags.value.length > 0) {
    selectTag(filteredTags.value[0])
  } else if (query.value.trim() && !exactMatch.value) {
    createAndSelect()
  }
}

function createAndSelect() {
  const name = query.value.trim().toLowerCase()
  if (!name) return
  // TODO: Allow user to pick a tag color during creation instead of auto-assigning
  emit('create', name)
  query.value = ''
  isOpen.value = false
}

function handleBackspace() {
  if (query.value === '' && selectedTags.value.length > 0) {
    const last = selectedTags.value[selectedTags.value.length - 1]
    removeTag(last)
  }
}

function closeDropdown() {
  isOpen.value = false
}

watch(query, () => {
  isOpen.value = true
})

// Click outside handler storage
const clickOutsideHandlers = new WeakMap<HTMLElement, (event: Event) => void>()

// Click outside directive
const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    const handler = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    clickOutsideHandlers.set(el, handler)
    document.addEventListener('click', handler)
  },
  unmounted(el: HTMLElement) {
    const handler = clickOutsideHandlers.get(el)
    if (handler) {
      document.removeEventListener('click', handler)
      clickOutsideHandlers.delete(el)
    }
  },
}
</script>

<style scoped>
.tag-input {
  position: relative;
  min-height: 44px;
  padding: 0.4rem 0.6rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  cursor: text;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.tag-input:focus-within {
  outline: none;
  border-color: #32a287;
  box-shadow: 0 0 0 3px rgba(50, 162, 135, 0.1);
}

.tag-input__pills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.tag-input__field {
  flex: 1 1 80px;
  min-width: 80px;
  border: none;
  background: transparent;
  font-size: 1em;
  font-family: inherit;
  color: #424242;
  padding: 0.25rem 0;
  outline: none;
}

.tag-input__field::placeholder {
  color: #999;
}

.tag-input__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
}

.tag-input__option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.9em;
  color: #424242;
  transition: background 0.15s;
}

.tag-input__option:hover {
  background: #f2f2ee;
}

.tag-input__swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-input__name {
  text-transform: lowercase;
}

.tag-input__create {
  color: #32a287;
  font-weight: 600;
}

.tag-input__create:hover {
  background: #e8f5f1;
}
</style>
