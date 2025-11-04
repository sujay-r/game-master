<template>
  <div class="dropdown-container" @click="openDropdown" ref="dropdown">
    <div class="selected-pill-container" :class="{ open: dropdownOpen }" ref="pillContainer">
      <Pill v-for="(option, index) in selectedOptions" :key="option.id || index" :text="option.name
        || option" @delete="removeOption(option)" />
      <div v-show="dropdownOpen" class="options-container" :style="dropdownStyle">
        <div v-for="(option, index) in options" :key="option.id || index" class="dropdown-option"
          @click="selectOption(option)">
          {{ option.name || option }}
        </div>
      </div>
    </div>
    <span class="dropdown-icon" :class="{ open: dropdownOpen }">
      <svg width="20" height="20" viewBox="0 0 20 20">
        <polyline points="6 8 10 12 14 8" fill="none" stroke="#C7C7C7" stroke-width="2" />
      </svg>
    </span>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Pill from '@/components/Pill.vue';

// TODO: Add a dropdown icon

const props = defineProps<{
  options: any[],
  modelValue: any[]
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', value: any[]): void
}>();

const dropdown = ref<HTMLElement | null>(null);
const dropdownOpen = ref<boolean>(false);
const selectedOptions = ref<any[]>([]);
const dropdownStyle = ref({});

const pillContainer = ref<HTMLElement | null>(null);

function selectOption(option: any) {
  if (!contains(selectedOptions.value, option, 'id')) {
    selectedOptions.value.push(option)
    emits('update:modelValue', selectedOptions.value)
  }
}

function removeOption(option: any) {
  if (contains(selectedOptions.value, option, 'id')) {
    selectedOptions.value = selectedOptions.value.filter(item => {
      if (typeof item === 'object') {
        return item.id !== option.id
      }

      return item !== option
    });
    emits('update:modelValue', selectedOptions.value);
  }
}

function contains<T>(arr: T[], element: T, key?: keyof T): boolean {
  if (typeof element === 'object' && element !== null) {
    if (key) {
      return arr.some(item => item[key] === element[key]);
    }

    return arr.some(item => item === element);
  } else {
    return arr.includes(element);
  }
}

const openDropdown = () => {
  dropdownOpen.value = true;
  if (pillContainer.value) {
    const rect = pillContainer.value.getBoundingClientRect();
    dropdownStyle.value = {
      position: 'fixed',
      top: `${rect.bottom}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: '100'
    }
  }
}

const closeDropdown = (event: any) => {
  if (!dropdown.value) return;
  if (!dropdown.value.contains(event.target)) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener('click', closeDropdown);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', closeDropdown);
});

</script>


<style scoped>
.dropdown-container {
  display: flex;
  position: relative;
  flex-direction: column;
  min-width: 15em;
}

.dropdown-icon {
  position: absolute;
  right: 0.2em;
  top: 60%;
  transform: translateY(-50%);
  pointer-events: none;
  transition: transform 0.2s;
}

.dropdown-icon.open svg {
  transform: rotate(180deg);
}

.selected-pill-container {
  background: transparent;
  border: 1px solid #C7C7C7;
  border-radius: 8px;
  padding: 0.5em 1em;
  min-height: 1.5em;
  font-family: 'Perpetua', serif;
  outline: none;
  transition: border-color 0.2s;
  box-shadow: none;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  position: relative;
  gap: 5px;
  cursor: pointer;
}

.selected-pill-container.open {
  border-color: #4BAB91;
  cursor: default;
}

.options-container {
  background-color: #fff;
  color: #424242;
  z-index: 100;
}

.dropdown-option {
  border: none;
  padding: 0.5em 0;
  font-size: 1.05em;
}

.dropdown-option:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dropdown-option:active {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
