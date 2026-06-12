<script setup>
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const icons = { success: CheckCircle2, error: AlertCircle, info: Info }
const tones = { success: 'text-success', error: 'text-danger', info: 'text-brand' }
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
      <transition-group name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-base px-4 py-3 shadow-lg"
          role="status"
        >
          <component :is="icons[t.type] || Info" class="mt-0.5 h-5 w-5 shrink-0" :class="tones[t.type] || 'text-brand'" />
          <p class="flex-1 text-sm text-ink">{{ t.message }}</p>
          <button type="button" aria-label="Dismiss" class="text-muted hover:text-ink" @click="dismiss(t.id)">
            <X class="h-4 w-4" />
          </button>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
