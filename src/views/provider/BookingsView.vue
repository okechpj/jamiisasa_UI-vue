<script setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { Inbox, AlertTriangle } from 'lucide-vue-next'

import { useBookingStore } from '@/stores/booking.store'
import { useToast } from '@/composables/useToast'
import { isTerminalBooking } from '@/lib/marketplace'
import BookingCard from '@/components/booking/BookingCard.vue'
import OrderStatusModal from '@/components/booking/OrderStatusModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const router = useRouter()
const store = useBookingStore()
const toast = useToast()
const { providerBookings, loading, error } = storeToRefs(store)

onMounted(() => store.fetchProviderBookings())

const busyId = ref('')

// Current bookings (needs-attention first), and finished history.
const ATTENTION = { pending_quote: 0, quoted: 1, accepted: 2 }
const current = computed(() =>
  providerBookings.value
    .filter((b) => !isTerminalBooking(b.status))
    .slice()
    .sort((a, b) => (ATTENTION[a.status] ?? 9) - (ATTENTION[b.status] ?? 9)),
)
const history = computed(() => providerBookings.value.filter((b) => isTerminalBooking(b.status)))

async function onAccept(id) {
  busyId.value = id
  const ok = await store.accept(id)
  busyId.value = ''
  if (ok) toast.success('Booking accepted.')
  else toast.error(store.error || 'Could not accept the booking.')
}
async function onDecline(id) {
  busyId.value = id
  const ok = await store.decline(id)
  busyId.value = ''
  if (ok) toast.info('Booking declined.')
  else toast.error(store.error || 'Could not decline the booking.')
}

async function onComplete(id) {
  const ok = await store.complete(id)
  if (ok) {
    toast.success('Order marked as completed.')
    // Find the completed booking
    const booking = store.providerBookings.find(b => b.id === id)
    if (booking) {
      statusOpen.value = false
      // Navigate to checkout after a brief delay
      setTimeout(() => {
        router.push({ name: 'checkout', params: { bookingId: id } })
      }, 500)
    }
  } else {
    toast.error(store.error || 'Could not complete the booking.')
  }
}

// --- Order status modal ---
const statusOpen = ref(false)
const statusBooking = ref(null)
function openStatus(booking) {
  statusBooking.value = booking
  statusOpen.value = true
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <h1 class="mb-4 text-xl font-bold text-ink">Incoming Bookings</h1>

    <div v-if="loading && !providerBookings.length" class="space-y-3">
      <BaseSkeleton v-for="i in 3" :key="i" class="h-28 w-full rounded-card" />
    </div>

    <EmptyState v-else-if="error" title="Couldn't load bookings" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action><BaseButton variant="secondary" @click="store.fetchProviderBookings()">Try again</BaseButton></template>
    </EmptyState>

    <EmptyState
      v-else-if="!providerBookings.length"
      title="No bookings yet"
      description="Booking requests from customers will appear here."
    >
      <template #icon><Inbox class="h-6 w-6" /></template>
    </EmptyState>

    <div v-else class="space-y-8">
      <!-- Current -->
      <div v-if="current.length">
        <h2 class="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Current</h2>
        <div class="space-y-3">
          <BookingCard
            v-for="b in current"
            :key="b.id"
            :booking="b"
            perspective="provider"
            :busy="busyId === b.id"
            @accept="onAccept"
            @decline="onDecline"
            @view="openStatus"
          />
        </div>
      </div>

      <!-- History -->
      <div v-if="history.length">
        <h2 class="mb-3 text-xs font-bold uppercase tracking-wide text-muted">History</h2>
        <div class="space-y-3 opacity-90">
          <BookingCard
            v-for="b in history"
            :key="b.id"
            :booking="b"
            perspective="provider"
            @view="openStatus"
          />
        </div>
      </div>
    </div>

    <OrderStatusModal v-model:open="statusOpen" :booking="statusBooking" perspective="provider" @complete="onComplete" />
  </section>
</template>
