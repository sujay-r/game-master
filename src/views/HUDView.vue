<template>
  <HKTitle :img_path="hudTitleURL" :size="1" />

  <!-- Stats section -->
  <HeadingFleur heading-text="Stats" heading-size="3.9em" :clean="true" />
  <p v-if="!stats.stats.length" class="loading-message">Loading stats...</p>
  <div v-else class="stat-container">
    <HUDStat v-for="stat in stats.stats" :key="stat.id" :stat="stat" :effects="stat.effects" />
  </div>
  <div class="stat-add-button-container">
    <button class="stat-button stat-add" @click="modalOpen = true">+ Status Effect</button>
  </div>
  <Modal v-model="modalOpen" :include-close-button="false">
    <div class="stat-add-container">
      <HeadingFleur heading-text="Add Status Effect" heading-size="1.8em" :clean="false" />
      <div class="input-grid">
        <label for="effectName" class="stat-add-input-label">Effect: </label>
        <input type="text" id="effectName" v-model="tempStatusEffectText" placeholder="Enter status effect here">
        <label for="effectBuff" class="stat-add-input-label">Buff?</label>
        <input type="checkbox" id="effectBuff" v-model="tempStatusEffectBuffBool">
        <label for="statSelect" class="stat-add-input-label">Affects which stats: </label>
        <MultiselectDropdown :options="stats.stats" v-model="tempStatusEffectSelectedStats" />
      </div>
      <div class="stat-add-input-button">
        <button class="stat-button longer-button" @click="createNewStatusEffect">Add</button>
      </div>
    </div>
  </Modal>

  <!-- Quests section -->
  <HeadingFleur heading-text="Quests" heading-size="3.9em" :clean="true" />
</template>

<script setup lang="ts">
import HUDStat from '@/components/HUDStat.vue';
import Modal from '@/components/Modal.vue';
import HKTitle from '@/components/HKTitle.vue';
import HeadingFleur from '@/components/HeadingFleur.vue';
import MultiselectDropdown from '@/components/MultiselectDropdown.vue';
import { useStatStore } from '@/stores/resources';
import { addStatusEffect } from '@/lib/supabase';
import { ref, onMounted } from 'vue';
import type { StatType, StatusEffectType } from '@/types/common';

// TODO: Replace the bottom fleur of the Stats and Quests heading with the voidheart one.
// TODO: Make Add Status Effect Modal responsive.
// TODO: Add validation to prevent blank status effects from being added.

const stats = useStatStore();
const modalOpen = ref<boolean>(false);
const tempStatusEffectText = ref<string>("");
const tempStatusEffectBuffBool = ref<boolean>(false);
const tempStatusEffectSelectedStats = ref<StatType[]>([])

const hudTitleURL = new URL('@/assets/imgs/TheHUD.png', import.meta.url).href

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
  margin: 0 0 0 35%;
}

.stat-container {
  text-align: left;
  max-width: 60rem;
  display: grid;
  margin-left: 35%;
  grid-template-columns: 1fr 1fr;
  row-gap: 2em;
  column-gap: 35%;
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

.stat-add-button-container {
  margin: 0 auto;
}

.stat-button:hover {
  background-color: #4BAB91;
}

.stat-button:active {
  background-color: #2D826D;
}

.stat-add {
  display: flex;
  margin-top: 2.5rem;
  margin-left: 47%;
}

.stat-add-container {
  display: flex;
  flex-direction: column;
}

.stat-add-hr {
  margin-top: 0;
  margin-bottom: 1.5em;
  width: 100%;
}

.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 1.5em;
}

.input-grid input[type="text"] {
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

.input-grid input[type="text"]:focus {
  border-color: #4BAB91;
}

.input-grid input[type="checkbox"] {
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

.input-grid input[type="checkbox"]:checked {
  background-color: #32A287;
  border-color: #4BAB91;
}

.input-grid input[type="checkbox"]:checked::after {
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

@media (max-width: 900px) {
  .stat-container {
    margin-left: 0;
    grid-template-columns: 1fr;
    column-gap: 0;
    max-width: 100%;
  }

  .loading-message {
    margin: 0 0 1em 0;
    text-align: center;
  }

  .stat-add {
    margin-left: 0;
    justify-content: center;
  }

  .input-grid {
    grid-template-columns: 1fr;
  }
}
</style>
