<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Info, Sparkles } from 'lucide-vue-next'

import { formatPriceRange } from '@/lib/marketplace'

const props = defineProps({
  service: { type: Object, required: true },
})

const price = computed(() => formatPriceRange(props.service.priceMin, props.service.priceMax))
</script>

<template>
  <article class="flex flex-col overflow-hidden rounded-card border border-line bg-base">
    <div v-if="service.imageSrc" class="aspect-[16/10] overflow-hidden bg-surface">
      <img :src="service.imageSrc" :alt="service.serviceName || 'Service'" class="h-full w-full object-cover" loading="lazy" />
    </div>
    <div v-else class="grid aspect-[16/10] place-items-center bg-gradient-to-br from-brand/15 to-brand-light/15">
      <Sparkles class="h-8 w-8 text-brand/40" />
    </div>

    <div class="flex flex-1 flex-col p-3">
      <h3 class="line-clamp-2 text-sm font-bold text-ink">{{ service.serviceName || 'Service' }}</h3>
      <p v-if="service.description" class="mt-1 line-clamp-2 text-xs text-muted">{{ service.description }}</p>

      <p class="mt-2 text-xs font-semibold text-brand">{{ price }}</p>

      <RouterLink
        :to="{ name: 'provider-details', params: { id: service.providerUserId } }"
        class="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-bold text-brand transition-colors hover:bg-surface"
      >
        <Info class="h-4 w-4" />
        See details
      </RouterLink>
    </div>
  </article>
</template>
