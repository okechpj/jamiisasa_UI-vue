<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ArrowLeft, FileText, X } from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth.store'
import { useChatRoom } from '@/composables/useChatRoom'
import { createRoom } from '@/api/chat.api'
import { createQuote } from '@/api/quote.api'
import { extractError } from '@/lib/errors'

import MessageList from '@/components/chat/MessageList.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  bookingId: { type: String, required: true },
})

const router = useRouter()
const auth = useAuthStore()
const { userId, role } = storeToRefs(auth)

const { messages, loading, error, subscribeToChatRoom, sendMessage } = useChatRoom()

const room = ref(null)
const settingUp = ref(true)
const setupError = ref('')

// Provider/admin can initiate a quote; the customer can accept/reject quote cards.
const canQuote = computed(() => role.value === 'provider' || role.value === 'admin')
const canDecide = computed(() => role.value === 'customer')

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'my-bookings' })
}

// --- Quote composer (provider) -------------------------------------------
const showQuoteForm = ref(false)
const quoteAmount = ref('')
const quoteNotes = ref('')
const quoteSubmitting = ref(false)
const quoteError = ref('')

async function submitQuote() {
  const amount = Number(quoteAmount.value)
  if (!amount || amount <= 0) {
    quoteError.value = 'Enter a valid amount.'
    return
  }
  quoteSubmitting.value = true
  quoteError.value = ''
  try {
    await createQuote({ booking_id: props.bookingId, amount, notes: quoteNotes.value.trim() })
    quoteAmount.value = ''
    quoteNotes.value = ''
    showQuoteForm.value = false
  } catch (e) {
    quoteError.value = extractError(e, 'Could not send the quote.')
  } finally {
    quoteSubmitting.value = false
  }
}

// --- Text messages --------------------------------------------------------
async function handleSend(text) {
  if (!room.value) return
  try {
    await sendMessage(room.value.id, { senderId: userId.value, content: text })
  } catch (e) {
    error.value = extractError(e, 'Could not send your message.')
  }
}

onMounted(async () => {
  settingUp.value = true
  setupError.value = ''
  try {
    room.value = await createRoom(props.bookingId)
    await subscribeToChatRoom(room.value.id)
  } catch (e) {
    setupError.value = extractError(e, 'Could not open this chat.')
  } finally {
    settingUp.value = false
  }
})
</script>

<template>
  <!-- Full-screen on mobile (covers the app shell); a contained card on desktop. -->
  <div
    class="fixed inset-0 z-40 flex flex-col bg-base md:static md:z-auto md:mx-auto md:h-[calc(100dvh-3rem)] md:max-w-2xl md:overflow-hidden md:rounded-2xl md:border md:border-line md:shadow-sm"
  >
    <!-- Header -->
    <header
      class="flex items-center gap-3 border-b border-line bg-base/90 px-3 py-3 backdrop-blur"
      :style="{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }"
    >
      <button
        type="button"
        aria-label="Back"
        class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
        @click="goBack"
      >
        <ArrowLeft class="h-5 w-5" />
      </button>
      <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">
        JS
      </div>
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-sm font-bold text-ink">Chat &amp; Negotiation</h1>
        <p class="truncate text-xs text-muted">Booking #{{ bookingId.slice(0, 8) }}</p>
      </div>
      <button
        v-if="canQuote && room"
        type="button"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
        @click="showQuoteForm = !showQuoteForm"
      >
        <component :is="showQuoteForm ? X : FileText" class="h-4 w-4" />
        {{ showQuoteForm ? 'Close' : 'Quote' }}
      </button>
    </header>

    <!-- Setup states -->
    <div v-if="settingUp" class="flex flex-1 items-center justify-center text-sm text-muted">
      Opening chat…
    </div>
    <div
      v-else-if="setupError"
      class="flex flex-1 items-center justify-center px-6 text-center text-sm text-danger"
    >
      {{ setupError }}
    </div>

    <template v-else>
      <!-- Provider quote composer -->
      <div v-if="showQuoteForm" class="space-y-2 border-b border-line bg-surface px-4 py-3">
        <input
          v-model="quoteAmount"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Amount (KES)"
          class="w-full rounded-xl border border-line bg-base px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
        >
        <input
          v-model="quoteNotes"
          type="text"
          placeholder="Scope / notes (optional)"
          class="w-full rounded-xl border border-line bg-base px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
        >
        <p v-if="quoteError" class="text-xs text-danger">{{ quoteError }}</p>
        <BaseButton size="sm" :loading="quoteSubmitting" @click="submitQuote">Send quote</BaseButton>
      </div>

      <!-- Realtime stream (subtle surface backdrop for depth) -->
      <MessageList
        class="bg-surface"
        :messages="messages"
        :loading="loading"
        :current-user-id="userId"
        :can-decide="canDecide"
      />

      <p v-if="error" class="bg-surface px-4 pb-1 text-xs text-danger">{{ error }}</p>

      <!-- Composer -->
      <ChatInput :disabled="!room" @send="handleSend" />
    </template>
  </div>
</template>
