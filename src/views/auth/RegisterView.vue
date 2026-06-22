<script setup>
import { reactive, ref, watch } from 'vue'
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

// Automatically redirect if user becomes authenticated (e.g. from state listener/reload)
watch(
  () => auth.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      router.push({ name: 'feed' })
    }
  },
  { immediate: true }
)

async function onSubmit() {
  localError.value = ''

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
  if (!passwordRegex.test(form.password)) {
    localError.value = 'Weak password, use a stronger password'
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
    router.push({ name: 'onboarding' })
  } else {
    // If backend returns error, capture it or display it
    localError.value = auth.error || 'Could not create your account.'
    toast.error(auth.error || 'Could not create your account.')
  }
}

async function onGoogleLogin() {
  const ok = await auth.loginWithGoogle()
  if (ok) {
    toast.success('Welcome to Jamii Sasa!')
    router.push({ name: 'feed' })
  } else {
    toast.error(auth.error || 'Google registration failed.')
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
        hint="At least 8 characters with a letter and a digit."
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

    <!-- Divider -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center" aria-hidden="true">
        <div class="w-full border-t border-line"></div>
      </div>
      <div class="relative flex justify-center text-xs uppercase tracking-wider">
        <span class="bg-surface px-3 text-muted">Or register with</span>
      </div>
    </div>

    <!-- Google Sign-In Button Container -->
    <div class="w-full flex justify-center">
      <BaseButton 
        type="button" 
        variant="outline" 
        block 
        @click="onGoogleLogin"
        :loading="auth.loading"
        class="flex items-center justify-center gap-2 border-line hover:bg-slate-50 transition-colors py-2.5 rounded-xl text-ink font-semibold"
      >
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5.04c1.7 0 3.2.6 4.4 1.8l3.3-3.3C17.7 1.6 15 1 12 1 7.3 1 3.4 3.7 1.6 7.7l3.8 3c.9-2.7 3.5-4.7 6.6-4.7z"/>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/>
          <path fill="#FBBC05" d="M5.4 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.3C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.7l3.8-3z"/>
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.7-2-6.6-4.7l-3.8 3C3.4 20.3 7.3 23 12 23z"/>
        </svg>
        <span>Continue with Google</span>
      </BaseButton>
    </div>

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
