<script setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Search, Store, AlertTriangle, MapPin } from 'lucide-vue-next'

import { useServiceStore } from '@/stores/service.store'
import ServiceListingCard from '@/components/marketplace/ServiceListingCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const store = useServiceStore()
const { marketplaceServices, loading, error } = storeToRefs(store)

onMounted(() => {
  if (!marketplaceServices.value.length) store.fetchMarketplaceServices()
})

const query = ref('')
const activeCategory = ref('All')
const activeLocation = ref('All')

const categories = computed(() => {
  const set = new Set(marketplaceServices.value.map((s) => s.serviceCategory).filter(Boolean))
  return ['All', ...[...set].sort()]
})
const locations = computed(() => {
  const set = new Set(marketplaceServices.value.map((s) => s.location).filter(Boolean))
  return [...set].sort()
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return marketplaceServices.value.filter((s) => {
    if (activeCategory.value !== 'All' && s.serviceCategory !== activeCategory.value) return false
    if (activeLocation.value !== 'All' && s.location !== activeLocation.value) return false
    if (q && !s.serviceName.toLowerCase().includes(q) && !s.providerName.toLowerCase().includes(q)) return false
    return true
  })
})
</script>

<template>
  <section class="mx-auto max-w-3xl">
    <!-- Search -->
    <div class="relative mb-4">
      <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        v-model="query"
        type="search"
        placeholder="Search Jamii Sasa…"
        class="w-full rounded-xl border border-line bg-base py-2.5 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
      />
    </div>

    <!-- Location -->
    <div class="mb-3 flex items-center gap-2">
      <MapPin class="h-4 w-4 text-brand" />
      <select
        v-model="activeLocation"
        class="rounded-lg border border-line bg-base px-2 py-1 text-sm font-semibold text-ink outline-none focus:border-brand"
      >
        <option value="All">All areas</option>
        <option v-for="l in locations" :key="l" :value="l">{{ l }}</option>
      </select>
    </div>

    <!-- Category pills -->
    <div class="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        class="whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors"
        :class="activeCategory === c ? 'border-brand bg-brand text-white' : 'border-line bg-base text-muted hover:bg-surface'"
        @click="activeCategory = c"
      >
        {{ c }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && !marketplaceServices.length" class="grid grid-cols-2 gap-3">
      <BaseSkeleton v-for="i in 6" :key="i" class="h-56 w-full rounded-card" />
    </div>

    <!-- Error -->
    <EmptyState v-else-if="error" title="Couldn't load the marketplace" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action><BaseButton variant="secondary" @click="store.fetchMarketplaceServices()">Try again</BaseButton></template>
    </EmptyState>

    <!-- Empty -->
    <EmptyState
      v-else-if="!filtered.length"
      :title="marketplaceServices.length ? 'No matching services' : 'No services yet'"
      :description="marketplaceServices.length ? 'Try a different search or filter.' : 'Check back soon as providers add services.'"
    >
      <template #icon><Store class="h-6 w-6" /></template>
    </EmptyState>

    <!-- Service grid -->
    <div v-else class="grid grid-cols-2 gap-3">
      <ServiceListingCard v-for="s in filtered" :key="s.id" :service="s" />
    </div>
  </section>
</template>
