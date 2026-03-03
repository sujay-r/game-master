<template>
  <component :is="headingTag">
    <img :src="img_path" alt="" :height="imgHeight" />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  img_path: string
  size?: number
}>()

const headingTag = computed(() => {
  const s = props.size && props.size >= 1 && props.size <= 6 ? props.size : 1
  return `h${s}`
})

const sizeToHeight = [350, 300, 250, 200, 150, 100]
const imgHeight = computed(() => {
  const s = props.size && props.size >= 1 && props.size <= 6 ? props.size : 1
  return sizeToHeight[s - 1] + 'px'
})
</script>

<style scoped>
img {
  max-height: 350px;
  height: auto;
  max-width: 100%;
  display: block;
  margin: 0 auto;
  object-fit: contain;
}

/* Tablet and smaller desktops */
@media (max-width: 768px) {
  img {
    max-height: 35vh;
  }
}

/* Mobile devices */
@media (max-width: 480px) {
  img {
    max-height: 25vh;
    max-width: 95%;
  }
}

/* Small mobile devices */
@media (max-width: 375px) {
  img {
    max-height: 20vh;
  }
}
</style>
