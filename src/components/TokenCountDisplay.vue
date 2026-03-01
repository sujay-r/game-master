<template>
  <FloatingDisplay>
    <div class="token-count-container">
      <div v-for="token in displayTokens" :key="token.token_type" class="token-item">
        <span class="icon-container" v-html="tokenIcons[token.token_type]"></span>
        <span class="token-count">{{ token.quantity }}</span>
      </div>
    </div>
  </FloatingDisplay>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import FloatingDisplay from './FloatingDisplay.vue'
import { useIconStore, useTokenStore } from '@/stores/resources'
import type { TokenType } from '@/types/common'

const tokenStore = useTokenStore()
const iconStore = useIconStore()

const tokenIcons = ref<Record<string, string>>({})

const displayTokens = computed(() => {
  return tokenStore.tokens
    .filter((token) => {
      // Always show 'care' token, others only if quantity > 0
      if (token.token_type === 'care') return true
      return token.quantity > 0
    })
    .sort((a, b) => {
      // Keep 'care' token first, then sort alphabetically by token_type
      if (a.token_type === 'care') return -1
      if (b.token_type === 'care') return 1
      return a.token_type.localeCompare(b.token_type)
    })
})

async function loadTokenIcons(tokens: TokenType[]) {
  const iconPromises = tokens.map(async (token: TokenType) => {
    if (!tokenIcons.value[token.token_type]) {
      const icon = await iconStore.getIcon(token.icon_filename, token.icon_color, 15)
      if (icon) {
        tokenIcons.value[token.token_type] = icon
      }
    }
  })
  await Promise.all(iconPromises)
}

onMounted(async () => {
  if (tokenStore.tokens.length === 0) {
    await tokenStore.fetchTokensFromDb()
  }
  await loadTokenIcons(tokenStore.tokens)
})

watch(
  () => tokenStore.tokens,
  async (newTokens) => {
    await loadTokenIcons(newTokens)
  },
  { deep: true },
)
</script>

<style scoped>
.token-count-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.token-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.icon-container {
  display: flex;
  align-items: center;
}

.token-count {
  font-family: 'Trajan', serif;
  font-size: 1.25em;
  font-weight: bold;
  color: #424242;
}
</style>
