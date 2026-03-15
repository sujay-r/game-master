<template>
  <div class="heading-with-fleur">
    <h2 :style="{ fontSize: headingSize }">{{ headingText }}</h2>
    <img :src="filePath" alt="" :style="{ maxWidth: fleurSize }" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  headingText: string
  headingSize: string
  clean: boolean
}>()

const filePath = computed(() => {
  const filename = props.clean ? 'bottom_fleur_clean.png' : 'bottom_fleur.png'
  return new URL(`../assets/imgs/${filename}`, import.meta.url).href
})

const fleurSize = computed(() => {
  const match = props.headingSize.match(/[\d.]+/)
  const size = match ? Number(match[0]) : null

  if (size) {
    return `${size * 8}em`
  }
  return '8em'
})
</script>

<style scoped>
.heading-with-fleur {
  text-align: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

h2 {
  margin-bottom: 0;
  margin-top: 0;
  margin-left: 0;
  margin-right: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  line-height: 1.2;
}

img {
  margin-bottom: 2em;
  max-width: 100%;
  height: auto;
}

/* Large phones (≤430px) - Scale heading less, fleur more for 30% ratio */
@media (max-width: 430px) {
  .heading-with-fleur h2 {
    font-size: 135% !important;
  }
  .heading-with-fleur img {
    max-width: 40% !important;
  }
}

/* Standard phones (≤395px) */
@media (max-width: 395px) {
  .heading-with-fleur h2 {
    font-size: 130% !important;
  }
  .heading-with-fleur img {
    max-width: 35% !important;
  }
}

/* Small phones (≤375px) */
@media (max-width: 375px) {
  .heading-with-fleur h2 {
    font-size: 125% !important;
  }
  .heading-with-fleur img {
    max-width: 32% !important;
  }
}
</style>
