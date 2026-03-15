<template>
  <div class="dropdown-base" v-click-outside="closeDropdown">
    <label v-if="label" class="dropdown-label">{{ label }}</label>

    <div class="dropdown-row">
      <div class="dropdown-trigger" @click="toggleDropdown">
        <span class="current-selection" :class="{ placeholder: !currentOption }">
          <span v-if="currentOption?.icon" class="option-icon" v-html="currentOption.icon"></span>
          <span class="option-label">{{ currentOption?.label || placeholder }}</span>
        </span>
        <span class="dropdown-arrow" :class="{ open: isOpen }">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="#666"
          >
            <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
          </svg>
        </span>
      </div>

      <input
        v-if="showSecondaryField"
        type="number"
        class="secondary-input"
        :min="secondaryMin"
        :max="secondaryMax"
        :value="secondaryValue"
        @input="onSecondaryInput"
        @click.stop
      />
    </div>

    <div v-if="isOpen" class="dropdown-menu">
      <div
        v-for="option in options"
        :key="option.value"
        class="dropdown-item"
        :class="{ selected: modelValue === option.value }"
        @click.stop="selectOption(option.value)"
      >
        <span v-if="option.icon" class="option-icon" v-html="option.icon"></span>
        <span class="option-label">{{ option.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Option {
  value: string | number
  label: string
  icon?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null
    options: Option[]
    secondaryValue?: number
    showSecondaryField?: boolean
    secondaryMin?: number
    secondaryMax?: number
    placeholder?: string
    label?: string
  }>(),
  {
    secondaryValue: 1,
    showSecondaryField: false,
    secondaryMin: 1,
    secondaryMax: 99,
    placeholder: 'Select an option',
    label: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
  (e: 'update:secondaryValue', value: number): void
}>()

const isOpen = ref(false)

const currentOption = computed(() => props.options.find((opt) => opt.value === props.modelValue))

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function selectOption(value: string | number) {
  emit('update:modelValue', value)
  isOpen.value = false
}

function onSecondaryInput(event: Event) {
  const input = event.target as HTMLInputElement
  let value = parseInt(input.value, 10)

  if (isNaN(value) || value < props.secondaryMin) {
    value = props.secondaryMin
  } else if (value > props.secondaryMax) {
    value = props.secondaryMax
  }

  emit('update:secondaryValue', value)
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
.dropdown-base {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.dropdown-label {
  font-size: 0.875em;
  font-weight: 600;
  color: #666;
}

.dropdown-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  flex: 1;
  min-width: 0;
}

.dropdown-trigger:hover {
  border-color: #32a287;
}

.current-selection {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95em;
  color: #424242;
  overflow: hidden;
}

.current-selection.placeholder {
  color: #999;
}

.option-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.option-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.option-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-arrow {
  display: flex;
  align-items: center;
  transition: transform 0.2s;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.secondary-input {
  width: 70px;
  padding: 0.625rem 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
  text-align: center;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  -moz-appearance: textfield;
}

.secondary-input::-webkit-outer-spin-button,
.secondary-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.secondary-input:focus {
  outline: none;
  border-color: #32a287;
  box-shadow: 0 0 0 3px rgba(50, 162, 135, 0.1);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 100;
  max-height: 250px;
  overflow-y: auto;
  animation: dropdownSlide 0.15s ease-out;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item.selected {
  background: #e8f5e9;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .dropdown-base {
    position: relative;
  }

  .dropdown-trigger {
    padding: 0.75rem 1rem;
    min-height: 44px;
  }

  .secondary-input {
    width: 80px;
    padding: 0.75rem 0.5rem;
    min-height: 44px;
  }

  .dropdown-item {
    padding: 0.75rem 1rem;
    min-height: 44px;
  }
}
</style>
