<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const auth = useAuthStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')

async function onSubmit() {
  const ok = await auth.login(email.value.trim(), password.value)
  if (ok) {
    toast.success('Welcome back!')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    router.push(redirect || { name: 'feed' })
  } else {
    toast.error(auth.error || 'Could not log in.')
  }
}
</script>

<template>
  <div class="animate-rise-fade">
    <h2 class="text-xl font-bold text-ink">Welcome back</h2>
    <p class="mt-1 text-sm text-muted">Log in to your Jamii Sasa account.</p>

    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        required
      />
      <BaseInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        autocomplete="current-password"
        required
      />

      <BaseButton type="submit" block :loading="auth.loading">Log in</BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-muted">
      New to Jamii Sasa?
      <RouterLink :to="{ name: 'register' }" class="font-semibold text-brand">Create an account</RouterLink>
    </p>
  </div>
</template>
