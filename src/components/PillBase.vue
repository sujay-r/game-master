<template>
  <div class="pill" :style="customColors">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  color?: string,
  fontColor?: string,
}>();

const customColors = computed(() => {
  const style: { [key: string]: string } = {}
  if (props.color) style.background = props.color;
  if (props.fontColor) style.color = props.fontColor;

  return style
});

</script>

<style scoped>
.pill {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0.6em 1em;
  max-height: 1.1em;
  font-size: 0.95em;
  background: #e0e0e0;
  color: #424242;
  border: none;
  border-radius: 25px;
  user-select: none;
}
</style>
