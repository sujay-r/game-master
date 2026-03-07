<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

onMounted(() => {
  authStore.initializeAuth()
})
</script>

<template>
  <NavBar v-if="route.name !== 'Login'" />
  <RouterView />
</template>

<style scoped></style>
