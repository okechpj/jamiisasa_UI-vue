<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: { type: Object, required: true },
  mine: { type: Boolean, default: false },
})

const time = computed(() => {
  if (!props.message.createdAt) return ''
  const d = new Date(props.message.createdAt)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>

<template>
  <!-- System notice (e.g. quote accepted/rejected) -->
  <div v-if="message.type === 'system'" class="my-2 flex justify-center">
    <span class="rounded-full bg-base px-3 py-1 text-xs text-muted shadow-sm">{{ message.content }}</span>
  </div>

  <!-- Text message -->
  <div v-else class="flex" :class="mine ? 'justify-end' : 'justify-start'">
    <div
      class="max-w-[78%] px-3.5 py-2 text-sm shadow-sm"
      :class="
        mine
          ? 'rounded-2xl rounded-br-md bg-brand text-white'
          : 'rounded-2xl rounded-bl-md border border-line bg-base text-ink'
      "
    >
      <p class="whitespace-pre-wrap break-words leading-snug">{{ message.content }}</p>
      <p class="mt-1 text-right text-[10px]" :class="mine ? 'text-white/70' : 'text-muted'">{{ time }}</p>
    </div>
  </div>
</template>
