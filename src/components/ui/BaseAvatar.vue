<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  src: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg | xl
})

const initials = computed(() => {
  const parts = (props.name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase()
})

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-2xl',
}
</script>

<template>
  <span
    class="inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand/10 font-bold text-brand"
    :class="sizes[size] || sizes.md"
  >
    <img v-if="src" :src="src" :alt="name" class="h-full w-full object-cover" />
    <template v-else>{{ initials }}</template>
  </span>
</template>
