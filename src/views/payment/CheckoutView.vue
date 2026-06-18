<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Smartphone, Check, X, Loader2 } from 'lucide-vue-next'

import { useBookingStore } from '@/stores/booking.store'
import { useToast } from '@/composables/useToast'
import { getQuote } from '@/api/quote.api'
import { initiateSTK, getPaymentStatus, verifyPayment } from '@/api/payment.api'
import { extractError } from '@/lib/errors'
import { formatKES } from '@/lib/marketplace'
import PaymentCard from '@/components/payment/PaymentCard.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  bookingId: { type: String, required: true },
})

const router = useRouter()
const store = useBookingStore()
const toast = useToast()

const booking = ref(null)
const quote = ref(null)
const payment = ref(null)
const services = ref([])
const loading = ref(true)
const loadError = ref('')

const payState = ref('idle') // idle | sending | waiting | success | failed
const payError = ref('')
let pollTimer = null

const showPaymentModal = computed(() => {
  return payState.value === 'waiting' || payState.value === 'success' || payState.value === 'failed'
})

function closeModal() {
  if (payState.value === 'failed') {
    payState.value = 'idle'
  }
}

function handleModalClose() {
  closeModal()
}

function retryPayment() {
  payError.value = ''
  payState.value = 'idle'
}

// Amount is always from the backend (the accepted quote), never user input.
const amount = computed(() => {
  if (quote.value) return Number(quote.value.amount) || 0
  return booking.value && booking.value.amount != null ? booking.value.amount : 0
})

const platformFee = computed(() => {
  if (payment.value) return Number(payment.value.platform_fee_amount) || 0
  return amount.value * 0.20 // Calculate 20% if payment not yet created
})

const providerEarnings = computed(() => {
  if (payment.value) return Number(payment.value.provider_earnings) || 0
  return amount.value - platformFee.value
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

    // Attempt to resume polling if a payment is already pending/waiting
    if (booking.value.status !== 'paid') {
      try {
        const p = await getPaymentStatus(props.bookingId)
        if (p) {
          payment.value = p
          if (p.status === 'pending' && p.paystack_ref) {
            payState.value = 'waiting'
            startPolling(p.paystack_ref)
          } else if (p.status === 'success') {
            payState.value = 'success'
          } else if (p.status === 'failed') {
            payState.value = 'failed'
          }
        }
      } catch (e) {
        // No payment created yet
      }
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

function startPolling(reference) {
  if (!reference) return
  stopPolling()
  pollTimer = setInterval(async () => {
    try {
      const res = await verifyPayment(reference)
      if (res.status === 'success') {
        payState.value = 'success'
        stopPolling()
        toast.success('Payment successful! Booking confirmed.')
        
        // Auto-redirect to Chat (Order Tracking) after 3 seconds
        setTimeout(() => {
          router.push({ name: 'chat', params: { bookingId: props.bookingId } })
        }, 3000)
      } else if (res.status === 'failed') {
        payState.value = 'failed'
        payError.value = 'Payment failed. Please try again.'
        stopPolling()
      }
    } catch {
      // Keep polling on transient errors or 404/pending responses.
    }
  }, 4000)
}

async function onPay({ sender, email }) {
  payError.value = ''
  payState.value = 'sending'
  try {
    const p = await initiateSTK(props.bookingId, sender, email)
    payment.value = p
    payState.value = 'waiting'
    startPolling(p.paystack_ref)
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

      <PaymentCard 
        v-else 
        :amount="amount" 
        :platform-fee="platformFee"
        :provider-earnings="providerEarnings"
        :state="payState" 
        :error="payError" 
        @pay="onPay" 
      />
    </div>

    <!-- Payment Process Modal (STK sent, Success, or Failure) -->
    <BaseModal :open="showPaymentModal" @close="handleModalClose">
      <div class="flex flex-col items-center justify-center text-center px-4 py-8">
        
        <!-- Icon section -->
        <!-- 1. STK Push Sent (waiting) -->
        <div v-if="payState === 'waiting'" class="relative flex items-center justify-center w-20 h-20 bg-muted/20 border border-line rounded-2xl mx-auto mb-6">
          <Smartphone class="h-10 w-10 text-ink" />
          <span class="absolute bottom-2 right-2 w-3.5 h-3.5 bg-success border-2 border-base rounded-full"></span>
        </div>

        <!-- 2. Payment Confirmed (success) -->
        <div v-else-if="payState === 'success'" class="relative flex items-center justify-center w-20 h-20 bg-success/10 border border-success/20 rounded-2xl mx-auto mb-6">
          <Check class="h-10 w-10 text-success" />
        </div>

        <!-- 3. Payment Failed (failed) -->
        <div v-else-if="payState === 'failed'" class="relative flex items-center justify-center w-20 h-20 bg-danger/10 border border-danger/20 rounded-2xl mx-auto mb-6">
          <X class="h-10 w-10 text-danger" />
        </div>

        <!-- Heading & Paragraph section -->
        <!-- 1. STK Push Sent -->
        <template v-if="payState === 'waiting'">
          <h2 class="text-xl font-bold text-ink mb-3">STK Push Sent</h2>
          <p class="text-sm text-muted leading-relaxed max-w-sm mb-8">
            We have initiated a transaction of <strong class="text-ink">{{ formatKES(amount) }}</strong> to your M-Pesa line. Please check your phone for the M-Pesa PIN prompt to authorize payment.
          </p>
          
          <!-- Loading spinner status -->
          <div class="flex items-center gap-2 text-sm font-semibold text-muted">
            <Loader2 class="h-4 w-4 animate-spin text-muted" />
            <span>Waiting for PIN verification...</span>
          </div>
        </template>

        <!-- 2. Payment Confirmed -->
        <template v-else-if="payState === 'success'">
          <h2 class="text-xl font-bold text-ink mb-3">Payment Confirmed!</h2>
          <p class="text-sm text-muted leading-relaxed max-w-sm mb-8">
            Your payment of <strong class="text-ink">{{ formatKES(amount) }}</strong> has been successfully authorized and held securely in Jamii Escrow.
          </p>
          
          <!-- Redirecting status -->
          <div class="flex items-center gap-2 text-sm font-semibold text-muted">
            <Loader2 class="h-4 w-4 animate-spin text-muted" />
            <span>Redirecting to Order Tracking...</span>
          </div>
        </template>

        <!-- 3. Payment Failed -->
        <template v-else-if="payState === 'failed'">
          <h2 class="text-xl font-bold text-ink mb-3">Payment Failed</h2>
          <p class="text-sm text-muted leading-relaxed max-w-sm mb-8">
            Your payment of <strong class="text-ink">{{ formatKES(amount) }}</strong> could not be authorized. Please check your balance or verify if you entered the correct PIN.
          </p>
          
          <!-- Action Buttons for Retry -->
          <div class="flex gap-3 w-full mt-2">
            <BaseButton class="flex-1" variant="outline" @click="closeModal">
              Close & Edit Number
            </BaseButton>
            <BaseButton class="flex-1" @click="retryPayment">
              Retry Payment
            </BaseButton>
          </div>
        </template>

      </div>
    </BaseModal>
  </section>
</template>
