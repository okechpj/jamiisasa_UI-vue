<script setup>
import { ref, computed, onMounted } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import { getQuote, acceptQuote, rejectQuote } from '@/api/quote.api'
import { extractError } from '@/lib/errors'

/*
 * QuoteCard — renders a structured quote (type === 'quote' message). Fetches
 * the quote + its booking services from Supabase (never from Firestore) and,
 * for the customer, exposes Accept / Reject. Buttons disable after a decision.
 */
const props = defineProps({
  quoteId: { type: String, required: true },
  // Only the customer may decide; the provider sees status only.
  canDecide: { type: Boolean, default: false },
})

const quote = ref(null)
const services = ref([])
const loading = ref(true)
const error = ref('')
const acting = ref(false)
const status = ref('') // local override once decided

const effectiveStatus = computed(() => status.value || (quote.value ? quote.value.status : ''))
const isPending = computed(() => effectiveStatus.value === 'pending')

const statusLabel = computed(() => {
  switch (effectiveStatus.value) {
    case 'accepted':
      return 'Accepted'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Pending'
  }
})

function money(amount) {
  const n = Number(amount) || 0
  return `KES ${n.toLocaleString()}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await getQuote(props.quoteId)
    quote.value = data
    services.value = Array.isArray(data.services) ? data.services : []
  } catch (e) {
    error.value = extractError(e, 'Could not load this quote.')
  } finally {
    loading.value = false
  }
}

async function decide(action) {
  if (acting.value) return
  acting.value = true
  error.value = ''
  try {
    const updated = action === 'accept' ? await acceptQuote(props.quoteId) : await rejectQuote(props.quoteId)
    status.value = updated.status
  } catch (e) {
    error.value = extractError(e, 'Could not update the quote.')
  } finally {
    acting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="my-2 w-full max-w-[85%] rounded-card border border-line bg-base p-4">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-bold text-ink">Quote</h4>
      <span
        class="rounded-full px-2 py-0.5 text-xs font-semibold"
        :class="{
          'bg-surface text-muted': effectiveStatus === 'pending',
          'bg-success/10 text-success': effectiveStatus === 'accepted',
          'bg-danger/10 text-danger': effectiveStatus === 'rejected',
        }"
      >
        {{ statusLabel }}
      </span>
    </div>

    <p v-if="loading" class="mt-3 text-sm text-muted">Loading quote…</p>
    <p v-else-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>

    <template v-else-if="quote">
      <!-- Services from the booking -->
      <ul v-if="services.length" class="mt-3 space-y-1">
        <li v-for="s in services" :key="s.id" class="flex items-center justify-between text-sm text-ink">
          <span class="truncate">{{ s.service_name }}</span>
          <span class="text-xs text-muted">{{ s.service_category }}</span>
        </li>
      </ul>

      <!-- Scope / notes -->
      <p v-if="quote.notes" class="mt-3 text-sm text-muted">“{{ quote.notes }}”</p>

      <!-- Amount -->
      <div class="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span class="text-sm text-muted">Total</span>
        <span class="text-lg font-bold text-brand">{{ money(quote.amount) }}</span>
      </div>

      <!-- Customer actions -->
      <div v-if="canDecide && isPending" class="mt-3 flex gap-2">
        <BaseButton size="sm" :loading="acting" @click="decide('accept')">Accept</BaseButton>
        <BaseButton size="sm" variant="outline" :disabled="acting" @click="decide('reject')">Reject</BaseButton>
      </div>
    </template>
  </div>
</template>
