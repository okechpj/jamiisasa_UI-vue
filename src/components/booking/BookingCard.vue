<script setup>
import { computed } from 'vue'
import { CalendarClock, Check, X, MessageCircle } from 'lucide-vue-next'

import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { bookingStatus, formatDate } from '@/lib/marketplace'

const props = defineProps({
  booking: { type: Object, required: true },
  perspective: { type: String, default: 'customer' }, // customer | provider
  busy: { type: Boolean, default: false },
})

defineEmits(['accept', 'decline', 'cancel', 'view'])

const status = computed(() => bookingStatus(props.booking.status))
const canAccept = computed(() => props.perspective === 'provider' && props.booking.status === 'quoted')
const canComplete = computed(() => props.perspective === 'provider' && props.booking.status === 'accepted')
const canCancel = computed(
  () => props.perspective === 'customer' && ['pending_quote', 'quoted', 'accepted'].includes(props.booking.status),
)
</script>

<template>
  <article class="rounded-card border border-line bg-base p-4">
    <div class="flex items-start gap-3">
      <BaseAvatar :name="booking.counterpartyName" :src="booking.counterpartyAvatar" size="md" />
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-sm font-bold text-ink">{{ booking.serviceName }}</h3>
        <p class="truncate text-xs text-muted">{{ booking.counterpartyName }}</p>
      </div>
      <BaseBadge :variant="status.variant">{{ status.label }}</BaseBadge>
    </div>

    <div class="mt-3 flex items-center gap-2 text-sm text-ink">
      <CalendarClock class="h-4 w-4 text-muted" />
      <!-- <span>{{ formatDate(booking.bookingDate) }}</span> -->
      <span v-if="booking.slotLabel" class="text-muted">· {{ booking.slotLabel }}</span>
    </div>

    <p v-if="booking.notes" class="mt-2 text-sm text-muted">{{ booking.notes }}</p>

    <!-- Confirmation code — set when the provider accepts; the same value is
         shown to both the customer and the provider. -->
    <div v-if="booking.code" class="mt-3 rounded-card border border-line bg-surface px-3 py-2">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Confirmation code</p>
      <p class="font-mono text-lg font-bold tracking-widest text-brand">{{ booking.code }}</p>
    </div>

    <!-- Actions: chat is always available (the negotiation channel); the room
         is created on first open. -->
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <BaseButton size="sm" variant="outline" @click="$emit('view', booking)">View</BaseButton>

      <RouterLink
        :to="{ name: 'chat', params: { bookingId: booking.id } }"
        class="inline-flex items-center gap-1.5 rounded-card border border-line px-3 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-surface"
      >
        <MessageCircle class="h-4 w-4" /> Chat
      </RouterLink>

      <!-- Provider actions -->
      <template v-if="canAccept">
        <BaseButton size="sm" :loading="busy" @click="$emit('accept', booking.id)">
          <Check class="h-4 w-4" /> Accept
        </BaseButton>
        <BaseButton size="sm" variant="outline" :disabled="busy" @click="$emit('decline', booking.id)">
          <X class="h-4 w-4" /> Decline
        </BaseButton>
      </template>

      <!-- Provider complete -->
      <template v-else-if="canComplete">
        <BaseButton size="sm" variant="outline" :loading="busy" @click="$emit('view', booking)">
          Complete Order
        </BaseButton>
      </template>

      <!-- Customer cancel -->
      <BaseButton
        v-else-if="canCancel"
        size="sm"
        variant="outline"
        :loading="busy"
        @click="$emit('cancel', booking.id)"
      >
        Cancel booking
      </BaseButton>
    </div>
  </article>
</template>
