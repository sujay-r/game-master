<template>
  <img :src="img_path" alt="" height="350px">
</template>

<script setup lang="ts">
const props = defineProps<{
  img_path: string
}>();
</script>

<style scoped>
img {
  height: auto;
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
