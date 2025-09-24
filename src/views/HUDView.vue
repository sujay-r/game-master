<template>
  <h1>HUD</h1>
  <hr>
  <div v-for="stat in stats.stats" class="stat-container">
    <HUDStat :stat-name="stat.statName" :stat="stat.stat" :effects="stat.effects" />
  </div>
</template>

<script setup lang="ts">
import HUDStat from '@/components/HUDStat.vue';
import { useStatStore } from '@/stores/resources';

const stats = useStatStore();

</script>


<style>
.stat-container {
  display: flex;
  margin: 1.5rem 0 0 15%;
}
</style>
