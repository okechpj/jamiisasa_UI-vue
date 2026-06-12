<script setup>
import { ref, computed } from 'vue'
import { CheckCircle2, Smartphone, UserCircle } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { formatKES } from '@/lib/marketplace'

/*
 * PaymentCard — collects the sender (customer) and recipient (provider) phone
 * numbers and triggers an M-Pesa STK push. The amount is supplied by the parent
 * (fetched from the backend) and is strictly read-only here.
 */
const props = defineProps({
  amount: { type: Number, default: 0 },
  // idle | sending | waiting | success | failed
  state: { type: String, default: 'idle' },
  error: { type: String, default: '' },
})

const emit = defineEmits(['pay'])

const senderPhone = ref('')
const recipientPhone = ref('')

// Normalise to Daraja's 2547XXXXXXXX / 2541XXXXXXXX format.
function normalize(input) {
  let s = String(input).replace(/\D/g, '')
  if (s.startsWith('0')) s = '254' + s.slice(1)
  else if (s.length === 9 && (s.startsWith('7') || s.startsWith('1'))) s = '254' + s
  return s
}
const normalizedSender = computed(() => normalize(senderPhone.value))
const normalizedRecipient = computed(() => normalize(recipientPhone.value))
const validSender = computed(() => /^254(7|1)\d{8}$/.test(normalizedSender.value))
const validRecipient = computed(() => /^254(7|1)\d{8}$/.test(normalizedRecipient.value))
const allValid = computed(() => validSender.value && validRecipient.value)
const busy = computed(() => props.state === 'sending' || props.state === 'waiting')

const label = computed(() => {
  if (props.state === 'sending') return 'Sending STK Push…'
  if (props.state === 'waiting') return 'Waiting for confirmation…'
  return 'Make Payment'
})

function submit() {
  if (!allValid.value || busy.value) return
  emit('pay', { sender: normalizedSender.value, recipient: normalizedRecipient.value })
}
</script>

<template>
  <div class="rounded-card border border-line bg-base p-5">
    <p class="text-xs font-medium uppercase tracking-wide text-muted">Amount due</p>
    <p class="mt-1 text-3xl font-extrabold text-ink">{{ formatKES(amount) }}</p>

    <!-- Success -->
    <div v-if="state === 'success'" class="mt-5 flex flex-col items-center gap-1 text-center">
      <CheckCircle2 class="h-12 w-12 text-success" />
      <p class="text-lg font-bold text-ink">Payment Successful 🎉</p>
      <p class="text-sm text-muted">Booking confirmed.</p>
    </div>

    <template v-else>
      <!-- Customer phone (sender - who gets charged) -->
      <label class="mt-5 block text-sm font-semibold text-ink">Customer phone number (sender)</label>
      <div class="mt-1.5 flex items-center gap-2 rounded-card border border-line bg-surface px-3 focus-within:border-brand">
        <Smartphone class="h-5 w-5 shrink-0 text-muted" />
        <input
          v-model="senderPhone"
          :disabled="busy"
          type="tel"
          inputmode="tel"
          placeholder="07XX XXX XXX"
          class="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none disabled:opacity-50"
        >
      </div>
      <p v-if="senderPhone && !validSender" class="mt-1 text-xs text-danger">Enter a valid Safaricom number.</p>

      <!-- Provider phone (recipient - who receives payment) -->
      <label class="mt-4 block text-sm font-semibold text-ink">Provider phone number (recipient)</label>
      <div class="mt-1.5 flex items-center gap-2 rounded-card border border-line bg-surface px-3 focus-within:border-brand">
        <UserCircle class="h-5 w-5 shrink-0 text-muted" />
        <input
          v-model="recipientPhone"
          :disabled="busy"
          type="tel"
          inputmode="tel"
          placeholder="07XX XXX XXX"
          class="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none disabled:opacity-50"
        >
      </div>
      <p v-if="recipientPhone && !validRecipient" class="mt-1 text-xs text-danger">Enter a valid Safaricom number.</p>

      <p v-if="state === 'waiting'" class="mt-3 rounded-card bg-surface px-3 py-2 text-sm text-muted">
        Check your phone to complete the payment…
      </p>
      <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>

      <BaseButton class="mt-4 w-full" :disabled="!allValid || busy" :loading="busy" @click="submit">
        {{ label }}
      </BaseButton>
    </template>
  </div>
</template>
