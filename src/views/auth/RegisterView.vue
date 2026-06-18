<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const auth = useAuthStore()
const toast = useToast()
const router = useRouter()

const form = reactive({
  first_name: '',
  last_name: '',
  username: '',
  phone_number: '',
  email: '',
  password: '',
  role: 'customer',
})

const confirm = ref('')
const localError = ref('')

async function onSubmit() {
  localError.value = ''

  if (form.password.length < 6) {
    localError.value = 'Password must be at least 6 characters.'
    return
  }
  if (form.password !== confirm.value) {
    localError.value = 'Passwords do not match.'
    return
  }

  // register() also logs in (the backend issues no token on register).
  const ok = await auth.register({
    ...form,
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    username: form.username.trim(),
    phone_number: form.phone_number.trim(),
    email: form.email.trim(),
  })

  if (ok) {
    toast.success('Account created. Welcome to Jamii Sasa!')
    router.push({ name: 'feed' })
  } else {
    toast.error(auth.error || 'Could not create your account.')
  }
}
</script>

<template>
  <div class="animate-rise-fade">
    <h2 class="text-xl font-bold text-ink">Create your account</h2>
    <p class="mt-1 text-sm text-muted">Join your neighborhood marketplace.</p>

    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model="form.first_name" label="First name" autocomplete="given-name" required />
        <BaseInput v-model="form.last_name" label="Last name" autocomplete="family-name" required />
      </div>

      <BaseInput v-model="form.username" label="Username" autocomplete="username" required />
      <BaseInput v-model="form.phone_number" label="Phone number" type="tel" autocomplete="tel" />
      <BaseInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        required
      />
      <BaseInput
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="new-password"
        hint="At least 6 characters."
        required
      />
      <BaseInput
        v-model="confirm"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        :error="localError"
        required
      />

      <BaseButton type="submit" block :loading="auth.loading">Create account</BaseButton>
    </form>

    <div class="mt-6 space-y-2 text-center text-sm text-muted border-t border-line pt-4">
      <p>
        Already have an account?
        <RouterLink :to="{ name: 'login' }" class="font-semibold text-brand">Log in</RouterLink>
      </p>
      <p>
        Are you a service provider?
        <RouterLink :to="{ name: 'register-provider' }" class="font-semibold text-brand">Register as a provider</RouterLink>
      </p>
    </div>
  </div>
</template>
