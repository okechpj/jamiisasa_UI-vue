<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ArrowLeft, Inbox, AlertTriangle } from 'lucide-vue-next'

import { useConnectionStore } from '@/stores/connection.store'
import { useToast } from '@/composables/useToast'
import ConnectionItem from '@/components/connections/ConnectionItem.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const store = useConnectionStore()
const toast = useToast()
const { pending, loading, error } = storeToRefs(store)

const busyId = ref('')

onMounted(() => store.fetchPending())

async function onAccept(id) {
  busyId.value = id
  const ok = await store.accept(id)
  busyId.value = ''
  if (ok) toast.success('Connection accepted.')
  else toast.error(store.error || 'Could not accept the request.')
}

async function onReject(id) {
  busyId.value = id
  const ok = await store.reject(id)
  busyId.value = ''
  if (ok) toast.info('Request declined.')
  else toast.error(store.error || 'Could not decline the request.')
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <header class="mb-4 flex items-center gap-3">
      <RouterLink
        :to="{ name: 'connections' }"
        class="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-base hover:text-ink"
      >
        <ArrowLeft class="h-5 w-5" />
      </RouterLink>
      <h1 class="text-xl font-bold text-ink">Pending requests</h1>
    </header>

    <div v-if="loading && !pending.length" class="space-y-3">
      <BaseSkeleton v-for="i in 3" :key="i" class="h-16 w-full rounded-card" />
    </div>

    <EmptyState v-else-if="error" title="Couldn't load requests" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action><BaseButton variant="secondary" @click="store.fetchPending()">Try again</BaseButton></template>
    </EmptyState>

    <EmptyState
      v-else-if="!pending.length"
      title="No pending requests"
      description="When someone asks to connect, it'll show up here."
    >
      <template #icon><Inbox class="h-6 w-6" /></template>
    </EmptyState>

    <div v-else class="space-y-3">
      <ConnectionItem
        v-for="c in pending"
        :key="c.id"
        :connection="c"
        variant="pending"
        :busy="busyId === c.id"
        @accept="onAccept"
        @reject="onReject"
      />
    </div>
  </section>
</template>
