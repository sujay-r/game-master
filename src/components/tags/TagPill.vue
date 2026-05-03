<template>
  <span class="tag-pill" :style="pillStyle">
    {{ tag.name }}
    <span v-if="removable" class="tag-pill__remove" @click.stop="handleRemove">&times;</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Tag } from '@/types/common'

const props = defineProps<{
  tag: Tag
  removable?: boolean
}>()

const emit = defineEmits<{
  (e: 'remove', tag: Tag): void
}>()

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#424242' : '#ffffff'
}

const pillStyle = computed(() => {
  const bg = props.tag.color || '#32a287'
  return {
    backgroundColor: bg,
    color: getContrastColor(bg),
  }
})

function handleRemove() {
  emit('remove', props.tag)
}
</script>

<style scoped>
.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.05rem 0.45rem;
  border-radius: 12px;
  font-size: 0.82em;
  font-weight: 600;
  line-height: 1.2;
  user-select: none;
}

.tag-pill__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1em;
  opacity: 0.7;
  transition: opacity 0.2s, background-color 0.2s;
  margin-left: 0.1rem;
}

.tag-pill__remove:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.15);
}
</style>
