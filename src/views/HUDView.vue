<template>
  <HKTitle img_path="/src/assets/imgs/thestats_alt.png" />
  <p v-if="!stats.stats.length" class="loading-message">Loading stats...</p>
  <div v-else v-for="stat in stats.stats" :key="stat.id" class="stat-container">
    <HUDStat :stat-name="stat.name" :stat="stat.value" :effects="stat.effects" />
  </div>
  <button class="stat-button stat-add" @click="modalOpen = true">+ Status Effect</button>
  <Modal v-model="modalOpen" :include-close-button="false">
    <div class="stat-add-container">
      <h2>Add Status Effect</h2>
      <hr class="stat-add-hr">
      <div class="stat-add-input-row">
        <label for="effectName" class="stat-add-input-label">Effect: </label>
        <input type="text" id="effectName" v-model="tempStatusEffectText" placeholder="Enter status effect here">
      </div>
      <div class="stat-add-input-row">
        <label for="effectBuff" class="stat-add-input-label">Buff?</label>
        <input type="checkbox" id="effectBuff" v-model="tempStatusEffectBuffBool">
      </div>
      <div class="stat-add-input-row">
        <label for="statSelect" class="stat-add-input-label">Affects which stats: </label>
        <MultiselectDropdown :options="stats.stats" v-model="tempStatusEffectSelectedStats" />
      </div>
      <div class="stat-add-input-button">
        <button class="stat-button longer-button" @click="createNewStatusEffect">Add</button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import HUDStat from '@/components/HUDStat.vue';
import Modal from '@/components/Modal.vue';
import HKTitle from '@/components/HKTitle.vue';
import MultiselectDropdown from '@/components/MultiselectDropdown.vue';
import { useStatStore } from '@/stores/resources';
import { addStatusEffect } from '@/lib/supabase';
import { ref, onMounted } from 'vue';
import type { StatType, StatusEffectType } from '@/types/common';

const stats = useStatStore();
const modalOpen = ref<boolean>(false);
const tempStatusEffectText = ref<string>("");
const tempStatusEffectBuffBool = ref<boolean>(false);
const tempStatusEffectSelectedStats = ref<StatType[]>([])

// TODO: Use grid layout to arrange status add screen input form.

onMounted(() => {
  if (!stats.stats.length) {
    stats.fetchStatsFromDb();
  }
})

const createNewStatusEffect = async () => {
  const newStatusEffect: StatusEffectType = {
    text: tempStatusEffectText.value,
    buff: tempStatusEffectBuffBool.value
  }
  await addStatusEffect(newStatusEffect, tempStatusEffectSelectedStats.value);
  resetStatusEffectInputFields();
  modalOpen.value = false;
  await stats.fetchStatsFromDb();
}

const resetStatusEffectInputFields = () => {
  tempStatusEffectText.value = "";
  tempStatusEffectBuffBool.value = false;
  tempStatusEffectSelectedStats.value = [];
}

</script>


<style scoped>
.loading-message {
  text-align: left;
  margin: 0 0 0 30%;
}

.stat-container {
  display: flex;
  margin: 1.5rem 0 0 30%;
}

.stat-button {
  background-color: #32A287;
  border-radius: 20px;
  font-family: "Perpetua", serif;
  font-size: 1.1em;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  color: #fff;
  cursor: pointer;
  padding: 1rem 1.3rem;
  border: none;
}

.stat-button:hover {
  background-color: #4BAB91;
}

.stat-button:active {
  background-color: #2D826D;
}

.stat-add {
  display: flex;
  margin: 1.5rem 0 0 30%;
}

.stat-add-container {
  display: flex;
  flex-direction: column;
}

.stat-add-hr {
  margin-top: 0;
  width: 100%;
}

.stat-add-input-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 1rem;
}

.stat-add-input-row input[type="text"] {
  background: transparent;
  border: 1px solid #C7C7C7;
  border-radius: 8px;
  padding: 0.5em 1em;
  font-size: 1em;
  font-family: 'Perpetua', serif;
  color: #424242;
  outline: none;
  transition: border-color 0.2s;
  box-shadow: none;
}

.stat-add-input-row input[type="text"]:focus {
  border-color: #4BAB91;
}

.stat-add-input-row input[type="checkbox"] {
  appearance: none;
  width: 1.2em;
  height: 1.2em;
  border: 1.5px solid #C7C7C7;
  border-radius: 5px;
  background: transparent;
  margin-top: 4px;
  margin-right: 0.7em;
  position: relative;
  vertical-align: middle;
  cursor: pointer;
  transition: border-color 0.2s;
}

.stat-add-input-row input[type="checkbox"]:checked {
  background-color: #32A287;
  border-color: #4BAB91;
}

.stat-add-input-row input[type="checkbox"]:checked::after {
  content: '';
  display: block;
  position: absolute;
  left: 0.32em;
  top: 0.15em;
  width: 0.3em;
  height: 0.6em;
  border: solid #fff;
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg);
}

.stat-add-input-label {
  font-size: 1.2em;
  margin: auto 0;
  margin-right: 1rem;
}

.stat-add-input-button {
  margin: 1em auto;
}

.longer-button {
  width: 6em;
}
</style>
