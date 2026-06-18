<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'
import { usePwaStore } from '@/stores/pwa.store'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const auth = useAuthStore()
const pwa = usePwaStore()

// Rehydrate the current user's profile on load if a token is already present
// (persistent auth survives reloads).
onMounted(() => {
  pwa.init()
  if (auth.isAuthenticated && !auth.user) {
    auth.fetchMe()
  }
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </RouterView>

  <ToastContainer />
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
