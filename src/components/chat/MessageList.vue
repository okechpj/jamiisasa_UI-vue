<script setup>
import { ref, watch, nextTick } from 'vue'

import MessageBubble from './MessageBubble.vue'
import QuoteCard from './QuoteCard.vue'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  currentUserId: { type: String, default: '' },
  // The customer may act on quote cards.
  canDecide: { type: Boolean, default: false },
})

const scroller = ref(null)

// Auto-scroll to the newest message.
watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  },
)
</script>

<template>
  <div ref="scroller" class="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 sm:px-4">
    <p v-if="loading" class="py-8 text-center text-sm text-muted">Loading messages…</p>
    <p v-else-if="!messages.length" class="py-8 text-center text-sm text-muted">
      No messages yet. Say hello 👋
    </p>
    <template v-else>
      <template v-for="m in messages" :key="m.id">
        <QuoteCard
          v-if="m.type === 'quote' && m.quoteId"
          :quote-id="m.quoteId"
          :can-decide="canDecide"
        />
        <MessageBubble v-else :message="m" :mine="m.senderId === currentUserId" />
      </template>
    </template>
  </div>
</template>
