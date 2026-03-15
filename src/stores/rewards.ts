import { defineStore } from 'pinia'
import type { Reward, RewardCost } from '@/types/common'
import { RewardStatus } from '@/types/common'
import {
  fetchRewardsWithCosts,
  createRewardWithCosts,
  claimRewardTransaction,
  updateReward,
  updateRewardCosts,
  deleteReward,
} from '@/lib/supabase'
import { useTokenStore } from '@/stores/resources'

interface RewardStoreState {
  rewards: Reward[]
  error: string | null
  loading: boolean
}

const useRewardStore = defineStore('rewards', {
  state: (): RewardStoreState => ({
    rewards: [],
    error: null,
    loading: false,
  }),

  actions: {
    async fetchActiveRewards() {
      this.loading = true
      this.error = null

      try {
        const rewards = await fetchRewardsWithCosts(RewardStatus.PENDING)
        this.rewards = rewards
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load rewards'
        console.error('Error loading rewards: ', err)
      } finally {
        this.loading = false
      }
    },

    async createReward(payload: { title: string; description?: string; costs: RewardCost[] }) {
      try {
        const newReward = await createRewardWithCosts(payload)
        this.rewards.unshift(newReward)
        return newReward
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to create reward'
        console.error('Error creating reward: ', err)
        throw err
      }
    },

    async claimReward(rewardId: number) {
      const reward = this.rewards.find((r) => r.id === rewardId)
      if (!reward) {
        this.error = 'Reward not found'
        throw new Error('Reward not found')
      }

      // Client-side validation: check token balances
      const tokenStore = useTokenStore()
      const insufficientTokens: string[] = []

      for (const cost of reward.costs) {
        const token = tokenStore.getTokenByType(cost.token_type)
        if (!token || token.quantity < cost.quantity) {
          insufficientTokens.push(cost.token_type)
        }
      }

      if (insufficientTokens.length > 0) {
        const errorMsg = `Insufficient tokens: ${insufficientTokens.join(', ')}`
        this.error = errorMsg
        throw new Error(errorMsg)
      }

      try {
        // Execute atomic transaction
        await claimRewardTransaction(rewardId, reward.costs)

        // Refresh token balances
        await tokenStore.fetchTokensFromDb()

        // Remove reward from local state
        this.rewards = this.rewards.filter((r) => r.id !== rewardId)

        return reward
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to claim reward'
        console.error('Error claiming reward: ', err)
        throw err
      }
    },

    async updateReward(
      rewardId: number,
      updates: { title?: string; description?: string },
      costs: RewardCost[],
    ) {
      try {
        // Update reward fields
        const updatedReward = await updateReward(rewardId, updates)
        // Update costs
        const updatedCosts = await updateRewardCosts(rewardId, costs)

        // Update local state
        const rewardIndex = this.rewards.findIndex((r) => r.id === rewardId)
        if (rewardIndex !== -1) {
          this.rewards[rewardIndex] = {
            ...this.rewards[rewardIndex],
            title: updatedReward.title,
            description: updatedReward.description,
            costs: updatedCosts,
            updated_at: updatedReward.updated_at,
          }
        }

        return this.rewards[rewardIndex]
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to update reward'
        console.error('Error updating reward: ', err)
        throw err
      }
    },

    async deleteReward(rewardId: number) {
      const reward = this.rewards.find((r) => r.id === rewardId)
      if (!reward) {
        this.error = 'Reward not found'
        throw new Error('Reward not found')
      }

      // Only allow deleting pending rewards
      if (reward.status !== RewardStatus.PENDING) {
        this.error = 'Cannot delete claimed rewards'
        throw new Error('Cannot delete claimed rewards')
      }

      try {
        await deleteReward(rewardId)
        // Remove from local state
        this.rewards = this.rewards.filter((r) => r.id !== rewardId)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to delete reward'
        console.error('Error deleting reward: ', err)
        throw err
      }
    },

    clearError() {
      this.error = null
    },
  },
})

export { useRewardStore }
