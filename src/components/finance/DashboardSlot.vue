<template>
  <div class="dashboard-slot" :class="{ 'dashboard-slot--error': hasError }" :data-testid="testId">
    <div v-if="hasError" class="dashboard-slot__error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h3 class="dashboard-slot__error-title">Something went wrong</h3>
      <p class="dashboard-slot__error-message">
        This section couldn't load. The rest of the dashboard is still working.
      </p>
      <button type="button" class="dashboard-slot__retry" @click="resetError">Try again</button>
    </div>
    <ThrowingPlaceholder v-else-if="forceThrow" />
    <slot v-else />
    <button
      v-if="enableErrorToggle && !hasError && !forceThrow"
      type="button"
      class="dashboard-slot__throw"
      aria-label="Throw error"
      @click="forceThrow = true"
    >
      Throw Error
    </button>
  </div>
</template>

<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'
import ThrowingPlaceholder from '@/components/finance/ThrowingPlaceholder.vue'

const props = defineProps<{
  testId?: string
  enableErrorToggle?: boolean
}>()

const hasError = ref(false)
const errorMessage = ref('')
const forceThrow = ref(false)

onErrorCaptured((err) => {
  hasError.value = true
  errorMessage.value = err instanceof Error ? err.message : String(err)
  console.error(`DashboardSlot (${props.testId ?? 'unnamed'}) caught error:`, err)
  return false
})

function resetError() {
  hasError.value = false
  errorMessage.value = ''
  forceThrow.value = false
}
</script>

<style scoped>
.dashboard-slot {
  position: relative;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.dashboard-slot--error {
  background: #fff5f5;
  border-color: #ffcdd2;
}

.dashboard-slot__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
  flex: 1;
  color: #c62828;
}

.dashboard-slot__error-title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 1.1em;
  margin: 0;
}

.dashboard-slot__error-message {
  font-size: 0.9em;
  color: #666;
  margin: 0;
}

.dashboard-slot__retry {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #c62828;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: Trajan, 'Perpetua', serif;
  font-size: 0.85em;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dashboard-slot__retry:hover {
  background: #a32121;
}

.dashboard-slot__throw {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-family: Perpetua, Avenir, Helvetica, Arial, sans-serif;
  font-size: 0.75em;
  color: #666;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}

.dashboard-slot__throw:hover {
  border-color: #c62828;
  color: #c62828;
}
</style>
