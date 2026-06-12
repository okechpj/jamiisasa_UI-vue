<script setup>
import { ref } from 'vue'
import { Send } from 'lucide-vue-next'

defineProps({
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['send'])
const text = ref('')

function submit() {
  const value = text.value.trim()
  if (!value) return
  emit('send', value)
  text.value = ''
}
</script>

<template>
  <form
    class="flex items-center gap-2 border-t border-line bg-base px-3 py-2.5"
    :style="{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }"
    @submit.prevent="submit"
  >
    <input
      v-model="text"
      :disabled="disabled"
      type="text"
      placeholder="Message…"
      class="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand focus:bg-base focus:outline-none disabled:opacity-50"
    >
    <button
      type="submit"
      :disabled="disabled || !text.trim()"
      aria-label="Send message"
      class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Send class="h-5 w-5" />
    </button>
  </form>
</template>
