<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="grid min-h-dvh place-items-center bg-surface px-4 py-10">
    <div class="w-full max-w-md">
      <!-- Brand mark -->
      <div class="mb-8 text-center">
        <div
          class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-lg font-bold text-white"
        >
          JS
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-ink">Jamii Sasa</h1>
        <p class="mt-1 text-sm text-muted">Your neighborhood social marketplace</p>
      </div>

      <div class="rounded-card border border-line bg-base p-6 shadow-sm sm:p-8">
        <RouterView />
      </div>
    </div>
  </div>
</template>
