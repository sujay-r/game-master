<template>
  <div class="dropdown-container" :class="{ open: dropdownOpen }" @click="dropdownOpen = true">
    <Pill v-for="(option, index) in selectedOptions" :key="option.id || index" :text="option.name ||
      option" />
  </div>
  <div v-show="dropdownOpen" class="options-container">
    <div v-for="(option, index) in options" :key="option.id || index" class="dropdown-option"
      @click="selectOption(option)">
      {{ option.name || option }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Pill from '@/components/Pill.vue';

// TODO: Add handler to close dropdown when clicked outside.
// TODO: Style the dropdown options.

const props = defineProps<{
  options: any[],
  modelValue: any[]
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', value: any[]): void
}>();

const dropdownOpen = ref<boolean>(false);
const selectedOptions = ref<any[]>([]);

function selectOption(option: any) {
  if (!contains(selectedOptions.value, option, 'id')) {
    selectedOptions.value.push(option)
    emits('update:modelValue', selectedOptions.value)
  }
}

function contains<T>(arr: T[], element: T, key?: keyof T): boolean {
  if (typeof element === 'object' && element !== null) {
    if (key) {
      return arr.some(item => item[key] === element[key]);
    }

    return arr.some(item => item === element)
  } else {
    return arr.includes(element);
  }
}

</script>


<style scoped>
.dropdown-container {
  background: transparent;
  border: 1px solid #C7C7C7;
  border-radius: 8px;
  padding: 0.5em 1em;
  min-height: 1.5em;
  min-width: 10em;
  font-family: 'Perpetua', serif;
  outline: none;
  transition: border-color 0.2s;
  box-shadow: none;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  gap: 5px;
}

.dropdown-container.open {
  border-color: #4BAB91;
}

.options-container {
  color: #424242;
}

.dropdown-option {}
</style>
