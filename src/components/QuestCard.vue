<template>
  <div class="quest-card" :class="questTypeClass">
    <!-- Header -->
    <div class="quest-header" @click="$emit('toggle-expand')">
      <div class="header-left">
        <span class="expand-icon" :class="{ expanded: isExpanded }">
          <!-- TODO: Move this hardcoded icon to the icon store instead, use svg files for it -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#424242"
          >
            <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
          </svg>
        </span>
        <h3 class="quest-title">{{ quest.title }}</h3>
        <span class="quest-type-badge" :class="quest.type">{{ typeLabel }}</span>
      </div>

      <div class="header-right">
        <div class="progress-section">
          <span class="progress-text">{{ progress.completed }}/{{ progress.total }}</span>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${progress.percentage}%` }"
              :class="{ complete: progress.percentage === 100 }"
            ></div>
          </div>
        </div>

        <button
          v-if="canComplete"
          class="complete-button"
          @click.stop="$emit('complete')"
          title="Complete Quest"
        >
          <!-- TODO: Move this icon to the icons store as well -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="#fff"
          >
            <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
          </svg>
        </button>

        <span v-if="quest.status === 'completed'" class="completed-badge">
          <!-- TODO: Move this icon to the icons store as well -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="#32a287"
          >
            <path
              d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"
            />
          </svg>
        </span>
      </div>
    </div>

    <!-- Body -->
    <div v-if="isExpanded" class="quest-body">
      <!-- TODO: Add markdown rendering to quest description -->
      <div v-if="quest.description" class="quest-description">
        {{ quest.description }}
      </div>

      <div v-if="tasks.length > 0" class="tasks-container">
        <Task v-for="task in tasks" :key="task.id" :task="task" />
      </div>

      <div v-else class="empty-tasks">
        <p>No tasks in this quest yet</p>
      </div>

      <!-- Footer Actions -->
      <div class="quest-footer">
        <button class="action-button add-task" @click="$emit('add-task')">
          <!-- TODO: Move this icon to the icons store as well -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="18px"
            viewBox="0 -960 960 960"
            width="18px"
            fill="currentColor"
          >
            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
          </svg>
          Add Task
        </button>

        <div class="footer-actions">
          <button class="action-button edit" @click="$emit('edit')">
          <!-- TODO: Move this icon to the icons store as well -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="18px"
              viewBox="0 -960 960 960"
              width="18px"
              fill="currentColor"
            >
              <path
                d="M120-120v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm584-528 56-56-56-56-56 56 56 56Z"
              />
            </svg>
            Edit
          </button>

          <button class="action-button delete" @click="$emit('delete')">
          <!-- TODO: Move this icon to the icons store as well -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="18px"
              viewBox="0 -960 960 960"
              width="18px"
              fill="currentColor"
            >
              <path
                d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
              />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Quest, TaskType, QuestType } from '@/types/common'
import Task from './Task.vue'

const props = defineProps<{
  quest: Quest
  tasks: TaskType[]
  isExpanded: boolean
}>()

defineEmits<{
  (e: 'toggle-expand'): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'complete'): void
  (e: 'add-task'): void
}>()

const typeLabels: Record<QuestType, string> = {
  main: 'Main',
  side: 'Side',
}

const typeLabel = computed(() => typeLabels[props.quest.type])

const questTypeClass = computed(() => `quest-${props.quest.type}`)

const progress = computed(() => {
  const total = props.tasks.length
  const completed = props.tasks.filter((t) => t.status === 'DONE').length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percentage }
})

const canComplete = computed(() => {
  return progress.value.percentage === 100 && props.quest.status !== 'completed'
})
</script>

<style scoped>
.quest-card {
  background: #f7f7f4;
  border-radius: 16px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1.5px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.25rem;
  overflow: hidden;
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
  border: 3px solid transparent;
}

.quest-card:hover {
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.1);
}

/* Type-based styling */
.quest-main {
  border-color: #c9a227;
  box-shadow:
    0 2px 8px rgba(201, 162, 39, 0.15),
    0 1.5px 4px rgba(0, 0, 0, 0.06);
}

.quest-main:hover {
  box-shadow:
    0 4px 16px rgba(201, 162, 39, 0.25),
    0 3px 8px rgba(0, 0, 0, 0.1);
}

.quest-side {
  border-color: #6b8cae;
  box-shadow:
    0 2px 8px rgba(107, 140, 174, 0.15),
    0 1.5px 4px rgba(0, 0, 0, 0.06);
}

.quest-side:hover {
  box-shadow:
    0 4px 16px rgba(107, 140, 174, 0.25),
    0 3px 8px rgba(0, 0, 0, 0.1);
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.quest-header:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.expand-icon {
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.quest-title {
  font-family: Trajan;
  font-size: 1.15em;
  font-weight: bold;
  margin: 0;
  color: #424242;
}

.quest-type-badge {
  font-size: 0.7em;
  font-weight: 600;
  padding: 0.25em 0.6em;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quest-type-badge.main {
  background: #c9a227;
  color: #fff;
}

.quest-type-badge.side {
  background: #6b8cae;
  color: #fff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-text {
  font-size: 0.875em;
  color: #666;
  font-weight: 500;
  min-width: 3.5ch;
  text-align: right;
}

.progress-bar {
  width: 80px;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #32a287;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.complete {
  background: #4caf50;
}

.complete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #32a287;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.complete-button:hover {
  background: #2d826d;
  transform: scale(1.05);
}

.complete-button:active {
  transform: scale(0.95);
}

.completed-badge {
  display: flex;
  align-items: center;
  justify-content: center;
}

.quest-body {
  padding: 0 1.25rem 1.25rem;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.quest-description {
  color: #666;
  font-size: 0.95em;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  line-height: 1.5;
}

.tasks-container {
  margin-bottom: 1rem;
}

.empty-tasks {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.quest-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.footer-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.875rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875em;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.action-button:hover {
  transform: translateY(-1px);
}

.action-button:active {
  transform: translateY(0);
}

.action-button.add-task {
  background: #32a287;
  color: #fff;
}

.action-button.add-task:hover {
  background: #2d826d;
}

.action-button.edit {
  background: #e8e8e8;
  color: #424242;
}

.action-button.edit:hover {
  background: #d8d8d8;
}

.action-button.delete {
  background: #ffebee;
  color: #c62828;
}

.action-button.delete:hover {
  background: #ffcdd2;
}
</style>
