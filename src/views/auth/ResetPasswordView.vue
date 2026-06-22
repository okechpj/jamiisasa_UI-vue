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

const password = ref('')
const confirm = ref('')
const localError = ref('')

const token = route.query.oobCode || route.query.token || ''

async function onSubmit() {
  localError.value = ''

  if (!token) {
    localError.value = 'Invalid or missing reset token.'
    toast.error('Invalid or missing reset token.')
    return
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
  if (!passwordRegex.test(password.value)) {
    localError.value = 'Weak password, use a stronger password'
    return
  }

  if (password.value !== confirm.value) {
    localError.value = 'Passwords do not match.'
    return
  }

  const ok = await auth.resetPassword(token, password.value)
  if (ok) {
    toast.success('Password reset successfully! Please log in.')
    router.push({ name: 'login' })
  } else {
    localError.value = auth.error || 'Password reset failed.'
    toast.error(auth.error || 'Password reset failed.')
  }
}
</script>

<template>
  <div class="animate-rise-fade">
    <h2 class="text-xl font-bold text-ink">Choose a new password</h2>
    <p class="mt-1 text-sm text-muted">Reset your password to regain access to your account.</p>

    <div v-if="!token" class="mt-6 p-4 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-sm">
      <p class="font-semibold text-rose-950">Invalid link</p>
      <p class="mt-1">
        This link is missing a valid security token. Please request a new link.
      </p>
    </div>

    <form v-else class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="password"
        label="New Password"
        type="password"
        autocomplete="new-password"
        hint="At least 8 characters with a letter and a digit."
        required
      />
      <BaseInput
        v-model="confirm"
        label="Confirm Password"
        type="password"
        autocomplete="new-password"
        :error="localError"
        required
      />

      <BaseButton type="submit" block :loading="auth.loading">Update password</BaseButton>
    </form>

    <p class="mt-6 text-center text-sm text-muted border-t border-line pt-4">
      <RouterLink :to="{ name: 'login' }" class="font-semibold text-brand">Back to log in</RouterLink>
    </p>
  </div>
</template>
