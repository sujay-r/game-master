<template>
  <div class="heading-with-fleur">
    <h2 :style="{ fontSize: headingSize }">{{ headingText }}</h2>
    <img src="../assets/imgs/bottom_fleur.png" alt="">
  </div>
</template>


<script setup lang="ts">
const props = defineProps<{
  headingText: string,
  headingSize: string
}>();
</script>


<style scoped>
h2 {
  margin-bottom: 0;
}

img {
  margin-bottom: 2em;
  filter: blur(0.6px);
}
</style>
