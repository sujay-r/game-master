<template>
  <div class="effect-container">
    <p class="effect-text" :class="{ buff: props.effect.buff, debuff: !props.effect.buff }">{{
      effectSign }} {{ props.effect.text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StatusEffectType } from '@/types/common';

const props = defineProps<{
  effect: StatusEffectType
}>()


const effectSign = computed(() => {
  if (props.effect.buff) return '+'
  else return '-'
})
</script>

<style scoped>
.effect-container {
  margin: 5px 0 0;
}

.effect-text {
  font-style: oblique;
  margin: 0;
}

.buff {
  color: #43a047;
}

.debuff {
  color: #e53935;
}
</style>
