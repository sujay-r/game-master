<template>
  <div class="throwing-placeholder">This component will throw on render</div>
</template>

<script setup lang="ts">
// Test-only helper: renders a component that always throws during setup.
// The DashboardSlot error boundary should catch this and display a fallback
// without crashing the rest of the dashboard.
throw new Error('Intentional render error from ThrowingPlaceholder')
</script>

<style scoped>
.throwing-placeholder {
  display: none;
}
</style>
