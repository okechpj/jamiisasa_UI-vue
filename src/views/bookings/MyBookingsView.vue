<script setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { CalendarClock, AlertTriangle } from 'lucide-vue-next'

import { useBookingStore } from '@/stores/booking.store'
import { useToast } from '@/composables/useToast'
import { isTerminalBooking } from '@/lib/marketplace'
import BookingCard from '@/components/booking/BookingCard.vue'
import OrderStatusModal from '@/components/booking/OrderStatusModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const store = useBookingStore()
const toast = useToast()
const { myBookings, loading, error } = storeToRefs(store)

onMounted(() => store.fetchMyBookings())

// Active bookings vs finished history.
const current = computed(() => myBookings.value.filter((b) => !isTerminalBooking(b.status)))
const history = computed(() => myBookings.value.filter((b) => isTerminalBooking(b.status)))

// --- Cancel flow ---
const confirmOpen = ref(false)
const cancelId = ref('')
const busyId = ref('')

function askCancel(id) {
  cancelId.value = id
  confirmOpen.value = true
}
async function confirmCancel() {
  busyId.value = cancelId.value
  const ok = await store.cancel(cancelId.value)
  busyId.value = ''
  confirmOpen.value = false
  if (ok) toast.info('Booking cancelled.')
  else toast.error(store.error || 'Could not cancel the booking.')
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
    <h1 class="mb-4 text-xl font-bold text-ink">My Bookings</h1>

    <div v-if="loading && !myBookings.length" class="space-y-3">
      <BaseSkeleton v-for="i in 3" :key="i" class="h-28 w-full rounded-card" />
    </div>

    <EmptyState v-else-if="error" title="Couldn't load your bookings" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action><BaseButton variant="secondary" @click="store.fetchMyBookings()">Try again</BaseButton></template>
    </EmptyState>

    <EmptyState
      v-else-if="!myBookings.length"
      title="No bookings yet"
      description="Browse JamiiWera and book a service to get started."
    >
      <template #icon><CalendarClock class="h-6 w-6" /></template>
      <template #action>
        <RouterLink :to="{ name: 'marketplace-providers' }">
          <BaseButton>Explore JamiiWera</BaseButton>
        </RouterLink>
      </template>
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
            perspective="customer"
            :busy="busyId === b.id"
            @cancel="askCancel"
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
            perspective="customer"
            @view="openStatus"
          />
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Cancel booking?"
      message="This will cancel your booking request."
      confirm-label="Cancel booking"
      :busy="busyId !== ''"
      @confirm="confirmCancel"
    />

    <OrderStatusModal v-model:open="statusOpen" :booking="statusBooking" perspective="customer" />
  </section>
</template>
