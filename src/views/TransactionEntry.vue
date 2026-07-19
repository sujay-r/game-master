<template>
  <div class="transaction-entry">
    <div class="entry-header">
      <RouterLink to="/finance" class="back-link">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Dashboard
      </RouterLink>
    </div>

    <h1 class="entry-title">Transaction Entry</h1>
    <p class="entry-description">
      Add a new income or expense transaction. This screen will be built in task 274.
    </p>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.transaction-entry {
  padding: 2rem 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.entry-header {
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #32a287;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95em;
  transition: color 0.2s;
}

.back-link:hover {
  color: #2d826d;
}

.entry-title {
  font-family: Trajan, 'Perpetua', serif;
  font-size: 2em;
  color: #424242;
  margin: 0 0 0.5rem;
}

.entry-description {
  color: #666;
  font-size: 1em;
  margin: 0;
}
</style>
