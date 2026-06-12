<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="grid min-h-dvh place-items-center bg-surface px-4 text-center">
    <div class="animate-rise-fade">
      <p class="text-5xl font-bold text-brand">404</p>
      <h1 class="mt-3 text-xl font-bold text-ink">Page not found</h1>
      <p class="mt-1 text-sm text-muted">The page you're looking for doesn't exist.</p>
      <RouterLink
        :to="{ name: 'feed' }"
        class="mt-6 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        Back to feed
      </RouterLink>
    </div>
  </div>
</template>
