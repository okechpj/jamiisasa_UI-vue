<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'
import { useProviderStore } from '@/stores/provider.store'
import { useToast } from '@/composables/useToast'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const auth = useAuthStore()
const providerStore = useProviderStore()
const toast = useToast()
const router = useRouter()

const form = reactive({
  first_name: '',
  last_name: '',
  username: '',
  phone_number: '',
  email: '',
  password: '',
  role: 'provider',
  businessName: '',
  description: '',
  location: '',
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
  if (!form.businessName.trim()) {
    localError.value = 'Business name is required.'
    return
  }
  if (!form.location.trim()) {
    localError.value = 'Location of operation is required.'
    return
  }

  // 1. Register provider user
  const ok = await auth.register({
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    username: form.username.trim(),
    phone_number: form.phone_number.trim(),
    email: form.email.trim(),
    password: form.password,
    role: 'provider',
  })

  if (!ok) {
    toast.error(auth.error || 'Could not create provider account.')
    return
  }

  // 2. Create provider business profile immediately
  const profileOk = await providerStore.createProfile({
    businessName: form.businessName.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
  })

  if (profileOk) {
    toast.success('Welcome! Your provider profile was created successfully.')
    router.push({ name: 'provider-profile' })
  } else {
    toast.warning('Account created, but we could not set up your profile details. Please update them here.')
    router.push({ name: 'provider-profile' })
  }
}
</script>

<template>
  <div class="animate-rise-fade max-w-lg mx-auto">
    <h2 class="text-xl font-bold text-ink font-sans">Register as a Service Provider</h2>
    <p class="mt-1 text-sm text-muted">Set up your business profile to offer cleaning and other services.</p>

    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <!-- Section: Personal Details -->
      <fieldset class="border-t border-line pt-4 space-y-4">
        <legend class="text-xs font-semibold uppercase tracking-wider text-muted px-2">Account Details</legend>
        
        <div class="grid grid-cols-2 gap-3">
          <BaseInput v-model="form.first_name" label="First name" autocomplete="given-name" required />
          <BaseInput v-model="form.last_name" label="Last name" autocomplete="family-name" required />
        </div>

        <BaseInput v-model="form.username" label="Username" autocomplete="username" required />
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <BaseInput v-model="form.phone_number" label="M-Pesa phone number" type="tel" autocomplete="tel" placeholder="07XXXXXXXX" required />
          <BaseInput v-model="form.email" label="Email address" type="email" autocomplete="email" placeholder="business@example.com" required />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <BaseInput v-model="form.password" label="Password" type="password" autocomplete="new-password" required />
          <BaseInput v-model="confirm" label="Confirm password" type="password" autocomplete="new-password" required />
        </div>
      </fieldset>

      <!-- Section: Business Details -->
      <fieldset class="border-t border-line pt-4 space-y-4">
        <legend class="text-xs font-semibold uppercase tracking-wider text-muted px-2">Business Profile</legend>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <BaseInput v-model="form.businessName" label="Business name" placeholder="e.g. Clean & Shine Co." required />
          <BaseInput v-model="form.location" label="Location of operation" placeholder="e.g. Kilimani, Nairobi" required />
        </div>

        <BaseTextarea v-model="form.description" label="Describe your services" placeholder="Describe the cleaning, AirBnB management, or post-construction cleaning services you offer..." required rows="3" />
      </fieldset>

      <p v-if="localError" class="text-sm text-danger mt-1">{{ localError }}</p>

      <BaseButton type="submit" block :loading="auth.loading || providerStore.saving" class="mt-4">
        Register as Provider
      </BaseButton>
    </form>

    <div class="mt-6 space-y-2 text-center text-sm text-muted border-t border-line pt-4">
      <p>
        Already have an account?
        <RouterLink :to="{ name: 'login' }" class="font-semibold text-brand">Log in</RouterLink>
      </p>
      <p>
        Are you a customer?
        <RouterLink :to="{ name: 'register' }" class="font-semibold text-brand">Register as a customer</RouterLink>
      </p>
    </div>
  </div>
</template>
