<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/cn'

const props = defineProps({
  variant: { type: String, default: 'neutral' }, // neutral | brand | success | danger | warning
})

const variants = {
  neutral: 'bg-surface text-muted',
  brand: 'bg-brand/10 text-brand',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-amber-100 text-amber-700',
}

const classes = computed(() =>
  cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
    variants[props.variant] || variants.neutral,
  ),
)
</script>

<template>
  <span :class="classes"><slot /></span>
</template>
