<template>
  <div class="floating-display" :style="containerStyle">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  backgroundColor?: string
  borderRadius?: string
  padding?: string
  shadow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  backgroundColor: '#f7f7f4',
  borderRadius: '12px',
  padding: '0.75rem 1rem',
  shadow: true,
})

const containerStyle = computed(() => {
  const shadowStyle = props.shadow
    ? '0 2px 8px rgba(0, 0, 0, 0.08), 0 1.5px 4px rgba(0, 0, 0, 0.06)'
    : 'none'

  return {
    backgroundColor: props.backgroundColor,
    borderRadius: props.borderRadius,
    padding: props.padding,
    boxShadow: shadowStyle,
  }
})
</script>

<style scoped>
.floating-display {
  display: inline-flex;
}
</style>
