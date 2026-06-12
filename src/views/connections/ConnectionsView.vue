<script setup>
import { onMounted, ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Search, Users, AlertTriangle, UserPlus } from 'lucide-vue-next'

import { useConnectionStore } from '@/stores/connection.store'
import ConnectionItem from '@/components/connections/ConnectionItem.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const store = useConnectionStore()
const { accepted, pending, loading, error } = storeToRefs(store)

onMounted(() => store.loadAll())

const query = ref('')
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return accepted.value
  return accepted.value.filter(
    (c) => c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q),
  )
})
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <header class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-bold text-ink">Connections</h1>
      <RouterLink
        :to="{ name: 'pending-requests' }"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
      >
        <UserPlus class="h-4 w-4" />
        Requests
        <span
          v-if="pending.length"
          class="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-bold text-white"
        >
          {{ pending.length }}
        </span>
      </RouterLink>
    </header>

    <!-- Search -->
    <div class="relative mb-4">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        v-model="query"
        type="search"
        placeholder="Search connections…"
        class="w-full rounded-xl border border-line bg-base py-2.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading && !accepted.length" class="space-y-3">
      <BaseSkeleton v-for="i in 4" :key="i" class="h-16 w-full rounded-card" />
    </div>

    <!-- Error -->
    <EmptyState v-else-if="error" title="Couldn't load connections" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action><BaseButton variant="secondary" @click="store.loadAll()">Try again</BaseButton></template>
    </EmptyState>

    <!-- Empty -->
    <EmptyState
      v-else-if="!filtered.length"
      :title="query ? 'No matches' : 'No connections yet'"
      :description="query ? 'Try a different search.' : 'Connect with people from the feed to grow your network.'"
    >
      <template #icon><Users class="h-6 w-6" /></template>
    </EmptyState>

    <!-- List -->
    <div v-else class="space-y-3">
      <ConnectionItem v-for="c in filtered" :key="c.id" :connection="c" variant="accepted" />
    </div>
  </section>
</template>
