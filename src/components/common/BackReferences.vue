<template>
  <div
    v-if="totalCount > 0"
    class="back-references"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <span class="back-ref-trigger">
      Referenced in {{ totalCount }} other item{{ totalCount === 1 ? '' : 's' }}
    </span>

    <Transition name="fade">
      <div v-if="showTooltip" class="back-ref-tooltip">
        <div v-if="taskReferences.length > 0" class="ref-section">
          <strong>Tasks:</strong>
          <ul>
            <li v-for="ref in taskReferences" :key="ref.id" class="ref-item">
              {{ ref.title }}
            </li>
          </ul>
        </div>

        <div v-if="questReferences.length > 0" class="ref-section">
          <strong>Quests:</strong>
          <ul>
            <li v-for="ref in questReferences" :key="ref.id" class="ref-item">
              {{ ref.title }}
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ReferenceType, type BackReference } from '@/types/common'

const props = defineProps<{
  references?: BackReference[]
}>()

const showTooltip = ref(false)

// TODO: Make back-references clickable when implementing navigation
// Currently shows the list but items are not clickable
// When implementing:
// 1. Add 'open-task' and 'open-quest' emits
// 2. Add @click handlers to li elements
// 3. Call emit('open-task', taskId) / emit('open-quest', questId)
// 4. Parent should handle opening the appropriate modal

const taskReferences = computed(() =>
  (props.references || []).filter((ref) => ref.type === ReferenceType.Task),
)

const questReferences = computed(() =>
  (props.references || []).filter((ref) => ref.type === ReferenceType.Quest),
)

const totalCount = computed(() => taskReferences.value.length + questReferences.value.length)
</script>

<style scoped>
.back-references {
  position: relative;
  display: inline-block;
  margin-top: 0.75rem;
}

.back-ref-trigger {
  font-size: 0.85em;
  color: #929292;
  cursor: pointer;
  transition: color 0.2s;
}

.back-ref-trigger:hover {
  color: #32a287;
  text-decoration: underline;
}

.back-ref-tooltip {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 0.5rem;
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 0.75rem;
  min-width: 200px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
}

.ref-section {
  margin-bottom: 0.75rem;
}

.ref-section:last-child {
  margin-bottom: 0;
}

.ref-section strong {
  display: block;
  font-size: 0.8em;
  color: #929292;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.ref-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ref-item {
  padding: 0.375rem 0.5rem;
  border-radius: 6px;
  font-size: 0.9em;
  color: #424242;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
