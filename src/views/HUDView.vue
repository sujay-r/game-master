<template>
  <h1>HUD</h1>
  <hr>
  <p v-if="!stats.stats.length" class="loading-message">Loading stats...</p>
  <div v-else v-for="stat in stats.stats" class="stat-container">
    <HUDStat :stat-name="stat.name" :stat="stat.value" :effects="stat.effects" />
  </div>
  <button class="stat-add" @click="modalOpen = true">+ Status Effect</button>
  <Modal v-model="modalOpen">
    <div class="stat-add-container">
      <h2>Add Status Effect</h2>
      <div class="stat-add-input-row">
        <label for="effectName" class="stat-add-input-label">Effect: </label>
        <input type="text" id="effectName">
      </div>
      <div class="stat-add-input-row">
        <label for="effectBuff" class="stat-add-input-label">Buff?</label>
        <input type="checkbox" id="effectBuff">
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import HUDStat from '@/components/HUDStat.vue';
import Modal from '@/components/Modal.vue';
import { useStatStore } from '@/stores/resources';
import { addStatusEffect } from '@/lib/supabase';
import { ref, onMounted } from 'vue';
import type { StatType, StatusEffectType } from '@/types/common';

const stats = useStatStore();
const modalOpen = ref(false);

onMounted(() => {
  if (!stats.stats.length) {
    stats.fetchStatsFromDb();
  }
})

const handleClick = async (statusEffect: StatusEffectType, selectedStats: StatType[]) => {
  await addStatusEffect(statusEffect, selectedStats);
  await stats.fetchStatsFromDb();
}

</script>


<style scoped>
.loading-message {
  text-align: left;
  margin: 0 0 0 15%;
}

.stat-container {
  display: flex;
  margin: 1.5rem 0 0 15%;
}

.stat-add {
  display: flex;
  margin: 1.5rem 0 0 15%;
  border: none;
  padding: 1rem 1.3rem;
  background-color: #32A287;
  border-radius: 20px;
  font-family: 'Crimson Text';
  font-size: 1em;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  color: #fff;
  cursor: pointer;
}

.stat-add:hover {
  background-color: #4BAB91;
}

.stat-add:active {
  background-color: #2D826D;
}

.stat-add-container {
  display: flex;
  flex-direction: column;
}

.stat-add-input-row {
  display: flex;
  flex-direction: row;
  margin-top: 1rem;
}

.stat-add-input-label {
  margin-right: 1rem;
}
</style>
