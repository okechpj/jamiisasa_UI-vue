<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

import { useBookingStore } from '@/stores/booking.store'
import { useToast } from '@/composables/useToast'
import { getQuote } from '@/api/quote.api'
import { initiateSTK, getPaymentStatus } from '@/api/payment.api'
import { extractError } from '@/lib/errors'
import { formatKES } from '@/lib/marketplace'
import PaymentCard from '@/components/payment/PaymentCard.vue'

const props = defineProps({
  bookingId: { type: String, required: true },
})

const router = useRouter()
const store = useBookingStore()
const toast = useToast()

const booking = ref(null)
const quote = ref(null)
const services = ref([])
const loading = ref(true)
const loadError = ref('')

const payState = ref('idle') // idle | sending | waiting | success | failed
const payError = ref('')
let pollTimer = null

// Amount is always from the backend (the accepted quote), never user input.
const amount = computed(() => {
  if (quote.value) return Number(quote.value.amount) || 0
  return booking.value && booking.value.amount != null ? booking.value.amount : 0
})
const canPay = computed(
  () => booking.value && booking.value.acceptedQuoteId && booking.value.status === 'completed_unpaid',
)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    // Try customer bookings first
    if (!store.myBookings.length) await store.fetchMyBookings()
    booking.value = store.myBookings.find((b) => b.id === props.bookingId) || null
    
    // If not found, try provider bookings
    if (!booking.value) {
      if (!store.providerBookings.length) await store.fetchProviderBookings()
      booking.value = store.providerBookings.find((b) => b.id === props.bookingId) || null
    }
    
    if (!booking.value) {
      loadError.value = 'Booking not found.'
      return
    }
    if (booking.value.status === 'paid') payState.value = 'success'
    if (booking.value.acceptedQuoteId) {
      const d = await getQuote(booking.value.acceptedQuoteId)
      quote.value = d
      services.value = Array.isArray(d.services) ? d.services : []
    }
  } catch (e) {
    loadError.value = extractError(e, 'Could not load the booking.')
  } finally {
    loading.value = false
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(async () => {
    try {
      const p = await getPaymentStatus(props.bookingId)
      if (p.status === 'success') {
        payState.value = 'success'
        stopPolling()
        toast.success('Payment successful! Booking confirmed.')
      } else if (p.status === 'failed') {
        payState.value = 'failed'
        payError.value = 'Payment failed or was cancelled. Please try again.'
        stopPolling()
      }
    } catch {
      // 404 until the payment row exists / transient — keep polling.
    }
  }, 4000)
}

async function onPay({ sender, recipient }) {
  payError.value = ''
  payState.value = 'sending'
  try {
    await initiateSTK(props.bookingId, sender, recipient)
    payState.value = 'waiting'
    startPolling()
  } catch (e) {
    payState.value = 'failed'
    payError.value = extractError(e, 'Could not start the payment.')
  }
}

onMounted(load)
onBeforeUnmount(stopPolling)
</script>

<template>
  <section class="mx-auto max-w-xl">
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      @click="router.back()"
    >
      <ArrowLeft class="h-4 w-4" /> Back
    </button>
    <h1 class="mb-4 text-xl font-bold text-ink">Checkout</h1>

    <p v-if="loading" class="text-sm text-muted">Loading…</p>
    <div v-else-if="loadError" class="rounded-card border border-line bg-base p-4 text-sm text-danger">
      {{ loadError }}
    </div>

    <div v-else class="space-y-4">
      <!-- Quote breakdown -->
      <div class="rounded-card border border-line bg-base p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted">{{ booking.counterpartyName }}</p>
        <ul v-if="services.length" class="mt-2 space-y-1">
          <li v-for="s in services" :key="s.id" class="flex items-center justify-between text-sm text-ink">
            <span class="truncate">{{ s.service_name }}</span>
            <span class="text-xs text-muted">{{ s.service_category }}</span>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-muted">{{ booking.serviceName }}</p>
        <p v-if="quote && quote.notes" class="mt-2 text-sm text-muted">“{{ quote.notes }}”</p>
        <div class="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span class="text-sm text-muted">Total</span>
          <span class="text-lg font-bold text-brand">{{ formatKES(amount) }}</span>
        </div>
      </div>

      <!-- No accepted quote: nothing to pay -->
      <div
        v-if="!canPay && payState !== 'success'"
        class="rounded-card border border-line bg-surface p-4 text-sm text-muted"
      >
        <template v-if="!booking.acceptedQuoteId">
          This booking has no accepted quote yet. Accept a quote in the chat first.
        </template>
        <template v-else-if="booking.status !== 'completed_unpaid'">
          Complete the order first before collecting payment.
        </template>
      </div>

      <PaymentCard v-else :amount="amount" :state="payState" :error="payError" @pay="onPay" />
    </div>
  </section>
</template>
