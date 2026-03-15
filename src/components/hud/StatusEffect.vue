<template>
  <div class="effect-container">
    <!-- Desktop: Hover to show delete button -->
    <p
      class="effect-text desktop-effect"
      :class="{ buff: props.effect.buff, debuff: !props.effect.buff }"
      @mouseenter="showDelete = true"
      @mouseleave="showDelete = false"
    >
      {{ effectSign }} {{ props.effect.text }}
      <span class="effect-delete" v-show="showDelete" @click.stop="deleteEffect"
        ><span class="delete-icon">&times;</span></span
      >
    </p>
    <!-- Mobile: Tap to open delete modal -->
    <p
      class="effect-text mobile-effect"
      :class="{ buff: props.effect.buff, debuff: !props.effect.buff }"
      @click="openDeleteModal"
    >
      {{ effectSign }} {{ props.effect.text }}
    </p>
    <!-- Delete Confirmation Modal -->
    <DeleteStatusEffectModal
      v-model="showDeleteModal"
      :effect-text="props.effect.text"
      :is-buff="props.effect.buff"
      @confirm="deleteEffect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DeleteStatusEffectModal from '@/components/hud/DeleteStatusEffectModal.vue'
import type { StatusEffectType } from '@/types/common'

const props = defineProps<{
  effect: StatusEffectType
}>()

const emits = defineEmits<{
  (e: 'delete', value: boolean): void
}>()

const showDelete = ref<boolean>(false)
const showDeleteModal = ref<boolean>(false)

const effectSign = computed(() => {
  if (props.effect.buff) return '+'
  else return '-'
})

function deleteEffect() {
  emits('delete', true)
}

function openDeleteModal() {
  showDeleteModal.value = true
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  transition:
    background-color 0.2s,
    transform 0.1s;
  vertical-align: middle;
}

.delete-icon {
  font-size: 0.85em;
  line-height: 1;
  font-weight: bold;
}

.effect-container:hover {
  cursor: default;
}

.effect-delete:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

.effect-delete:active {
  background: rgba(0, 0, 0, 0.15);
  transform: scale(0.95);
}

.buff {
  color: #43a047;
}

.debuff {
  color: #e53935;
}

/* Desktop/Mobile toggle using hover capability */
.mobile-effect {
  display: none;
}

/* Devices without hover (mobile/touch) */
@media (hover: none) {
  .desktop-effect {
    display: none;
  }

  .mobile-effect {
    display: block;
    cursor: pointer;
    padding: 0.25rem 0;
  }

  .mobile-effect:active {
    opacity: 0.7;
  }
}

/* Mobile Responsive Styles for desktop hover version */
@media (max-width: 768px) {
  .effect-delete {
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.08);
  }

  .delete-icon {
    font-size: 1.5em;
  }

  .effect-text {
    font-size: 1.1em;
  }
}

@media (max-width: 480px) {
  .effect-delete {
    width: 40px;
    height: 40px;
  }

  .effect-text {
    font-size: 1em;
  }
}
</style>
