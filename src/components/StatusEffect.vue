<template>
  <div class="effect-container">
    <p class="effect-text" :class="{ buff: props.effect.buff, debuff: !props.effect.buff }">{{
      effectSign }} {{ props.effect.text }} <span class="effect-delete" @click="deleteEffect">&times;</span></p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StatusEffectType } from '@/types/common';

const props = defineProps<{
  effect: StatusEffectType
}>();

const emits = defineEmits<{
  (e: 'delete', value: boolean): void

}>();

const effectSign = computed(() => {
  if (props.effect.buff) return '+'
  else return '-'
})

function deleteEffect() {
  emits('delete', true);
}
</script>

<style scoped>
.effect-container {
  margin: 2px 0 0;
}

.effect-text {
  font-style: italic;
  font-size: 1.2em;
  margin: 0;
}

.effect-delete {
  margin: 0;
  margin-left: 2px;
  cursor: pointer;
}

.effect-delete:hover {
  font-weight: bold;
}

.effect-delete:active {
  font-weight: bold;
  font-size: 0.95em;
}

.buff {
  color: #43a047;
}

.debuff {
  color: #e53935;
}
</style>
