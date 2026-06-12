<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const open = ref(false)
const root = ref(null)

function toggle() {
  open.value = !open.value
}
function close() {
  open.value = false
}
function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) close()
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="relative inline-block text-left">
    <div @click="toggle">
      <slot name="trigger" :open="open" />
    </div>
    <transition name="dd">
      <div
        v-if="open"
        class="absolute right-0 z-30 mt-2 min-w-44 overflow-hidden rounded-xl border border-line bg-base py-1 shadow-lg"
        @click="close"
      >
        <slot />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dd-enter-active,
.dd-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.dd-enter-from,
.dd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
