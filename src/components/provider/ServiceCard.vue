<script setup>
import { computed } from 'vue'
import { Pencil, Trash2, CalendarPlus } from 'lucide-vue-next'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import { formatPriceRange } from '@/lib/marketplace'

const props = defineProps({
  service: { type: Object, required: true },
  editable: { type: Boolean, default: false },
  bookable: { type: Boolean, default: false },
})

defineEmits(['edit', 'delete', 'book'])

const price = computed(() => formatPriceRange(props.service.priceMin, props.service.priceMax))
</script>

<template>
  <article class="rounded-card border border-line bg-base p-4">
    <div v-if="service.imageSrc" class="mb-3 overflow-hidden rounded-lg">
      <img :src="service.imageSrc" :alt="service.serviceName || 'Service'" class="h-32 w-full object-cover" loading="lazy" />
    </div>
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="truncate text-sm font-bold text-ink">{{ service.serviceName || 'Untitled service' }}</h3>
        <BaseBadge v-if="service.serviceCategory" variant="brand" class="mt-1">{{ service.serviceCategory }}</BaseBadge>
      </div>
      <div v-if="editable" class="flex shrink-0 items-center gap-1">
        <button type="button" aria-label="Edit" class="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink" @click="$emit('edit', service)">
          <Pencil class="h-4 w-4" />
        </button>
        <button type="button" aria-label="Delete" class="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-danger" @click="$emit('delete', service)">
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>

    <p v-if="service.description" class="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted">
      {{ service.description }}
    </p>

    <p class="mt-3 text-sm font-semibold text-brand">{{ price }}</p>

    <button
      v-if="bookable"
      type="button"
      class="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
      @click="$emit('book', service)"
    >
      <CalendarPlus class="h-4 w-4" />
      Book
    </button>
  </article>
</template>
