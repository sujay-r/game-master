<template>
  <HKTitle :img_path="questsTitleURL" :size="1" />
  <Task :task="dummyTask" />
</template>

<script setup lang="ts">
import HKTitle from '@/components/HKTitle.vue';
import Task from '@/components/Task.vue';
import { type TaskType, TaskStatus } from '@/types/common';

const questsTitleURL = new URL('@/assets/imgs/theQuests.png', import.meta.url).href
const dummyTask: TaskType = {
  title: "Dummy task",
  description: "Description for the dummy task.",
  status: TaskStatus.Todo,
  notes: "",
  createdAt: ""
}

</script>

<style scoped></style>
