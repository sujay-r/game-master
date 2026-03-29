<template>
  <Modal v-model="visible" :include-close-button="false">
    <div class="reward-edit-modal">
      <h2 class="modal-title">Edit Reward</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="reward-title" class="form-label">Title <span class="required">*</span></label>
          <input
            id="reward-title"
            v-model="formData.title"
            type="text"
            class="form-input"
            placeholder="Enter reward title"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <LiveEditor
            v-model="formData.description"
            :text-box="true"
            placeholder="Reward description..."
          />
        </div>

        <div class="form-group">
          <TokenInputBuilder
            v-model="formData.costs"
            :tokens="tokenStore.tokens"
            label="Cost"
            item-label="Cost"
            :required="true"
          />
          <p v-if="costError" class="field-error">{{ costError }}</p>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="handleCancel">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="!isFormValid">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, defineAsyncComponent } from 'vue'
import Modal from '@/components/base/Modal.vue'
const LiveEditor = defineAsyncComponent(() => import('@/components/common/LiveEditor.vue'))
import TokenInputBuilder from '@/components/forms/TokenInputBuilder.vue'
import type { Reward, RewardCost, TaskOutcomeType } from '@/types/common'
import { useTokenStore } from '@/stores/resources'
import { stripHtml } from '@/utils/html'

interface FormData {
  title: string
  description: string
  costs: TaskOutcomeType[]
}

const props = defineProps<{
  modelValue: boolean
  reward: Reward | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'save',
    data: {
      rewardId: number
      title: string
      description: string
      costs: RewardCost[]
    },
  ): void
  (e: 'cancel'): void
}>()

const visible = ref(props.modelValue)
const tokenStore = useTokenStore()
const costError = ref('')

const defaultFormData: FormData = {
  title: '',
  description: '',
  costs: [],
}

const formData = ref<FormData>({ ...defaultFormData })

const isFormValid = computed(() => {
  const hasTitle = formData.value.title.trim().length > 0
  const hasCosts = formData.value.costs.length > 0
  const allCostsValid = formData.value.costs.every(
    (cost) => cost.token_type && parseInt(cost.quantity, 10) > 0,
  )
  const noDuplicates = checkNoDuplicates()

  return hasTitle && hasCosts && allCostsValid && noDuplicates
})

function checkNoDuplicates(): boolean {
  const tokenTypes = formData.value.costs.map((c) => c.token_type)
  return new Set(tokenTypes).size === tokenTypes.length
}

function populateFormFromReward(reward: Reward | null) {
  if (!reward) {
    formData.value = { ...defaultFormData }
    return
  }

  formData.value = {
    title: reward.title,
    description: reward.description || '',
    costs: reward.costs.map((cost) => ({
      token_type: cost.token_type,
      quantity: cost.quantity.toString(),
      icon_filename: cost.icon_filename,
      icon_color: cost.icon_color,
      icon: cost.icon,
    })),
  }
}

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      populateFormFromReward(props.reward)
      costError.value = ''
    }
  },
)

watch(
  () => visible.value,
  (val) => {
    emit('update:modelValue', val)
  },
)

watch(
  () => props.reward,
  (newReward) => {
    if (visible.value && newReward) {
      populateFormFromReward(newReward)
    }
  },
)

function handleCancel() {
  visible.value = false
  emit('cancel')
}

function validateCosts(): boolean {
  costError.value = ''

  if (formData.value.costs.length === 0) {
    costError.value = 'At least one cost is required'
    return false
  }

  // Check for duplicates
  const tokenTypes = formData.value.costs.map((c) => c.token_type)
  if (new Set(tokenTypes).size !== tokenTypes.length) {
    costError.value = 'Duplicate token types are not allowed'
    return false
  }

  // Check all costs have valid values
  const invalidCost = formData.value.costs.find(
    (cost) => !cost.token_type || parseInt(cost.quantity, 10) <= 0,
  )
  if (invalidCost) {
    costError.value = 'All costs must have a token type and quantity greater than 0'
    return false
  }

  return true
}

function handleSubmit() {
  if (!validateCosts()) {
    return
  }

  if (!formData.value.title.trim() || !props.reward) {
    return
  }

  const rewardData = {
    rewardId: props.reward.id,
    title: formData.value.title.trim(),
    description: stripHtml(formData.value.description),
    costs: formData.value.costs.map((cost) => ({
      reward_id: props.reward!.id,
      token_type: cost.token_type,
      quantity: parseInt(cost.quantity, 10) || 1,
      icon_filename: cost.icon_filename || '',
      icon_color: cost.icon_color || '',
      icon: cost.icon,
    })),
  }

  emit('save', rewardData)
  visible.value = false
}
</script>

<style scoped>
.reward-edit-modal {
  min-width: 500px;
  max-width: 600px;
  max-height: 85vh;
  padding-right: 18px;
}

form {
  padding-bottom: 2rem;
}

/* Custom scrollbar styling */
.reward-edit-modal::-webkit-scrollbar {
  width: 6px;
}

.reward-edit-modal::-webkit-scrollbar-track {
  background: transparent;
}

.reward-edit-modal::-webkit-scrollbar-thumb {
  background: #c7c7c7;
  border-radius: 3px;
}

.reward-edit-modal::-webkit-scrollbar-thumb:hover {
  background: #a7a7a7;
}

.modal-title {
  font-family: 'Trajan', 'Perpetua', serif;
  font-size: 1.5em;
  color: #424242;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e0e0e0;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875em;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
}

.required {
  color: #c62828;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  font-family: inherit;
  color: #424242;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #32a287;
  box-shadow: 0 0 0 3px rgba(50, 162, 135, 0.1);
}

.form-input::placeholder {
  color: #999;
}

.field-error {
  color: #c62828;
  font-size: 0.8em;
  margin-top: 0.5rem;
}

.form-actions {
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

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .reward-edit-modal {
    min-width: auto;
    width: 100%;
    max-width: 100%;
    padding-right: 0;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    max-height: 75vh;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .btn {
    width: 100%;
    padding: 0.75rem 1rem;
  }

  .modal-title {
    font-size: 1.25em;
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .reward-edit-modal {
    max-height: 80vh;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    font-size: 0.8em;
  }

  .form-input {
    padding: 0.625rem 0.875rem;
    font-size: 0.95em;
  }
}
</style>
