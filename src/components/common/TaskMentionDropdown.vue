<template>
  <div class="mention-dropdown" v-if="filteredTasks.length > 0">
    <div
      v-for="(task, index) in filteredTasks"
      :key="task.id"
      class="mention-item"
      :class="{ selected: index === selectedIndex }"
      @click="selectItem(index)"
      @mouseenter="selectedIndex = index"
    >
      <span class="task-title">{{ task.title }}</span>
      <span v-if="task.questName" class="task-quest">{{ task.questName }}</span>
    </div>
  </div>
  <div v-else class="mention-dropdown mention-empty">No tasks found</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TaskType } from '@/types/common'

interface TaskWithQuestName extends TaskType {
  questName?: string
}

const props = defineProps<{
  items: TaskWithQuestName[]
  query: string
  currentTaskId?: number
}>()

const emit = defineEmits<{
  (e: 'select', task: TaskWithQuestName): void
}>()

const selectedIndex = ref(0)
const currentItems = ref<TaskWithQuestName[]>(props.items)
const currentQuery = ref(props.query)

function updateData(newItems: TaskWithQuestName[], newQuery: string) {
  currentItems.value = newItems
  currentQuery.value = newQuery
}

const filteredTasks = computed(() => {
  let tasks = currentItems.value.filter((task) => task.id !== props.currentTaskId)

  if (currentQuery.value) {
    const lowerQuery = currentQuery.value.toLowerCase()
    tasks = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowerQuery) ||
        (task.questName && task.questName.toLowerCase().includes(lowerQuery)),
    )
  }

  return tasks.slice(0, 8)
})

watch(filteredTasks, () => {
  selectedIndex.value = 0
})

function selectItem(index: number) {
  const task = filteredTasks.value[index]
  if (task) {
    emit('select', task)
  }
}

function onKeyDown(event: KeyboardEvent): boolean {
  if (event.key === 'ArrowUp') {
    selectedIndex.value =
      (selectedIndex.value + filteredTasks.value.length - 1) % filteredTasks.value.length
    return true
  }

  if (event.key === 'ArrowDown') {
    selectedIndex.value = (selectedIndex.value + 1) % filteredTasks.value.length
    return true
  }

  if (event.key === 'Enter') {
    selectItem(selectedIndex.value)
    return true
  }

  return false
}

defineExpose({
  onKeyDown,
  updateData,
})
</script>

<style scoped>
.mention-dropdown {
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  max-height: 300px;
  overflow-y: auto;
  min-width: 250px;
  padding: 0.5rem;
}

.mention-empty {
  padding: 1rem;
  text-align: center;
  color: #929292;
  font-style: italic;
}

.mention-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.mention-item:hover,
.mention-item.selected {
  background: #f7f7f4;
}

.task-title {
  font-weight: 500;
  color: #424242;
  font-size: 0.95em;
}

.task-quest {
  font-size: 0.8em;
  color: #929292;
}
</style>
