<script setup>
import { watch, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

const emit = defineEmits(['update:open', 'close'])

function close() {
  emit('update:open', false)
  emit('close')
}

function onKey(e) {
  if (e.key === 'Escape') close()
}

// Lock body scroll and wire Escape only while open.
watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        @click.self="close"
      >
        <div
          class="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-card bg-base shadow-xl sm:rounded-card"
        >
          <header
            v-if="title || $slots.header"
            class="flex items-center justify-between border-b border-line px-5 py-4"
          >
            <slot name="header">
              <h2 class="text-base font-bold text-ink">{{ title }}</h2>
            </slot>
            <button type="button" aria-label="Close" class="text-muted hover:text-ink" @click="close">
              <X class="h-5 w-5" />
            </button>
          </header>

          <div class="px-5 py-4">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="border-t border-line px-5 py-4">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
