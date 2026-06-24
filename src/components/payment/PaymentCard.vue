<script setup>
import { ref, computed } from 'vue'
import { Check, Smartphone, Mail } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import { formatKES } from '@/lib/marketplace'

/*
 * PaymentCard — collects the customer phone number and prompts them for payment.
 * Shows a beautiful green Safaricom M-Pesa card, billing email picked from profile,
 * and button text tailored to the user's role.
 */
const props = defineProps({
  amount: { type: Number, default: 0 },
  // idle | sending | waiting | success | failed
  state: { type: String, default: 'idle' },
  error: { type: String, default: '' },
  perspective: { type: String, default: 'customer' }, // customer | provider
  customerEmail: { type: String, default: '' },
})

const emit = defineEmits(['pay'])

const senderPhone = ref('')

// Normalise to Safaricom's 2547XXXXXXXX / 2541XXXXXXXX format.
function normalize(input) {
  let s = String(input).replace(/\D/g, '')
  if (s.startsWith('0')) s = '254' + s.slice(1)
  else if (s.length === 9 && (s.startsWith('7') || s.startsWith('1'))) s = '254' + s
  return s
}
const normalizedSender = computed(() => normalize(senderPhone.value))
const validSender = computed(() => /^254(7|1)\d{8}$/.test(normalizedSender.value))
const allValid = computed(() => validSender.value)
const busy = computed(() => props.state === 'sending' || props.state === 'waiting')

function submit() {
  if (busy.value) return
  if (!allValid.value) return
  emit('pay', { sender: normalizedSender.value, email: props.customerEmail || '' })
}
</script>

<template>
  <div class="rounded-card border border-line bg-base p-5 space-y-5 animate-rise-fade">
    <!-- Payment Method Section -->
    <div>
      <h3 class="text-sm font-bold text-ink mb-3">Payment Method</h3>
      
      <!-- Green Safaricom M-Pesa Card -->
      <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#00AC4A] to-[#008A3B] p-5 text-white shadow-sm transition-all duration-200">
        <!-- Decorative background circles -->
        <div class="absolute -right-8 -bottom-8 h-28 w-28 rounded-full bg-white/5"></div>
        <div class="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-white/5"></div>
        
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xl font-extrabold tracking-wider">m-pesa</span>
              <span class="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">STK Push</span>
            </div>
            <p class="text-[11px] text-white/80">Safaricom Mobile Money</p>
          </div>
          
          <!-- Selected checkmark indicator -->
          <div class="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#00AC4A]">
            <Check class="h-3.5 w-3.5 stroke-[3.5px]" />
          </div>
        </div>
        
        <div class="mt-6 flex items-end justify-between">
          <div class="space-y-0.5">
            <p class="text-[9px] uppercase tracking-wider text-white/70">Payment Flow</p>
            <p class="text-xs font-semibold">Instant PIN Prompt</p>
          </div>
          <div class="text-right">
            <p class="text-[9px] uppercase tracking-wider text-white/70">Security</p>
            <p class="text-xs font-semibold">Jamii Sasa Escrow</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Form Fields -->
    <div class="space-y-4">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
          {{ props.perspective === 'provider' ? 'Customer Phone Number' : 'M-Pesa Phone Number' }}
        </label>
        
        <div class="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-0.5 focus-within:border-brand">
          <Smartphone class="h-5 w-5 shrink-0 text-muted" />
          <input
            v-model="senderPhone"
            :disabled="busy"
            type="tel"
            inputmode="tel"
            placeholder="07XXXXXXXX"
            class="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none disabled:opacity-50"
          >
        </div>
        
        <p v-if="senderPhone && !validSender" class="mt-1 text-xs text-danger">
          Enter a valid Safaricom number (e.g. 07XXXXXXXX or 01XXXXXXXX).
        </p>
      </div>

      <!-- Customer Profile Email Info -->
      <div v-if="props.customerEmail" class="flex items-center gap-2 rounded-card border border-line bg-surface/50 px-3 py-2 text-xs text-muted">
        <Mail class="h-4 w-4 shrink-0 text-muted/80" />
        <span class="truncate">
          {{ props.perspective === 'provider' ? 'Customer email:' : 'Billing email:' }}
          <strong class="text-ink font-semibold">{{ props.customerEmail }}</strong> (picked from profile)
        </span>
      </div>

      <!-- Informative Subtext -->
      <p class="text-xs text-muted leading-relaxed">
        {{ props.perspective === 'provider'
          ? "We will send a secure M-Pesa PIN prompt directly to the customer's phone. They will key in their PIN to authorize the transaction."
          : "We will send a secure M-Pesa prompt to your phone. Check your phone screen and enter your PIN to authorize payment."
        }}
      </p>

      <!-- Error State -->
      <div v-if="error" class="text-sm text-danger font-medium bg-danger/5 border border-danger/10 rounded-card p-3">
        {{ error }}
      </div>

      <!-- CTA Button -->
      <BaseButton
        class="w-full mt-2"
        :disabled="!allValid || busy"
        :loading="busy"
        @click="submit"
      >
        {{ props.perspective === 'provider' ? 'Prompt client for payment' : 'Continue to Payment' }}
      </BaseButton>
    </div>
  </div>
</template>
