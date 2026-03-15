<template>
  <div class="dropdown-container" v-click-outside="closeDropdown" ref="dropdown">
    <div class="dropdown-trigger" @click="toggleDropdown">
      <div class="selected-pill-container" :class="{ open: dropdownOpen }">
        <Pill
          v-for="(option, index) in selectedOptions"
          :key="option.id || index"
          :text="option.name || option"
          @delete="removeOption(option)"
        />
      </div>
      <span class="dropdown-icon" :class="{ open: dropdownOpen }">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <polyline points="6 8 10 12 14 8" fill="none" stroke="#C7C7C7" stroke-width="2" />
        </svg>
      </span>
    </div>
    <div v-if="dropdownOpen" class="options-container">
      <div
        v-for="(option, index) in options"
        :key="option.id || index"
        class="dropdown-option"
        @click.stop="selectOption(option)"
      >
        {{ option.name || option }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Pill from '@/components/base/Pill.vue'

const props = defineProps<{
  options: any[]
  modelValue: any[]
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: any[]): void
}>()

const dropdown = ref<HTMLElement | null>(null)
const dropdownOpen = ref<boolean>(false)
const selectedOptions = ref<any[]>([])

function selectOption(option: any) {
  if (!contains(selectedOptions.value, option, 'id')) {
    selectedOptions.value.push(option)
    emits('update:modelValue', selectedOptions.value)
  }
}

function removeOption(option: any) {
  if (contains(selectedOptions.value, option, 'id')) {
    selectedOptions.value = selectedOptions.value.filter((item) => {
      if (typeof item === 'object') {
        return item.id !== option.id
      }

      return item !== option
    })
    emits('update:modelValue', selectedOptions.value)
  }
}

function contains<T>(arr: T[], element: T, key?: keyof T): boolean {
  if (typeof element === 'object' && element !== null) {
    if (key) {
      return arr.some((item) => item[key] === element[key])
    }

    return arr.some((item) => item === element)
  } else {
    return arr.includes(element)
  }
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function closeDropdown() {
  dropdownOpen.value = false
}

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
.dropdown-container {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 15em;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.dropdown-icon {
  position: absolute;
  right: 0.5em;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  transition: transform 0.2s;
}

.dropdown-icon.open svg {
  transform: rotate(180deg);
}

.selected-pill-container {
  background: transparent;
  border: 1px solid #c7c7c7;
  border-radius: 8px;
  padding: 0.5em 2em 0.5em 1em;
  min-height: 1.5em;
  font-family: 'Perpetua', serif;
  outline: none;
  transition: border-color 0.2s;
  box-shadow: none;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  gap: 5px;
  cursor: pointer;
  width: 100%;
}

.selected-pill-container.open {
  border-color: #4bab91;
  cursor: default;
}

.options-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background-color: #fff;
  color: #424242;
  z-index: 100;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-option {
  border: none;
  padding: 0.5em 1em;
  font-size: 1.05em;
  cursor: pointer;
}

.dropdown-option:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dropdown-option:active {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
