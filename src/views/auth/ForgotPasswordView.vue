<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const auth = useAuthStore()
const toast = useToast()

const email = ref('')
const success = ref(false)

async function onSubmit() {
  success.value = false
  const ok = await auth.forgotPassword(email.value.trim())
  if (ok) {
    success.value = true
    toast.success('Reset link logged to console!')
  } else {
    toast.error(auth.error || 'Could not send reset password email.')
  }
}
</script>

<template>
  <div class="animate-rise-fade">
    <h2 class="text-xl font-bold text-ink">Reset password</h2>
    <p class="mt-1 text-sm text-muted">
      Enter your email address and we'll log a password reset link to the console.
    </p>

    <div v-if="success" class="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-sm">
      <p class="font-semibold text-emerald-950">Reset link generated!</p>
      <p class="mt-1">
        Please check the server console/terminal logs to find the password reset URL.
      </p>
    </div>

    <form v-else class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        required
      />

      <BaseButton type="submit" block :loading="auth.loading">Send reset link</BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-muted border-t border-line pt-4">
      <RouterLink :to="{ name: 'login' }" class="font-semibold text-brand">Back to log in</RouterLink>
    </p>
  </div>
</template>
