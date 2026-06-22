<script setup>
import { ref, watch } from 'vue'
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

// Automatically redirect if user becomes authenticated (e.g. from state listener/reload)
watch(
  () => auth.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
      router.push(redirect || { name: 'feed' })
    }
  },
  { immediate: true }
)

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

async function onGoogleLogin() {
  const ok = await auth.loginWithGoogle()
  if (ok) {
    toast.success('Welcome back!')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    router.push(redirect || { name: 'feed' })
  } else {
    toast.error(auth.error || 'Google login failed.')
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
      <div class="space-y-1">
        <BaseInput
          v-model="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          required
        />
        <div class="flex justify-end">
          <RouterLink :to="{ name: 'forgot-password' }" class="text-xs font-semibold text-brand hover:underline">
            Forgot password?
          </RouterLink>
        </div>
      </div>

      <BaseButton type="submit" block :loading="auth.loading">Log in</BaseButton>
    </form>

    <!-- Divider -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center" aria-hidden="true">
        <div class="w-full border-t border-line"></div>
      </div>
      <div class="relative flex justify-center text-xs uppercase tracking-wider">
        <span class="bg-surface px-3 text-muted">Or continue with</span>
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

    <p class="mt-6 text-center text-sm text-muted border-t border-line pt-4">
      New to Jamii Sasa?
      <RouterLink :to="{ name: 'register' }" class="font-semibold text-brand">Create an account</RouterLink>
    </p>
  </div>
</template>
