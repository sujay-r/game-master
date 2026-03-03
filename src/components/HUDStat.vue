<template>
  <div class="hudstat-container">
    <p class="hudstat-heading">{{ stat.name }}:</p>
    <ul class="hudstat-viz">
      <li>
        <div class="bar-container">
          <div
            class="progress-bar desktop-progress-bar"
            @mouseenter="showEditIcon = true"
            @mouseleave="showEditIcon = false"
          >
            <div
              class="progress-fill"
              :style="{ width: stat.value + '%', background: fillColor }"
            ></div>
            <div class="hudstat-text">{{ statText }}</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="18px"
              viewBox="0 -960 960 960"
              width="18px"
              fill="#424242"
              v-if="!showEditBox && showEditIcon"
              @click="handleShowEditBox"
              class="edit-icon"
            >
              <path
                d="M120-120v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm584-528 56-56-56-56-56 56 56 56Z"
              />
            </svg>
            <input
              v-if="showEditBox"
              v-model="tempNewValue"
              class="stat-change-input"
              type="text"
              @keydown.enter="updateStat"
              @blur="showEditBox = false"
              ref="desktopInput"
            />
          </div>
          <!-- Mobile progress bar with edit trigger -->
          <div class="progress-bar mobile-progress-bar" @click="openMobileEdit">
            <div
              class="progress-fill"
              :style="{ width: stat.value + '%', background: fillColor }"
            ></div>
            <div class="hudstat-text">{{ statText }}</div>
          </div>
        </div>
      </li>
      <li class="hudstat-effects" v-for="effect in props.effects" :key="effect.id">
        <StatusEffect
          :effect="effect"
          v-if="effect.id !== undefined"
          @delete="removeStatusEffect(effect.id)"
        />
      </li>
    </ul>
    <!-- Mobile Edit Modal -->
    <EditStatModal
      v-model="showMobileModal"
      :stat-name="stat.name"
      :current-value="stat.value"
      @save="handleMobileSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import StatusEffect from './StatusEffect.vue'
import EditStatModal from './EditStatModal.vue'
import { useStatStore } from '@/stores/resources'
import { updateStatValue, deleteStatusEffect } from '@/lib/supabase'
import type { StatType, StatusEffectType } from '@/types/common'

// TODO: Edit button still rendering under the text when progress bar is too low.

const props = defineProps<{
  stat: StatType
  effects: StatusEffectType[]
}>()

const showEditIcon = ref<boolean>(false)
const showEditBox = ref<boolean>(false)
const tempNewValue = ref<number | null>()
const showMobileModal = ref<boolean>(false)
const desktopInput = ref<HTMLInputElement | null>(null)

const stats = useStatStore()

const statText = computed(() => {
  if (props.stat.value < 25) {
    return 'Fucked.'
  } else if (25 < props.stat.value && props.stat.value < 75) {
    return 'Meh'
  } else {
    return 'Good'
  }
})

const fillColor = computed(() => {
  if (props.stat.value < 25) {
    return '#e53935'
  } else if (props.stat.value < 75) {
    return '#fbc02d'
  } else {
    return '#43a047'
  }
})

const removeStatusEffect = async (effectId: number) => {
  await deleteStatusEffect(effectId)
  await stats.fetchStatsFromDb()
}

async function updateStat() {
  if (tempNewValue.value !== null && tempNewValue.value !== undefined) {
    await updateStatValue(props.stat.id, tempNewValue.value)
    await stats.fetchStatValueFromDb(props.stat.id)
  }
  tempNewValue.value = null
  showEditBox.value = false
}

async function openMobileEdit() {
  showMobileModal.value = true
}

async function handleMobileSave(newValue: number) {
  await updateStatValue(props.stat.id, newValue)
  await stats.fetchStatValueFromDb(props.stat.id)
}

async function handleShowEditBox() {
  showEditBox.value = true
  await nextTick()
  desktopInput.value?.focus()
}
</script>

<style scoped>
.hudstat-container {
  display: inline-flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: left;
  text-align: left;
  width: auto;
  min-width: 280px;
}

.hudstat-viz {
  list-style-type: none;
  margin: 0;
  margin-top: 1px;
  padding: 0;
}

.hudstat-heading {
  font-family: 'Perpetua';
  font-size: 1.3em;
  font-weight: bold;
  margin: 0;
}

.hudstat-effects {
  margin-left: 4px;
}

.hudstat-text {
  position: absolute;
  left: 0;
  top: 0;
  margin-left: 3px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(30, 30, 40, 0.7);
  font-size: 1.1em;
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
}

.bar-container {
  display: flex;
  flex-direction: row;
}

.progress-bar {
  position: relative;
  display: flex;
  flex-direction: row;
  width: auto;
  min-width: 150px;
  height: 18px;
  background: rgba(0, 0, 0, 0);
  margin-left: 10px;
  margin-top: 2px;
  overflow: hidden;
}

.progress-bar > svg {
  display: none;
  margin-left: 6px;
}

.progress-bar:hover > svg {
  display: inline;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  transform: skewX(-20deg);
  box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.2);
  transition:
    width 0.3s,
    background 0.3s;
  text-align: left;
  color: rgb(253, 253, 253);
}

.stat-change-input {
  margin-left: 1em;
  border: none;
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: solid 1px #c7c7c7;
  width: 2em;
  transition: 0.1s border-bottom;
}

.stat-change-input:focus {
  border-bottom: solid 1px #9f9f9f;
  outline: none;
}

/* Desktop/Mobile toggle for progress bars */
.mobile-progress-bar {
  display: none;
}

@media (max-width: 768px) {
  .hudstat-container {
    min-width: auto;
    width: 100%;
    flex-wrap: wrap;
  }

  /* Show mobile progress bar, hide desktop */
  .desktop-progress-bar {
    display: none;
  }

  .mobile-progress-bar {
    display: flex;
    min-width: 120px;
    flex: 1;
    cursor: pointer;
  }

  .stat-change-input {
    width: 3em;
    font-size: 1.1em;
    padding: 0.25em;
  }
}

@media (max-width: 480px) {
  .hudstat-heading {
    font-size: 1.2em;
  }

  .mobile-progress-bar {
    min-width: 100px;
    height: 16px;
  }

  .hudstat-text {
    font-size: 1em;
  }
}
</style>
