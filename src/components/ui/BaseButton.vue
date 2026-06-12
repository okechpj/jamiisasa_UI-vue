<script setup>
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { cn } from '@/lib/cn'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | outline | ghost | danger
  size: { type: String, default: 'md' }, // sm | md | lg
  type: { type: String, default: 'button' },
  block: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const variants = {
  primary: 'bg-brand text-white hover:opacity-90',
  secondary: 'bg-brand/10 text-brand hover:bg-brand/15',
  outline: 'border border-line bg-base text-ink hover:bg-surface',
  ghost: 'text-muted hover:bg-surface hover:text-ink',
  danger: 'bg-danger text-white hover:opacity-90',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

const classes = computed(() =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60',
    variants[props.variant] || variants.primary,
    sizes[props.size] || sizes.md,
    props.block && 'w-full',
  ),
)
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading">
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
    <slot />
  </button>
</template>
