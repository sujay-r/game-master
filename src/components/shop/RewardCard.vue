<template>
  <div class="reward-card" @click="toggleDetails">
    <div class="reward-content">
      <p class="reward-title">{{ reward.title }}</p>
    </div>
    <div class="token-section">
      <div v-for="cost in reward.costs" :key="cost.token_type" class="token-container">
        <span class="token-count-text" :style="`color: ${cost.icon_color}`">{{
          cost.quantity
        }}</span>
        <span class="icon-container" v-html="cost.icon"></span>
      </div>
    </div>
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>

  <!-- Reward Detail Modal -->
  <Modal v-model="showDetails" :include-close-button="false">
    <h2>{{ reward.title }}</h2>
    <p v-if="reward.description" class="reward-detail-description">{{ reward.description }}</p>

    <div class="costs-section">
      <h3 class="section-title">Cost</h3>
      <div class="costs-list">
        <div v-for="cost in reward.costs" :key="cost.token_type" class="cost-item">
          <span class="cost-quantity" :style="`color: ${cost.icon_color}`">{{
            cost.quantity
          }}</span>
          <span class="cost-icon" v-html="cost.icon"></span>
          <span class="cost-name">{{ cost.token_type }}</span>
        </div>
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-secondary" @click="showDetails = false">Close</button>
      <button class="btn btn-primary" @click="handleClaim" :disabled="hasInsufficientTokens">
        Claim Reward
      </button>
    </div>
    <div v-if="modalErrorMessage" class="modal-error">
      {{ modalErrorMessage }}
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Modal from '@/components/base/Modal.vue'
import type { Reward } from '@/types/common'
import { useTokenStore } from '@/stores/resources'
import { useIconStore } from '@/stores/resources'

const props = defineProps<{
  reward: Reward
}>()

const emit = defineEmits<{
  (e: 'claim', rewardId: number): void
  (e: 'error', message: string): void
}>()

const tokenStore = useTokenStore()
const iconStore = useIconStore()

const showDetails = ref(false)
const errorMessage = ref('')
const modalErrorMessage = ref('')

const hasInsufficientTokens = computed(() => {
  for (const cost of props.reward.costs) {
    const token = tokenStore.getTokenByType(cost.token_type)
    if (!token || token.quantity < cost.quantity) {
      return true
    }
  }
  return false
})

function toggleDetails() {
  showDetails.value = true
}

async function handleClaim() {
  errorMessage.value = ''
  modalErrorMessage.value = ''

  // Check token balances
  const insufficientTokens: string[] = []
  for (const cost of props.reward.costs) {
    const token = tokenStore.getTokenByType(cost.token_type)
    if (!token || token.quantity < cost.quantity) {
      insufficientTokens.push(cost.token_type)
    }
  }

  if (insufficientTokens.length > 0) {
    const msg = `Insufficient ${insufficientTokens.join(', ')}`
    errorMessage.value = msg
    modalErrorMessage.value = msg
    emit('error', msg)
    return
  }

  try {
    emit('claim', props.reward.id)
    showDetails.value = false
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to claim reward'
    errorMessage.value = msg
    modalErrorMessage.value = msg
    emit('error', msg)
  }
}

async function loadCostIcons() {
  for (const cost of props.reward.costs) {
    if (!cost.icon && cost.icon_filename) {
      cost.icon = await iconStore.getIcon(cost.icon_filename, cost.icon_color, 15)
    }
  }
}

onMounted(async () => {
  await loadCostIcons()
})

// Watch for changes in costs and reload icons if needed
watch(
  () => props.reward.costs,
  async (costs) => {
    if (costs) {
      await loadCostIcons()
    }
  },
  { deep: true },
)
</script>

<style scoped>
.reward-card {
  position: relative;
  background: #f7f7f4;
  border-radius: 12px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1.5px 4px rgba(0, 0, 0, 0.06);
  padding: 1rem 1.25rem;
  margin: 0.75rem 0;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr auto;
  align-items: center;
  gap: 0.75rem;
  min-height: 48px;
  transition: box-shadow 0.2s;
  cursor: pointer;
}

.reward-card:hover {
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.1);
}

.reward-content {
  display: flex;
  align-items: center;
  align-self: center;
  justify-content: center;
  min-width: 0;
  grid-column: 1;
  grid-row: 1;
  text-align: center;
}

.reward-title {
  font-family: Trajan;
  font-weight: bold;
  font-size: 1em;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.token-section {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  align-self: center;
  grid-column: 2;
  grid-row: 1;
}

.token-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0.1em;
}

.token-count-text {
  display: contents;
  font-size: 1.25em;
  font-weight: bold;
}

.icon-container {
  display: contents;
  margin: 0;
  padding: 0;
}

.error-message {
  grid-column: 1 / -1;
  grid-row: 2;
  color: #c62828;
  font-size: 0.8em;
  background: #ffebee;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.reward-detail-description {
  color: #666;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.costs-section {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.section-title {
  font-family: Trajan;
  font-size: 1em;
  margin: 0 0 0.75rem 0;
  color: #424242;
}

.costs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cost-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.cost-quantity {
  font-size: 1.25em;
  font-weight: bold;
  min-width: 2rem;
}

.cost-icon {
  display: flex;
  align-items: center;
}

.cost-name {
  font-size: 0.9em;
  color: #666;
  text-transform: capitalize;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95em;
  font-family: 'Trajan', 'Perpetua', serif;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.btn-primary {
  background: #32a287;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #2d826d;
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: #a8d5c9;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e8e8e8;
  color: #424242;
}

.btn-secondary:hover {
  background: #d8d8d8;
  transform: translateY(-1px);
}

.btn-secondary:active {
  transform: translateY(0);
}

.modal-error {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 6px;
  font-size: 0.9em;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .reward-card {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto;
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }

  .reward-title {
    font-size: 0.9em;
  }

  .token-section {
    font-size: 0.8em;
  }

  .error-message {
    font-size: 0.75em;
    padding: 0.4rem 0.6rem;
  }

  .modal-actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .btn {
    width: 100%;
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 480px) {
  .reward-card {
    padding: 0.625rem 0.875rem;
  }

  .reward-title {
    font-size: 0.85em;
  }

  .token-section {
    font-size: 0.75em;
  }
}
</style>
