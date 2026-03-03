<template>
  <div class="assignment-dropdown" v-click-outside="closeDropdown">
    <label v-if="label" class="dropdown-label">{{ label }}</label>

    <div class="dropdown-trigger" @click="toggleDropdown">
      <span class="current-assignment" :class="{ unassigned: !currentQuestId }">
        <!-- TODO: Move to icons store -->
        <svg
          v-if="currentQuestId"
          xmlns="http://www.w3.org/2000/svg"
          height="18px"
          viewBox="0 -960 960 960"
          width="18px"
          fill="currentColor"
        >
          <path
            d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-640v560h560v-560h-80v280l-100-60-100 60v-280H200Zm0 0v560-560Z"
          />
        </svg>
        <!-- TODO: Move to icons store -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          height="18px"
          viewBox="0 -960 960 960"
          width="18px"
          fill="currentColor"
        >
          <path
            d="M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z"
          />
        </svg>
        {{ currentAssignmentLabel }}
      </span>
      <span class="dropdown-arrow" :class="{ open: isOpen }">
        <!-- TODO: Move to icons store -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="#666"
        >
          <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
        </svg>
      </span>
    </div>

    <div v-if="isOpen" class="dropdown-menu">
      <div
        class="dropdown-item unassigned"
        :class="{ selected: !currentQuestId }"
        @click.stop="selectQuest(null)"
      >
        <!-- TODO: Move to icons store -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="18px"
          viewBox="0 -960 960 960"
          width="18px"
          fill="currentColor"
        >
          <path
            d="M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z"
          />
        </svg>
        <span>Unassigned</span>
      </div>

      <div class="dropdown-divider"></div>

      <div class="dropdown-section-title">Main Quests</div>
      <div
        v-for="quest in mainQuests"
        :key="quest.id"
        class="dropdown-item"
        :class="{ selected: currentQuestId === quest.id }"
        @click.stop="selectQuest(quest.id)"
      >
        <span class="quest-indicator main"></span>
        <span class="quest-name">{{ quest.title }}</span>
      </div>

      <div v-if="sideQuests.length > 0" class="dropdown-section-title">Side Quests</div>
      <div
        v-for="quest in sideQuests"
        :key="quest.id"
        class="dropdown-item"
        :class="{ selected: currentQuestId === quest.id }"
        @click.stop="selectQuest(quest.id)"
      >
        <span class="quest-indicator side"></span>
        <span class="quest-name">{{ quest.title }}</span>
      </div>

      <div v-if="lifeAdminQuests.length > 0" class="dropdown-section-title">Life Admin</div>
      <div
        v-for="quest in lifeAdminQuests"
        :key="quest.id"
        class="dropdown-item"
        :class="{ selected: currentQuestId === quest.id }"
        @click.stop="selectQuest(quest.id)"
      >
        <span class="quest-indicator lifeAdmin"></span>
        <span class="quest-name">{{ quest.title }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Quest, QuestType } from '@/types/common'

const props = defineProps<{
  modelValue: number | null | undefined
  quests: Quest[]
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const isOpen = ref(false)

const currentQuestId = computed({
  get: () => props.modelValue ?? null,
  set: (value) => emit('update:modelValue', value),
})

const mainQuests = computed(() => props.quests.filter((q) => q.type === ('main' as QuestType)))

const sideQuests = computed(() => props.quests.filter((q) => q.type === ('side' as QuestType)))

const lifeAdminQuests = computed(() =>
  props.quests.filter((q) => q.type === ('lifeAdmin' as QuestType)),
)

const currentQuest = computed(() => props.quests.find((q) => q.id === currentQuestId.value))

const currentAssignmentLabel = computed(() => {
  if (currentQuest.value) {
    return currentQuest.value.title
  }
  return 'Unassigned'
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function selectQuest(questId: number | null) {
  currentQuestId.value = questId
  isOpen.value = false
}

// Click outside handler storage
const clickOutsideHandlers = new WeakMap<HTMLElement, (event: Event) => void>()

// Click outside directive
const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    const handler = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    clickOutsideHandlers.set(el, handler)
    document.addEventListener('click', handler)
  },
  unmounted(el: HTMLElement) {
    const handler = clickOutsideHandlers.get(el)
    if (handler) {
      document.removeEventListener('click', handler)
      clickOutsideHandlers.delete(el)
    }
  },
}
</script>

<style scoped>
.assignment-dropdown {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dropdown-label {
  font-size: 0.875em;
  font-weight: 600;
  color: #666;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.dropdown-trigger:hover {
  border-color: #32a287;
}

.current-assignment {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95em;
  color: #424242;
}

.current-assignment.unassigned {
  color: #999;
  font-style: italic;
}

.dropdown-arrow {
  display: flex;
  align-items: center;
  transition: transform 0.2s;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
  animation: dropdownSlide 0.15s ease-out;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item.selected {
  background: #e8f5e9;
}

.dropdown-item.unassigned {
  color: #666;
}

.dropdown-item.unassigned.selected {
  background: #f5f5f5;
  font-weight: 500;
}

.dropdown-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 0.25rem 0;
}

.dropdown-section-title {
  padding: 0.5rem 0.875rem;
  font-size: 0.75em;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quest-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.quest-indicator.main {
  background: #c9a227;
}

.quest-indicator.side {
  background: #6b8cae;
}

.quest-indicator.lifeAdmin {
  background: #20b2aa;
}

.quest-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
