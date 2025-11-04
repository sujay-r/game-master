<template>
  <HKTitle :img_path="questsTitleURL" :size="1" />
</template>

<script setup lang="ts">
import HKTitle from '@/components/HKTitle.vue';

const questsTitleURL = new URL('@/assets/imgs/theQuests.png', import.meta.url).href

</script>

<style scoped></style>
