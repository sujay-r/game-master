<template>
  <div class="heading-with-fleur">
    <h2 :style="{ fontSize: headingSize }">{{ headingText }}</h2>
    <img :src="filePath" alt="" :style="{ maxWidth: fleurSize }" />
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  headingText: string,
  headingSize: string,
  clean: boolean
}>();

const filePath = computed(() => {
  var filename = props.clean ? "bottom_fleur_clean.png" : "bottom_fleur.png";
  return new URL(`../assets/imgs/${filename}`, import.meta.url).href;
});

const fleurSize = computed(() => {
  const match = props.headingSize.match(/[\d.]+/);
  const size = match ? Number(match[0]) : null;

  return `${size * 8}em`
})
</script>


<style scoped>
h2 {
  margin-bottom: 0;
}

img {
  margin-bottom: 2em;
}
</style>
