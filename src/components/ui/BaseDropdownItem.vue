<script setup>
defineProps({
  danger: { type: Boolean, default: false },
})
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-surface"
    :class="danger ? 'text-danger' : 'text-ink'"
  >
    <slot />
  </button>
</template>
