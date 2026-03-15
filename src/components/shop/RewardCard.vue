<template>
  <div class="reward-card" @click="toggleDetails">
    <!-- Desktop action buttons - left side -->
    <div class="reward-actions desktop-only" @click.stop>
      <button class="action-icon-btn" @click="handleEdit" title="Edit reward">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="18px"
          viewBox="0 -960 960 960"
          width="18px"
          fill="currentColor"
        >
          <path
            d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"
          />
        </svg>
      </button>
      <button
        v-if="canDelete"
        class="action-icon-btn delete"
        @click="handleDelete"
        title="Delete reward"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="18px"
          viewBox="0 -960 960 960"
          width="18px"
          fill="currentColor"
        >
          <path
            d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
          />
        </svg>
      </button>
    </div>

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

    <div class="modal-footer">
      <!-- Row 1: Edit and Delete buttons (equal width) -->
      <div class="footer-actions-row">
        <button class="btn btn-secondary" @click="handleEditFromModal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="18px"
            viewBox="0 -960 960 960"
            width="18px"
            fill="currentColor"
          >
            <path
              d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"
            />
          </svg>
          Edit
        </button>
        <button v-if="canDelete" class="btn btn-danger" @click="handleDeleteFromModal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="18px"
            viewBox="0 -960 960 960"
            width="18px"
            fill="currentColor"
          >
            <path
              d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
            />
          </svg>
          Delete
        </button>
      </div>
      <!-- Row 2: Claim Reward button (full width) -->
      <button
        class="btn btn-primary btn-full-width"
        @click="handleClaim"
        :disabled="hasInsufficientTokens"
      >
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
import { RewardStatus } from '@/types/common'
import { useTokenStore } from '@/stores/resources'
import { useIconStore } from '@/stores/resources'

const props = defineProps<{
  reward: Reward
}>()

const emit = defineEmits<{
  (e: 'claim', rewardId: number): void
  (e: 'error', message: string): void
  (e: 'edit', reward: Reward): void
  (e: 'delete', reward: Reward): void
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

const canDelete = computed(() => {
  return props.reward.status === RewardStatus.PENDING
})

function toggleDetails() {
  showDetails.value = true
}

function handleEdit() {
  emit('edit', props.reward)
}

function handleDelete() {
  if (canDelete.value) {
    emit('delete', props.reward)
  }
}

function handleEditFromModal() {
  showDetails.value = false
  emit('edit', props.reward)
}

function handleDeleteFromModal() {
  if (canDelete.value) {
    showDetails.value = false
    emit('delete', props.reward)
  }
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
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
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

/* Desktop action buttons */
.reward-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  grid-column: 1;
  grid-row: 1;
}

.reward-card:hover .reward-actions {
  opacity: 1;
}

.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  padding: 0;
}

.action-icon-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: #999;
}

.action-icon-btn.delete:hover {
  background: #ffebee;
  border-color: #c62828;
  color: #c62828;
}

.reward-content {
  display: flex;
  align-items: center;
  align-self: center;
  justify-content: center;
  min-width: 0;
  grid-column: 2;
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
  grid-column: 3;
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

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.footer-actions-row {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.footer-actions-row .btn {
  flex: 1 1 0;
  min-width: 0;
  justify-content: center;
}

.btn-full-width {
  width: 100%;
  justify-content: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
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

.btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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

.btn-danger {
  background: #ffebee;
  color: #c62828;
}

.btn-danger:hover {
  background: #ffcdd2;
  transform: translateY(-1px);
}

.btn-danger:active {
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

  /* Hide desktop buttons on mobile */
  .desktop-only {
    display: none !important;
  }

  .reward-content {
    grid-column: 1;
  }

  .reward-title {
    font-size: 0.9em;
  }

  .token-section {
    grid-column: 2;
    font-size: 0.8em;
  }

  .error-message {
    font-size: 0.75em;
    padding: 0.4rem 0.6rem;
  }

  .modal-footer {
    gap: 0.5rem;
  }

  .footer-actions-row {
    gap: 0.5rem;
  }

  .btn {
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

  .btn {
    padding: 0.625rem 0.875rem;
    font-size: 0.9em;
  }
}
</style>
