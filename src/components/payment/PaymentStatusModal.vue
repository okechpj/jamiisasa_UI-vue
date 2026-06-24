<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Check, X, Loader2 } from 'lucide-vue-next'
import { formatKES } from '@/lib/marketplace'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { getPaymentStatus, verifyPayment } from '@/api/payment.api'

const props = defineProps({
  bookingId: { type: String, required: true },
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['update:open', 'paid'])

const state = ref('idle') // idle | sending | waiting | success | failed
const info = ref(null)
let pollTimer = null

watch(() => props.open, (v) => {
  if (v) startPollingIfNeeded()
  else stopPolling()
})

onBeforeUnmount(() => stopPolling())

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function fetchLatest() {
  try {
    const p = await getPaymentStatus(props.bookingId)
    info.value = p
    if (!p) return null
    return p
  } catch (e) {
    return null
  }
}

function startPolling(reference) {
  stopPolling()
  if (!reference) return
  pollTimer = setInterval(async () => {
    try {
      const res = await verifyPayment(reference)
      if (res.status === 'success' || res.status === 'paid') {
        state.value = 'success'
        stopPolling()
        emit('paid')
      } else if (res.status === 'failed') {
        state.value = 'failed'
        stopPolling()
      } else {
        state.value = 'waiting'
      }
    } catch (e) {
      // keep waiting
    }
  }, 3000)
}

async function startPollingIfNeeded() {
  state.value = 'sending'
  const p = await fetchLatest()
  if (!p) {
    state.value = 'failed'
    return
  }
  // map statuses
  if (p.status === 'pending' || p.status === 'pending' || p.status === 'processing') {
    state.value = 'waiting'
    if (p.paystack_ref) startPolling(p.paystack_ref)
  } else if (p.status === 'success' || p.status === 'paid') {
    state.value = 'success'
    emit('paid')
  } else {
    state.value = 'failed'
  }
}

function close() {
  emit('update:open', false)
}

function retry() {
  // consumer should re-initiate the payment externally; we close and let them trigger again
  emit('update:open', false)
}
</script>

<template>
  <BaseModal :open="open" @close="close" :closeable="state !== 'waiting'">
    <div class="text-center px-4 py-6">
      <div v-if="state === 'sending' || state === 'waiting'" class="space-y-4">
        <div class="mx-auto w-16 h-16 flex items-center justify-center rounded-lg bg-muted/10 border border-line">
          <Loader2 class="h-8 w-8 animate-spin text-muted" />
        </div>
        <h2 class="text-lg font-bold">M-Pesa Payment</h2>
        <p class="text-sm text-muted">A payment request has been sent to the customer's phone. Waiting for them to complete payment.</p>
        <p class="text-sm text-muted">This window will update automatically when we receive a response.</p>
      </div>

      <div v-else-if="state === 'success'" class="space-y-4">
        <div class="mx-auto w-16 h-16 flex items-center justify-center rounded-lg bg-success/10 border border-success/20">
          <Check class="h-8 w-8 text-success" />
        </div>
        <h2 class="text-lg font-bold">Payment Received</h2>
        <p class="text-sm text-muted">The customer has completed payment.</p>
        <p class="text-sm font-semibold">{{ info && info.amount ? formatKES(Number(info.amount)) : '' }}</p>
        <BaseButton class="w-full" @click="close">Done</BaseButton>
      </div>

      <div v-else-if="state === 'failed'" class="space-y-4">
        <div class="mx-auto w-16 h-16 flex items-center justify-center rounded-lg bg-danger/10 border border-danger/20">
          <X class="h-8 w-8 text-danger" />
        </div>
        <h2 class="text-lg font-bold">Payment Not Completed</h2>
        <p class="text-sm text-muted">The payment was not completed. You can retry sending the request.</p>
        <div class="flex gap-3">
          <BaseButton variant="outline" class="flex-1" @click="close">Close</BaseButton>
          <BaseButton class="flex-1" @click="retry">Retry</BaseButton>
        </div>
      </div>

    </div>
  </BaseModal>
</template>
