<template>
  <img :src="img_path" alt="" height="350px">
</template>

<script setup lang="ts">
const props = defineProps<{
  img_path: string
}>();
</script>

<style scoped></style>
