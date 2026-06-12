<script setup>
defineProps({
  title: { type: String, default: 'Nothing here yet' },
  description: { type: String, default: '' },
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-base px-6 py-12 text-center"
  >
    <div v-if="$slots.icon" class="mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface text-muted">
      <slot name="icon" />
    </div>
    <h3 class="text-sm font-bold text-ink">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-xs text-sm text-muted">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
