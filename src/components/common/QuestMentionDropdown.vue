<template>
  <div class="mention-dropdown" v-if="hasVisibleQuests">
    <template v-if="isSearching">
      <div
        v-for="(quest, index) in filteredQuests"
        :key="quest.id"
        class="mention-item"
        :class="{ selected: index === selectedIndex }"
        @click="selectItem(quest)"
        @mouseenter="selectedIndex = index"
      >
        <span class="quest-type-dot" :class="quest.type"></span>
        <span class="quest-title">{{ quest.title }}</span>
      </div>
    </template>

    <template v-else>
      <div v-if="groupedQuests.main.length > 0" class="quest-group">
        <div class="group-header">Main Quests</div>
        <div
          v-for="(quest, index) in groupedQuests.main"
          :key="quest.id"
          class="mention-item"
          :class="{ selected: isSelected('main', index) }"
          @click="selectItem(quest)"
          @mouseenter="setSelectedIndex('main', index)"
        >
          <span class="quest-type-dot main"></span>
          <span class="quest-title">{{ quest.title }}</span>
        </div>
      </div>

      <div v-if="groupedQuests.side.length > 0" class="quest-group">
        <div class="group-header">Side Quests</div>
        <div
          v-for="(quest, index) in groupedQuests.side"
          :key="quest.id"
          class="mention-item"
          :class="{ selected: isSelected('side', index) }"
          @click="selectItem(quest)"
          @mouseenter="setSelectedIndex('side', index)"
        >
          <span class="quest-type-dot side"></span>
          <span class="quest-title">{{ quest.title }}</span>
        </div>
      </div>

      <div v-if="groupedQuests.lifeAdmin.length > 0" class="quest-group">
        <div class="group-header">Life Admin</div>
        <div
          v-for="(quest, index) in groupedQuests.lifeAdmin"
          :key="quest.id"
          class="mention-item"
          :class="{ selected: isSelected('lifeAdmin', index) }"
          @click="selectItem(quest)"
          @mouseenter="setSelectedIndex('lifeAdmin', index)"
        >
          <span class="quest-type-dot lifeAdmin"></span>
          <span class="quest-title">{{ quest.title }}</span>
        </div>
      </div>
    </template>
  </div>

  <div v-else class="mention-dropdown mention-empty">No quests found</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Quest } from '@/types/common'

type QuestGroupKey = 'main' | 'side' | 'lifeAdmin'

const props = defineProps<{
  items: Quest[]
  query: string
  currentQuestId?: number
}>()

const emit = defineEmits<{
  (e: 'select', quest: Quest): void
}>()

const selectedGroup = ref<QuestGroupKey>('main')
const selectedIndex = ref(0)
const currentItems = ref<Quest[]>(props.items)
const currentQuery = ref(props.query)

function updateData(newItems: Quest[], newQuery: string) {
  currentItems.value = newItems
  currentQuery.value = newQuery
}

const isSearching = computed(() => currentQuery.value.length > 0)

const availableQuests = computed(() => {
  return currentItems.value.filter((quest) => quest.id !== props.currentQuestId)
})

const filteredQuests = computed(() => {
  let quests = availableQuests.value

  if (currentQuery.value) {
    const lowerQuery = currentQuery.value.toLowerCase()
    quests = quests.filter((quest) => quest.title.toLowerCase().includes(lowerQuery))
  }

  return quests.slice(0, 8)
})

const groupedQuests = computed(() => {
  const groups: Record<QuestGroupKey, Quest[]> = {
    main: [],
    side: [],
    lifeAdmin: [],
  }

  availableQuests.value.forEach((quest) => {
    groups[quest.type].push(quest)
  })

  return groups
})

const hasVisibleQuests = computed(() => {
  if (isSearching.value) {
    return filteredQuests.value.length > 0
  }
  return Object.values(groupedQuests.value).some((group) => group.length > 0)
})

function setSelectedIndex(group: QuestGroupKey, index: number) {
  selectedGroup.value = group
  selectedIndex.value = index
}

function isSelected(group: QuestGroupKey, index: number): boolean {
  return selectedGroup.value === group && selectedIndex.value === index
}

function selectItem(quest: Quest) {
  emit('select', quest)
}

function onKeyDown(event: KeyboardEvent): boolean {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    navigateList(event.key === 'ArrowDown' ? 1 : -1)
    return true
  }

  if (event.key === 'Enter') {
    const quest = isSearching.value
      ? filteredQuests.value[selectedIndex.value]
      : groupedQuests.value[selectedGroup.value][selectedIndex.value]
    if (quest) {
      selectItem(quest)
    }
    return true
  }

  return false
}

function navigateList(direction: 1 | -1) {
  if (isSearching.value) {
    selectedIndex.value =
      (selectedIndex.value + direction + filteredQuests.value.length) % filteredQuests.value.length
    return
  }

  const groups: QuestGroupKey[] = ['main', 'side', 'lifeAdmin']
  const currentGroupIndex = groups.indexOf(selectedGroup.value)
  const currentGroup = groupedQuests.value[selectedGroup.value]

  const newIndex = selectedIndex.value + direction

  if (newIndex >= 0 && newIndex < currentGroup.length) {
    selectedIndex.value = newIndex
  } else if (newIndex < 0 && currentGroupIndex > 0) {
    // Move to previous group
    for (let i = currentGroupIndex - 1; i >= 0; i--) {
      const prevGroup = groups[i]
      const prevGroupQuests = groupedQuests.value[prevGroup]
      if (prevGroupQuests.length > 0) {
        selectedGroup.value = prevGroup
        selectedIndex.value = prevGroupQuests.length - 1
        break
      }
    }
  } else if (newIndex >= currentGroup.length && currentGroupIndex < groups.length - 1) {
    // Move to next group
    for (let i = currentGroupIndex + 1; i < groups.length; i++) {
      const nextGroup = groups[i]
      const nextGroupQuests = groupedQuests.value[nextGroup]
      if (nextGroupQuests.length > 0) {
        selectedGroup.value = nextGroup
        selectedIndex.value = 0
        break
      }
    }
  }
}

watch([() => props.query, () => props.items], () => {
  selectedGroup.value = 'main'
  selectedIndex.value = 0
})

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

.quest-group {
  margin-bottom: 0.5rem;
}

.quest-group:last-child {
  margin-bottom: 0;
}

.group-header {
  font-size: 0.75em;
  font-weight: 600;
  color: #929292;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.5rem 0.75rem 0.25rem;
  margin-bottom: 0.25rem;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.mention-item:hover,
.mention-item.selected {
  background: #f7f7f4;
}

.quest-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.quest-type-dot.main {
  background: #c9a227;
}

.quest-type-dot.side {
  background: #6b8cae;
}

.quest-type-dot.lifeAdmin {
  background: #20b2aa;
}

.quest-title {
  font-weight: 500;
  color: #424242;
  font-size: 0.95em;
}
</style>
