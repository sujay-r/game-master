<template>
  <div class="quest-task-group">
    <div class="quest-header">
      <span class="quest-badge" :class="quest.type">{{ typeLabel }}</span>
      <span class="quest-name">{{ quest.title }}</span>
    </div>
    <div class="quest-tasks">
      <Task v-for="task in tasks" :key="task.id" :task="task" @delete="handleDelete" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Task from './Task.vue'
import type { TaskType, Quest, QuestType } from '@/types/common'

const props = defineProps<{
  quest: Quest
  tasks: TaskType[]
}>()

const emit = defineEmits<{
  (e: 'delete', taskId: number): void
}>()

const typeLabels: Record<QuestType, string> = {
  main: 'Main',
  side: 'Side',
  lifeAdmin: 'Life Admin',
}

const typeLabel = computed(() => typeLabels[props.quest.type])

function handleDelete(taskId: number) {
  emit('delete', taskId)
}
</script>

<style scoped>
.quest-task-group {
  margin-bottom: 1rem;
}

.quest-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

.quest-badge {
  text-transform: uppercase;
  font-size: 0.65em;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: Trajan, 'Perpetua', serif;
}

.quest-badge.main {
  background: #ffd700;
  color: #424242;
}

.quest-badge.side {
  background: #87ceeb;
  color: #424242;
}

.quest-badge.lifeAdmin {
  background: #20b2aa;
  color: #fff;
}

.quest-name {
  font-family: Trajan, 'Perpetua', serif;
  font-weight: 600;
  color: #424242;
  font-size: 0.95em;
}

.quest-tasks {
  display: flex;
  flex-direction: column;
}
</style>
