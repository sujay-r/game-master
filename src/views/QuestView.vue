<template>
  <HKTitle :img_path="questsTitleURL" :size="1" />
  <Task v-for="task in tasks" :task="task" />
</template>

<script setup lang="ts">
import HKTitle from '@/components/HKTitle.vue';
import Task from '@/components/Task.vue';
import type { TaskType } from '@/types/common';
import { fetchTasksWithOutcomes } from '@/lib/supabase';
import { ref, onMounted } from 'vue';

const questsTitleURL = new URL('@/assets/imgs/theQuests.png', import.meta.url).href
const tasks = ref<TaskType[]>([]);


onMounted(async () => {
  tasks.value = await fetchTasksWithOutcomes();
})

</script>

<style scoped></style>
