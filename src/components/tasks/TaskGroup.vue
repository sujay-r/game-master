<template>
  <div class="task-group">
    <!-- Main Quest Tasks - Grouped by Quest -->
    <div v-if="mainQuestTasks.length" class="quest-category main">
      <QuestTaskList
        v-for="(tasks, questId) in groupByQuest(mainQuestTasks)"
        :key="questId"
        :quest="getQuest(Number(questId))!"
        :tasks="tasks"
        @delete="handleDelete"
      />
    </div>

    <!-- Side Quest Tasks - Grouped by Quest -->
    <div v-if="sideQuestTasks.length" class="quest-category side">
      <QuestTaskList
        v-for="(tasks, questId) in groupByQuest(sideQuestTasks)"
        :key="questId"
        :quest="getQuest(Number(questId))!"
        :tasks="tasks"
        @delete="handleDelete"
      />
    </div>

    <!-- Life Admin Quest Tasks - Grouped by Quest -->
    <div v-if="lifeAdminQuestTasks.length" class="quest-category lifeAdmin">
      <QuestTaskList
        v-for="(tasks, questId) in groupByQuest(lifeAdminQuestTasks)"
        :key="questId"
        :quest="getQuest(Number(questId))!"
        :tasks="tasks"
        @delete="handleDelete"
      />
    </div>

    <!-- Unassigned Tasks - No Grouping -->
    <div v-if="unassignedTasks.length" class="unassigned-category">
      <h5 class="category-label">Unassigned</h5>
      <div class="unassigned-tasks">
        <Task v-for="task in unassignedTasks" :key="task.id" :task="task" @delete="handleDelete" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Task from '@/components/tasks/Task.vue'
import QuestTaskList from '@/components/quests/QuestTaskList.vue'
import { useQuestStore } from '@/stores/quests'
import type { TaskType, Quest, QuestType } from '@/types/common'

const props = defineProps<{
  tasks: TaskType[]
}>()

const questStore = useQuestStore()

const emit = defineEmits<{
  (e: 'delete', taskId: number | string): void
}>()

const mainQuestTasks = computed(() =>
  props.tasks.filter((task) => {
    if (!task.questId) return false
    const quest = questStore.quests.find((q) => q.id === task.questId)
    return quest?.type === ('main' as QuestType)
  }),
)

const sideQuestTasks = computed(() =>
  props.tasks.filter((task) => {
    if (!task.questId) return false
    const quest = questStore.quests.find((q) => q.id === task.questId)
    return quest?.type === ('side' as QuestType)
  }),
)

const lifeAdminQuestTasks = computed(() =>
  props.tasks.filter((task) => {
    if (!task.questId) return false
    const quest = questStore.quests.find((q) => q.id === task.questId)
    return quest?.type === ('lifeAdmin' as QuestType)
  }),
)

const unassignedTasks = computed(() => props.tasks.filter((task) => !task.questId))

function groupByQuest(tasks: TaskType[]): Record<number, TaskType[]> {
  return tasks.reduce(
    (acc, task) => {
      if (task.questId) {
        if (!acc[task.questId]) {
          acc[task.questId] = []
        }
        acc[task.questId].push(task)
      }
      return acc
    },
    {} as Record<number, TaskType[]>,
  )
}

function getQuest(questId: number): Quest | undefined {
  return questStore.quests.find((q) => q.id === questId)
}

function handleDelete(taskId: number | string) {
  emit('delete', taskId)
}
</script>

<style scoped>
.task-group {
  display: flex;
  flex-direction: column;
}

.quest-category {
  display: flex;
  flex-direction: column;
}

.unassigned-category {
  margin-top: 0.5rem;
}

.category-label {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  color: #666;
  margin: 0 0 0.5rem 0;
  padding: 0.25rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.unassigned-tasks {
  display: flex;
  flex-direction: column;
}
</style>
