<template>
  <HKTitle :img_path="questsTitleURL" :size="1" />
  <Task v-for="task in tasks" :task="task" />
  <div class="token-count-wrapper">
    <TokenCountDisplay />
  </div>
</template>

<script setup lang="ts">
import HKTitle from '@/components/HKTitle.vue'
import Task from '@/components/Task.vue'
import TokenCountDisplay from '@/components/TokenCountDisplay.vue'
import type { TaskType } from '@/types/common'
import { fetchTasksWithOutcomes } from '@/lib/supabase'
import { ref, onMounted } from 'vue'

const questsTitleURL = new URL('@/assets/imgs/theQuests.png', import.meta.url).href
const tasks = ref<TaskType[]>([])

onMounted(async () => {
  tasks.value = await fetchTasksWithOutcomes()
})
</script>

<style scoped>
.token-count-wrapper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}
</style>
