<template>
  <Modal v-model="isOpen" :include-close-button="false" @close="cancel">
    <div class="delete-modal-content">
      <div class="warning-icon">
        <!-- TODO: Move to icons store -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="48px"
          viewBox="0 -960 960 960"
          width="48px"
          fill="#c62828"
        >
          <path
            d="M479.98-280q14.02 0 23.52-9.48t9.5-23.5q0-14.02-9.48-23.52t-23.5-9.5q-14.02 0-23.52 9.48t-9.5 23.5q0 14.02 9.48 23.52t23.5 9.5ZM453-433h60v-253h-60v253Zm26.97 361q-78.83 0-148.21-29.92t-120.68-81.21q-51.31-51.29-81.21-120.63Q100-373.1 100-451.86q0-79.03 29.92-148.47 29.92-69.43 81.21-120.76 51.29-51.33 120.63-81.25 69.34-29.92 148.1-29.92t148.44 29.92q69.43 29.92 120.76 81.25 51.33 51.33 81.25 120.8 29.92 69.47 29.92 148.53 0 78.84-29.92 148.21-29.92 69.37-81.25 120.68-51.33 51.31-120.8 81.21Q556.15-72 479.97-72Zm.03-60q137.47 0 233.23-95.74Q809-323.47 809-481q0-137.47-95.77-233.23Q617.47-810 480-810q-137.53 0-233.23 95.77Q151-618.47 151-461q0 137.53 95.77 233.23Q342.47-132 480-132Zm0-330Z"
          />
        </svg>
      </div>

      <h2 class="modal-title">Delete Quest</h2>

      <p class="confirmation-text">
        Are you sure you want to delete <strong>"{{ questTitle }}"</strong>?
      </p>

      <div v-if="taskCount > 0" class="task-warning">
        <p>
          This quest contains <strong>{{ taskCount }}</strong> task(s).
        </p>
        <p class="sub-text">What would you like to do with the tasks?</p>
      </div>

      <!-- TODO: Make styling (colors) of these buttons more consistent with the overall webapp theme -->
      <div class="action-buttons">
        <button v-if="taskCount > 0" class="button keep-tasks" @click="confirmDelete(false)">
          <!-- TODO: Move to icons store -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="currentColor"
          >
            <path
              d="M280-160q-33 0-56.5-23.5T200-240v-480q0-33 23.5-56.5T280-800h560q33 0 56.5 23.5T920-720v480q0 33-23.5 56.5T840-160H280Zm80-160h240v-80H360v80Zm-80-400v480h560v-480H280Zm-80 560v-80h80v80h-80ZM120-80v-80h80v80h-80Z"
            />
          </svg>
          Keep Tasks (Unassign)
        </button>

        <button v-if="taskCount > 0" class="button delete-all" @click="confirmDelete(true)">
          <!-- TODO: Move to icons store -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="currentColor"
          >
            <path
              d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
            />
          </svg>
          Delete Everything
        </button>

        <button v-if="taskCount === 0" class="button delete-all" @click="confirmDelete(false)">
          <!-- TODO: Move to icons store -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="20px"
            viewBox="0 -960 960 960"
            width="20px"
            fill="currentColor"
          >
            <path
              d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
            />
          </svg>
          Delete Quest
        </button>

        <button class="button cancel" @click="cancel">Cancel</button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/base/Modal.vue'

const props = defineProps<{
  modelValue: boolean
  questTitle: string
  taskCount: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', cascadeTasks: boolean): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function confirmDelete(cascadeTasks: boolean) {
  emit('confirm', cascadeTasks)
  close()
}

function cancel() {
  close()
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.delete-modal-content {
  text-align: center;
  padding: 0.5rem;
}

.warning-icon {
  margin-bottom: 1rem;
}

.modal-title {
  font-family: Trajan;
  font-size: 1.5em;
  font-weight: bold;
  margin: 0 0 1rem 0;
  color: #424242;
}

.confirmation-text {
  font-size: 1.1em;
  color: #424242;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.task-warning {
  background: #fff3e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.task-warning p {
  margin: 0.25rem 0;
  color: #e65100;
}

.task-warning .sub-text {
  font-size: 0.9em;
  color: #bf360c;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.button:hover {
  transform: translateY(-1px);
}

.button:active {
  transform: translateY(0);
}

.button.keep-tasks {
  background: #e3f2fd;
  color: #1565c0;
}

.button.keep-tasks:hover {
  background: #bbdefb;
}

.button.delete-all {
  background: #c62828;
  color: #fff;
}

.button.delete-all:hover {
  background: #b71c1c;
}

.button.cancel {
  background: #e8e8e8;
  color: #424242;
}

.button.cancel:hover {
  background: #d8d8d8;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .delete-modal-content {
    padding: 0.25rem;
  }

  .modal-title {
    font-size: 1.25em;
  }

  .confirmation-text {
    font-size: 1em;
  }

  .task-warning {
    padding: 0.875rem;
  }

  .button {
    padding: 0.75rem 1rem;
    font-size: 0.95em;
  }
}

@media (max-width: 480px) {
  .warning-icon svg {
    width: 40px;
    height: 40px;
  }

  .modal-title {
    font-size: 1.1em;
  }

  .confirmation-text {
    font-size: 0.9em;
  }

  .task-warning {
    padding: 0.75rem;
  }

  .task-warning p {
    font-size: 0.9em;
  }
}
</style>
