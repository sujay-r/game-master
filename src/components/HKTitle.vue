<template>
  <component :is="headingTag">
    <img :src="img_path" alt="" :height="imgHeight">
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  img_path: string
  size?: number
}>();

const headingTag = computed(() => {
  const s = props.size && props.size >= 1 && props.size <= 6 ? props.size : 1;
  return `h${s}`;
});

const sizeToHeight = [350, 300, 250, 200, 150, 100];
const imgHeight = computed(() => {
  const s = props.size && props.size >= 1 && props.size <= 6 ? props.size : 1;
  return sizeToHeight[s - 1] + 'px';
});
</script>

<style scoped>
img {
  max-height: 350px;
  display: block;
  margin: 0 auto;
}

@media (max-width: 900px) {
  img {
    width: 100vw;
  }
}
</style>
