<template>
  <div class="error-test-view">
    <h1 class="error-test-title">Error Boundary Test</h1>
    <div class="error-test-grid">
      <DashboardSlot test-id="faulty-slot">
        <ThrowingPlaceholder />
      </DashboardSlot>
      <DashboardSlot test-id="healthy-slot">
        <div class="healthy-placeholder">Healthy slot rendered</div>
      </DashboardSlot>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardSlot from '@/components/finance/DashboardSlot.vue'
import ThrowingPlaceholder from '@/components/finance/ThrowingPlaceholder.vue'
</script>

<style scoped>
.error-test-view {
  padding: 2rem 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.error-test-title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 1.75em;
  color: #424242;
  margin: 0 0 1.5rem;
}

.error-test-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.healthy-placeholder {
  padding: 2rem;
  text-align: center;
  color: #424242;
}

@media (max-width: 768px) {
  .error-test-grid {
    grid-template-columns: 1fr;
  }
}
</style>
