<script setup>
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { BadgeCheck, ArrowRight } from 'lucide-vue-next'

import { useProviderStore } from '@/stores/provider.store'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const store = useProviderStore()
const { providers, loading } = storeToRefs(store)

// Reuse the store's cached directory; only fetch if empty.
onMounted(() => {
  if (!providers.value.length) store.fetchProviders()
})

const featured = computed(() => providers.value.slice(0, 8))
</script>

<template>
  <section v-if="loading || featured.length" class="mb-6">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-bold text-ink">Book with Confidence</h2>
      <RouterLink :to="{ name: 'marketplace-providers' }" class="inline-flex items-center gap-1 text-sm font-semibold text-brand-light">
        View all <ArrowRight class="h-4 w-4" />
      </RouterLink>
    </div>

    <!-- Horizontal carousel -->
    <div class="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <template v-if="loading && !featured.length">
        <BaseSkeleton v-for="i in 3" :key="i" class="h-40 w-60 shrink-0 rounded-card" />
      </template>

      <RouterLink
        v-for="p in featured"
        v-else
        :key="p.userId"
        :to="{ name: 'provider-details', params: { id: p.userId } }"
        class="flex w-60 shrink-0 flex-col rounded-card border border-line bg-base p-4 transition-shadow hover:shadow-sm"
      >
        <div class="flex items-center gap-3">
          <BaseAvatar :name="p.businessName" size="md" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1">
              <h3 class="truncate text-sm font-bold text-ink">{{ p.businessName || 'Provider' }}</h3>
              <BadgeCheck v-if="p.isVerified" class="h-4 w-4 shrink-0 text-brand-light" />
            </div>
            <p v-if="p.categories?.length" class="truncate text-xs text-muted">{{ p.categories[0] }}</p>
          </div>
        </div>
        <p v-if="p.location" class="mt-3 truncate text-xs text-muted">{{ p.location }}</p>
        <p v-if="p.startingPrice" class="mt-1 text-sm font-semibold text-brand">From KES {{ p.startingPrice.toLocaleString() }}</p>
      </RouterLink>
    </div>
  </section>
</template>
