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
        <button class="open-quest-btn" :class="quest.type" @click.stop="$emit('open-quest', quest)">
          Open Quest
        </button>
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
          @click.stop="$emit('request-complete', quest)"
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
            <path
              d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Zm-86 166 226-226-57-57-169 169-85-85-57 57 142 142Z"
            />
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
      <div v-if="quest.description" class="quest-description">
        {{ quest.description }}
      </div>

      <!-- Active Tasks -->
      <div v-if="activeTasks.length > 0" class="tasks-container">
        <Task
          v-for="task in activeTasks"
          :key="task.id"
          :task="task"
          @delete="emit('task-delete', $event)"
        />
      </div>

      <div v-else-if="completedTasks.length === 0" class="empty-tasks">
        <p>No tasks in this quest yet</p>
      </div>

      <!-- Completed Tasks Toggle -->
      <div
        v-if="completedTasks.length > 0"
        class="completed-tasks-toggle"
        @click="showCompleted = !showCompleted"
      >
        <span class="toggle-icon">{{ showCompleted ? '▼' : '▶' }}</span>
        <span
          >{{ completedTasks.length }} completed task{{
            completedTasks.length === 1 ? '' : 's'
          }}</span
        >
      </div>

      <!-- Completed Tasks List -->
      <div v-if="showCompleted && completedTasks.length > 0" class="completed-tasks-list">
        <Task
          v-for="task in completedTasks"
          :key="task.id"
          :task="task"
          @delete="emit('task-delete', $event)"
        />
      </div>

      <!-- Footer Actions -->
      <div class="quest-footer">
        <button class="action-button add-task" @click="$emit('add-task', quest)">
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
          <button class="action-button edit" @click="$emit('edit', quest)">
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
            <span>Edit</span>
          </button>

          <button class="action-button delete" @click="$emit('delete', quest)">
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
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Quest, TaskType, QuestType } from '@/types/common'
import Task from '@/components/tasks/Task.vue'

const props = defineProps<{
  quest: Quest
  tasks: TaskType[]
  isExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-expand'): void
  (e: 'edit', quest: Quest): void
  (e: 'delete', quest: Quest): void
  (e: 'complete', questId: number): void
  (e: 'request-complete', quest: Quest): void
  (e: 'add-task', quest: Quest): void
  (e: 'open-quest', quest: Quest): void
  (e: 'task-delete', taskId: number): void
}>()

const showCompleted = ref(false)

const typeLabels: Record<QuestType, string> = {
  main: 'Main',
  side: 'Side',
  lifeAdmin: 'Life Admin',
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

const activeTasks = computed(() => {
  return props.tasks.filter((t) => t.status !== 'DONE')
})

const completedTasks = computed(() => {
  return props.tasks.filter((t) => t.status === 'DONE')
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

.quest-lifeAdmin {
  border-color: #20b2aa;
  box-shadow:
    0 2px 8px rgba(32, 178, 170, 0.15),
    0 1.5px 4px rgba(0, 0, 0, 0.06);
}

.quest-lifeAdmin:hover {
  box-shadow:
    0 4px 16px rgba(32, 178, 170, 0.25),
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

.open-quest-btn {
  opacity: 0;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  border: 1px solid transparent;
  background: transparent;
  font-family: 'Perpetua', serif;
  font-size: 0.85em;
  font-weight: 400;
  /* font-style: italic; */
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 0.5rem;
}

/* Show outline on card hover */
.quest-card:hover .open-quest-btn.main {
  opacity: 1;
  border-color: #c9a227;
  color: #c9a227;
}

.quest-card:hover .open-quest-btn.side {
  opacity: 1;
  border-color: #6b8cae;
  color: #6b8cae;
}

/* Darken background on button hover */
.open-quest-btn.main:hover {
  background: rgba(201, 162, 39, 0.15);
}

.open-quest-btn.side:hover {
  background: rgba(107, 140, 174, 0.15);
}

.quest-card:hover .open-quest-btn.lifeAdmin {
  opacity: 1;
  border-color: #20b2aa;
  color: #20b2aa;
}

.open-quest-btn.lifeAdmin:hover {
  background: rgba(32, 178, 170, 0.15);
}

.open-quest-btn:active {
  transform: translateY(0);
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
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

.quest-type-badge.lifeAdmin {
  background: #20b2aa;
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

.completed-tasks-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9em;
  color: #666;
  transition: background 0.15s;
}

.completed-tasks-toggle:hover {
  background: rgba(0, 0, 0, 0.08);
}

.toggle-icon {
  font-size: 0.8em;
}

.completed-tasks-list {
  margin-top: 0.5rem;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .quest-header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }

  .header-left {
    display: contents;
  }

  .expand-icon {
    grid-column: 1;
    grid-row: 1;
  }

  .quest-title {
    grid-column: 2;
    grid-row: 1;
    font-size: 1em;
  }

  .quest-type-badge {
    grid-column: 3;
    grid-row: 1;
  }

  .open-quest-btn {
    display: none;
  }

  .header-right {
    grid-column: 1 / -1;
    grid-row: 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 0.75rem;
  }

  .progress-section {
    flex: 1;
    justify-content: flex-start;
  }

  .progress-bar {
    display: none;
  }

  .progress-text {
    font-size: 0.9em;
    min-width: auto;
    text-align: left;
  }

  .complete-button {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }

  .completed-badge svg {
    width: 24px;
    height: 24px;
  }
}

@media (max-width: 480px) {
  .quest-header {
    padding: 0.625rem 0.875rem;
    gap: 0.4rem;
  }

  .quest-title {
    font-size: 0.95em;
  }

  .quest-type-badge {
    font-size: 0.6em;
    padding: 0.2em 0.5em;
  }

  .progress-text {
    font-size: 0.85em;
  }

  .complete-button {
    width: 26px;
    height: 26px;
  }

  .complete-button svg {
    width: 16px;
    height: 16px;
  }

  .quest-body {
    padding: 0 0.875rem 1rem;
  }

  .quest-footer {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }

  .action-button {
    white-space: nowrap;
    justify-content: center;
    padding: 0.5rem 0.75rem;
    font-size: 0.8em;
  }

  .action-button.add-task {
    width: 100%;
    font-size: 0.85em;
  }

  .footer-actions {
    width: 100%;
    justify-content: stretch;
    gap: 0.75rem;
  }

  .footer-actions .action-button {
    flex: 1 1 0;
    min-width: 0;
  }
}

@media (max-width: 375px) {
  .footer-actions .action-button svg {
    width: 18px;
    height: 18px;
  }
}
</style>
