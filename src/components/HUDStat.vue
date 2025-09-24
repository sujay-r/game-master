<template>
  <div class="hudstat-container">
    <p class="hudstat-heading">{{ props.statName }}:</p>
    <ul class="hudstat-viz">
      <li>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: props.stat + '%', background: fillColor }">
            <div class="hudstat-text">{{ statText }}</div>
          </div>
        </div>
      </li>
      <li class="hudstat-effects" v-for="effect in props.effects">
        <StatusEffect :effect="effect" />
      </li>
    </ul>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue';
import StatusEffect from './StatusEffect.vue';
import type { StatusEffectType } from '@/types/common';

const props = defineProps<{
  statName: string,
  stat: number,
  effects: StatusEffectType[]
}>()

const statText = computed(() => {
  if (props.stat < 25) {
    return "Fucked."
  }
  else if (25 < props.stat && props.stat < 75) {
    return "Meh"
  }
  else {
    return "Good"
  }
})

const fillColor = computed(() => {
  if (props.stat < 25) {
    return "#e53935"
  }
  else if (props.stat < 75) {
    return "#fbc02d"
  }
  else {
    return "#43a047"
  }
})
</script>


<style scoped>
.hudstat-container {
  display: inline-flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: left;
  text-align: left;
  width: auto;
}

.hudstat-viz {
  list-style-type: none;
  margin: 0;
  margin-top: 1px;
  padding: 0;
}

.hudstat-heading {
  font-size: 1.2em;
  font-weight: bold;
  margin: 0;
}

.hudstat-effects {
  margin-left: 4px;
}

.hudstat-text {
  margin-left: 3px;
  text-shadow: 0 2px 4px rgba(30, 30, 40, 0.7);
}

.progress-bar {
  width: 100%;
  min-width: 150px;
  height: 18px;
  background: rgba(0, 0, 0, 0);
  margin-left: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transform: skewX(-20deg);
  box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.2);
  transition: width 0.3s, background 0.3s;
  text-align: left;
  color: rgb(253, 253, 253);
}
</style>
