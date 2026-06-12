<script setup>
import { onMounted, watch, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { BadgeCheck, MapPin, ArrowLeft, AlertTriangle, Briefcase, CalendarClock } from 'lucide-vue-next'

import { useProviderStore } from '@/stores/provider.store'
import { useServiceStore } from '@/stores/service.store'
import { useAvailabilityStore } from '@/stores/availability.store'
import { useBookingStore } from '@/stores/booking.store'
import ServiceCard from '@/components/provider/ServiceCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const providerStore = useProviderStore()
const serviceStore = useServiceStore()
const availabilityStore = useAvailabilityStore()
const bookingStore = useBookingStore()
const router = useRouter()

function bookService(service) {
  bookingStore.selectService(service, props.id)
  router.push({ name: 'booking', params: { providerId: props.id, serviceId: service.id } })
}

const { currentProvider, loading, error } = storeToRefs(providerStore)
const { providerServices } = storeToRefs(serviceStore)
const { providerByDate } = storeToRefs(availabilityStore)

function load() {
  providerStore.fetchProvider(props.id)
  serviceStore.fetchProviderServices(props.id)
  availabilityStore.fetchProviderAvailability(props.id)
}

onMounted(load)
watch(() => props.id, load)

const serviceName = (sid) => providerServices.value.find((s) => s.id === sid)?.serviceName || 'Service'
const displayName = computed(() => currentProvider.value?.businessName || 'Provider')
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <RouterLink :to="{ name: 'marketplace-providers' }" class="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
      <ArrowLeft class="h-4 w-4" />
      Back to marketplace
    </RouterLink>

    <div v-if="loading && !currentProvider" class="space-y-3 rounded-card border border-line bg-base p-6">
      <BaseSkeleton class="h-6 w-48" />
      <BaseSkeleton class="h-4 w-full" />
      <BaseSkeleton class="h-4 w-2/3" />
    </div>

    <EmptyState v-else-if="error" title="Couldn't load provider" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action><BaseButton variant="secondary" @click="load">Try again</BaseButton></template>
    </EmptyState>

    <template v-else-if="currentProvider">
      <!-- Header -->
      <div class="rounded-card border border-line bg-base p-5 sm:p-6">
        <div class="flex items-start gap-4">
          <BaseAvatar :name="displayName" size="lg" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h1 class="truncate text-xl font-bold text-ink">{{ displayName }}</h1>
              <BaseBadge :variant="currentProvider.isVerified ? 'success' : 'neutral'">
                <BadgeCheck class="h-3.5 w-3.5" />
                {{ currentProvider.isVerified ? 'Verified' : 'Unverified' }}
              </BaseBadge>
            </div>
            <p v-if="currentProvider.location" class="mt-0.5 flex items-center gap-1 text-sm text-muted">
              <MapPin class="h-4 w-4" />
              {{ currentProvider.location }}
            </p>
          </div>
        </div>
        <p v-if="currentProvider.description" class="mt-4 whitespace-pre-wrap text-sm text-ink">
          {{ currentProvider.description }}
        </p>
      </div>

      <!-- Services -->
      <h2 class="mb-3 mt-6 flex items-center gap-2 text-sm font-bold text-ink">
        <Briefcase class="h-4 w-4" /> Services
      </h2>
      <EmptyState v-if="!providerServices.length" title="No services listed" description="This provider hasn't added services yet." />
      <div v-else class="grid gap-3 sm:grid-cols-2">
        <ServiceCard v-for="s in providerServices" :key="s.id" :service="s" bookable @book="bookService" />
      </div>

      <!-- Availability -->
      <h2 class="mb-3 mt-6 flex items-center gap-2 text-sm font-bold text-ink">
        <CalendarClock class="h-4 w-4" /> Availability
      </h2>
      <EmptyState v-if="!providerByDate.length" title="No availability listed" description="This provider hasn't published availability yet." />
      <div v-else class="space-y-3">
        <div v-for="group in providerByDate" :key="group.date" class="rounded-card border border-line bg-base p-4">
          <h3 class="mb-2 text-sm font-bold text-ink">{{ group.dateLabel }}</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="slot in group.slots"
              :key="slot.id"
              class="rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-ink"
              :title="serviceName(slot.serviceId)"
            >
              {{ slot.startTime }}–{{ slot.endTime }}
            </span>
          </div>
        </div>
      </div>

      <!-- Booking entry point -->
      <p v-if="providerServices.length" class="mt-6 text-center text-xs text-muted">
        Pick a service above to book a slot.
      </p>
    </template>
  </section>
</template>
