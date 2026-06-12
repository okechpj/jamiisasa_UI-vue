<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ArrowLeft, CalendarClock, AlertTriangle } from 'lucide-vue-next'

import { useProviderStore } from '@/stores/provider.store'
import { useServiceStore } from '@/stores/service.store'
import { useAvailabilityStore } from '@/stores/availability.store'
import { useBookingStore } from '@/stores/booking.store'
import { useToast } from '@/composables/useToast'
import { formatPriceRange, formatDate, todayYMD } from '@/lib/marketplace'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const props = defineProps({
  providerId: { type: String, required: true },
  serviceId: { type: String, required: true },
})

const providerStore = useProviderStore()
const serviceStore = useServiceStore()
const availabilityStore = useAvailabilityStore()
const booking = useBookingStore()
const toast = useToast()
const router = useRouter()

const { currentProvider } = storeToRefs(providerStore)
const { providerAvailability } = storeToRefs(availabilityStore)
const { saving } = storeToRefs(booking)

const loading = ref(false)
const service = ref(null)

// Future, active slots for the selected service grouped by date.
const slotsByDate = computed(() => {
  const today = todayYMD()
  const list = providerAvailability.value.filter(
    (s) => s.serviceId === props.serviceId && s.isActive !== false && s.slotDate >= today,
  )
  const byDate = new Map()
  for (const s of list) {
    if (!byDate.has(s.slotDate)) byDate.set(s.slotDate, [])
    byDate.get(s.slotDate).push(s)
  }
  return [...byDate.keys()]
    .sort()
    .map((date) => ({
      date,
      dateLabel: formatDate(date),
      slots: byDate.get(date).slice().sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
})

const hasSlots = computed(() => slotsByDate.value.length > 0)
const selectedSlot = ref(null)
const notes = ref('')
const canConfirm = computed(() => selectedSlot.value && !saving.value)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      providerStore.fetchProvider(props.providerId),
      availabilityStore.fetchProviderAvailability(props.providerId),
      serviceStore.fetchProviderServices(props.providerId),
    ])
    service.value =
      booking.selectedService && booking.selectedService.id === props.serviceId
        ? booking.selectedService
        : serviceStore.providerServices.find((s) => s.id === props.serviceId) || null
  } finally {
    loading.value = false
  }
})

async function confirm() {
  if (!canConfirm.value) return
  const created = await booking.createBooking({
    serviceId: props.serviceId,
    providerId: props.providerId,
    availabilityId: selectedSlot.value.id,
    date: selectedSlot.value.slotDate, // the slot carries its own date
    notes: notes.value,
  })
  if (created) {
    toast.success('Booking requested!')
    router.push({ name: 'my-bookings' })
  } else {
    toast.error(booking.error || 'Could not create the booking.')
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl pb-28">
    <button type="button" class="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink" @click="router.back()">
      <ArrowLeft class="h-4 w-4" />
      Back
    </button>

    <h1 class="mb-4 text-xl font-bold text-ink">Book a service</h1>

    <div v-if="loading" class="space-y-3">
      <BaseSkeleton class="h-20 w-full rounded-card" />
      <BaseSkeleton class="h-24 w-full rounded-card" />
    </div>

    <template v-else-if="service">
      <!-- Selected service summary -->
      <div class="rounded-card border border-line bg-base p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">Service</p>
        <h2 class="mt-1 text-base font-bold text-ink">{{ service.serviceName }}</h2>
        <p class="text-sm text-muted">{{ currentProvider?.businessName || 'Provider' }}</p>
        <p class="mt-1 text-sm font-semibold text-brand">{{ formatPriceRange(service.priceMin, service.priceMax) }}</p>
      </div>

      <!-- Availability: choose a date + time slot -->
      <h3 class="mb-2 mt-6 text-sm font-bold text-ink">Choose a date &amp; time</h3>
      <EmptyState
        v-if="!hasSlots"
        title="No availability"
        description="This provider has no upcoming slots for this service yet."
      >
        <template #icon><CalendarClock class="h-6 w-6" /></template>
      </EmptyState>

      <div v-else class="space-y-4">
        <div v-for="group in slotsByDate" :key="group.date">
          <p class="mb-2 text-sm font-semibold text-ink">{{ group.dateLabel }}</p>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              v-for="slot in group.slots"
              :key="slot.id"
              type="button"
              class="rounded-xl border p-3 text-center transition-colors"
              :class="selectedSlot?.id === slot.id ? 'border-brand bg-brand text-white' : 'border-line bg-base text-ink hover:bg-surface'"
              @click="selectedSlot = slot"
            >
              <span class="text-sm font-semibold">{{ slot.startTime }}</span>
              <span class="block text-xs opacity-80">{{ slot.startTime }}–{{ slot.endTime }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <h3 class="mb-2 mt-6 text-sm font-bold text-ink">Notes (optional)</h3>
      <BaseTextarea v-model="notes" placeholder="Anything the provider should know…" :rows="3" />
    </template>

    <EmptyState v-else title="Service unavailable" description="We couldn't load this service.">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action>
        <BaseButton variant="secondary" @click="router.push({ name: 'marketplace-providers' })">Back to marketplace</BaseButton>
      </template>
    </EmptyState>

    <!-- Sticky confirm bar -->
    <div
      v-if="service"
      class="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-base/95 px-4 py-3 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0"
    >
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <p class="truncate text-sm text-muted">
          {{ selectedSlot ? `${formatDate(selectedSlot.slotDate)} · ${selectedSlot.startTime}` : 'Pick a slot' }}
        </p>
        <BaseButton :disabled="!canConfirm" :loading="saving" @click="confirm">Confirm Booking</BaseButton>
      </div>
    </div>
  </section>
</template>
