<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Check, Clock, CalendarClock, User } from 'lucide-vue-next'

import BaseModal from '@/components/ui/BaseModal.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import {
  bookingStatus,
  formatDate,
  formatKES,
  ORDER_STEPS,
  orderStepIndex,
  isCancelledBooking,
  slotDateTime,
} from '@/lib/marketplace'

const props = defineProps({
  open: { type: Boolean, default: false },
  booking: { type: Object, default: null },
  perspective: { type: String, default: 'customer' }, // customer | provider
})

const emit = defineEmits(['update:open', 'complete'])
const router = useRouter()

const b = computed(() => props.booking || {})
const status = computed(() => bookingStatus(b.value.status))
const cancelled = computed(() => isCancelledBooking(b.value.status))
const currentStep = computed(() => orderStepIndex(b.value.status))
const counterpartyRole = computed(() => (props.perspective === 'provider' ? 'Customer' : 'Provider'))

const dateLabel = computed(() => formatDate(b.value.bookingDate))
const totalDue = computed(() => (b.value.amount != null ? formatKES(b.value.amount) : 'Awaiting quote'))

// The customer can pay once a quote is accepted (amount set) and it isn't paid.
const canPay = computed(
  () =>
    props.perspective === 'customer' &&
    b.value.status === 'completed_unpaid' &&
    b.value.amount != null,
)

// Provider can complete order when status is 'accepted'
const canComplete = computed(
  () => props.perspective === 'provider' && b.value.status === 'accepted',
)

function handleComplete() {
  emit('complete', b.value.id)
  emit('update:open', false)
}

function handlePayment() {
  router.push({ name: 'checkout', params: { bookingId: b.value.id } })
  emit('update:open', false)
}

// --- Real-time arrival estimate ------------------------------------------
const target = computed(() => slotDateTime(b.value.slotDate, b.value.slotStart, b.value.bookingDate))
const slotEnd = computed(() => slotDateTime(b.value.slotDate, b.value.slotEnd, ''))
const now = ref(Date.now())
let timer = null

function startClock() {
  stopClock()
  now.value = Date.now()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
}
function stopClock() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => props.open,
  (isOpen) => (isOpen ? startClock() : stopClock()),
)
onBeforeUnmount(stopClock)

function humanDuration(ms) {
  const total = Math.floor(ms / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (d >= 1) return `${d}d ${h}h`
  if (h >= 1) return `${h}h ${m}m`
  if (m >= 1) return `${m}m ${s}s`
  return `${s}s`
}

// The big arrival readout (mirrors the "60 minutes" estimate in the design).
const eta = computed(() => {
  const st = b.value.status
  if (cancelled.value) return { big: '—', sub: status.value.label }
  if (st === 'paid' || st === 'completed' || st === 'completed_unpaid') {
    return { big: 'Completed', sub: 'Service fulfilled' }
  }
  if (!target.value) return { big: 'TBD', sub: 'Awaiting scheduling' }

  const diff = target.value.getTime() - now.value
  if (diff > 0) return { big: humanDuration(diff), sub: 'Estimated arrival' }

  if (slotEnd.value && now.value < slotEnd.value.getTime()) {
    return { big: 'On site', sub: 'Provider should have arrived' }
  }
  return { big: 'Due', sub: 'Scheduled time reached' }
})
</script>

<template>
  <BaseModal :open="open" title="Order Status" @update:open="emit('update:open', $event)">
    <div v-if="booking" class="space-y-5">
      <!-- Confirmation code (replaces an order id) -->
      <div>
        <p class="text-sm text-muted">
          Confirmation code:
          <span v-if="b.code" class="font-mono text-[1rem] font-bold tracking-widest text-brand">{{ b.code }}</span>
          <span v-else class="font-semibold text-muted">issued once accepted</span>
        </p>
        <p class="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
          <CalendarClock class="h-3.5 w-3.5" />
          <span v-if="b.slotLabel">  {{ b.slotLabel }}</span>
        </p>
      </div>

      <!-- Live arrival estimate -->
      <div class="rounded-card border border-line bg-surface px-4 py-5 text-center">
        <p class="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
          <Clock class="h-3.5 w-3.5" /> {{ eta.sub }}
        </p>
        <p class="mt-1 text-3xl font-extrabold text-ink">{{ eta.big }}</p>
      </div>

      <!-- Cancelled / declined banner, otherwise the progress stepper -->
      <div
        v-if="cancelled"
        class="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-center text-sm font-semibold text-danger"
      >
        This booking was {{ status.label.toLowerCase() }}.
      </div>
      <div v-else>
        <div class="flex items-start">
          <div v-for="(step, i) in ORDER_STEPS" :key="step.key" class="flex flex-1 flex-col items-center">
            <div class="flex w-full items-center">
              <span class="h-0.5 flex-1" :class="i === 0 ? 'bg-transparent' : i <= currentStep ? 'bg-brand' : 'bg-line'" />
              <span
                class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                :class="
                  i < currentStep
                    ? 'bg-brand text-white'
                    : i === currentStep
                      ? 'bg-brand text-white ring-4 ring-brand/15'
                      : 'border border-line bg-base text-muted'
                "
              >
                <Check v-if="i < currentStep" class="h-4 w-4" />
                <span v-else>{{ i + 1 }}</span>
              </span>
              <span class="h-0.5 flex-1" :class="i === ORDER_STEPS.length - 1 ? 'bg-transparent' : i < currentStep ? 'bg-brand' : 'bg-line'" />
            </div>
            <span class="mt-1.5 text-center text-[10px] leading-tight" :class="i <= currentStep ? 'font-semibold text-ink' : 'text-muted'">
              {{ step.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Counterparty -->
      <div class="flex items-center gap-3 border-t border-line pt-4">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-muted">
          <User class="h-5 w-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold text-ink">{{ b.counterpartyName }}</p>
          <p class="text-xs text-muted">{{ counterpartyRole }} · {{ b.serviceName }}</p>
        </div>
        <BaseBadge :variant="status.variant">{{ status.label }}</BaseBadge>
      </div>

        <!-- Customer location (provider view after acceptance) -->
        <div v-if="props.perspective === 'provider' && b.status === 'accepted' && b.locationAddress" class="mt-3 rounded-card border border-line bg-surface px-3 py-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Customer Location</p>
          <p class="text-sm font-medium text-ink">{{ b.locationAddress }}</p>
          <div class="mt-2">
            <a :href="b.googleMapsUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-sm font-semibold text-brand">Open in Google Maps</a>
          </div>
        </div>

      <!-- Total due -->
      <div class="flex items-center justify-between rounded-card bg-surface px-4 py-3">
        <span class="text-sm text-muted">Total amount due</span>
        <span class="text-lg font-extrabold text-ink">{{ totalDue }}</span>
      </div>

      <!-- Complete order (provider, accepted) -->
      <BaseButton
        v-if="canComplete"
        @click="handleComplete"
        class="w-full"
      >
        Complete Order
      </BaseButton>

      <!-- Pay (customer, completed_unpaid) -->
      <BaseButton
        v-else-if="canPay"
        @click="handlePayment"
        class="w-full"
      >
        Pay now
      </BaseButton>
    </div>
  </BaseModal>
</template>
