import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import * as authApi from '@/api/auth.api'
import { decodeJwt, isExpired } from '@/lib/jwt'
import { getToken, setToken, clearToken } from '@/lib/token'
import { extractError } from '@/lib/errors'

/*
 * auth.store — JWT session + the current user's profile.
 *
 * The token carries only user_id + role, so the full profile (name, email,
 * username) is fetched from GET /api/v1/me and cached here. Auth is persistent:
 * the token is read from localStorage on init and survives reloads.
 */
export const useAuthStore = defineStore('auth', () => {
  // --- State ---------------------------------------------------------------
  const token = ref(getToken())
  const user = ref(null) // full profile from /me
  const loading = ref(false)
  const error = ref('')

  // Drop a stale token on init so guards see the real auth state immediately.
  if (token.value && isExpired(token.value)) {
    clearToken()
    token.value = ''
  }

  // --- Getters -------------------------------------------------------------
  const claims = computed(() => (token.value ? decodeJwt(token.value) : null))
  const userId = computed(() => (claims.value && claims.value.user_id) || '')
  const role = computed(() => (claims.value && claims.value.role) || '')
  const isAuthenticated = computed(() => Boolean(token.value) && !isExpired(token.value))

  const displayName = computed(() => {
    const u = user.value
    if (!u) return 'You'
    const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
    return full || u.username || u.email || 'You'
  })

  // --- Internal session helpers -------------------------------------------
  function setSession(newToken) {
    token.value = newToken
    setToken(newToken)
  }

  function clearSession() {
    token.value = ''
    user.value = null
    clearToken()
  }

  // --- Actions -------------------------------------------------------------
  async function login(email, password) {
    error.value = ''
    loading.value = true
    try {
      const { token: jwt } = await authApi.login({ email, password })
      if (!jwt) throw new Error('no token')
      setSession(jwt)
      await fetchMe()
      return true
    } catch (e) {
      error.value = extractError(e, 'Invalid email or password.')
      clearSession()
      return false
    } finally {
      loading.value = false
    }
  }

  // Register, then log in immediately (the backend issues no token on register).
  async function register(payload) {
    error.value = ''
    loading.value = true
    try {
      await authApi.register(payload)
      return await login(payload.email, payload.password)
    } catch (e) {
      error.value = extractError(e, 'Could not create your account.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return null
    try {
      user.value = await authApi.me()
    } catch {
      user.value = null
    }
    return user.value
  }

  async function updateProfile(payload) {
    error.value = ''
    loading.value = true
    try {
      user.value = await authApi.updateProfile(payload)
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not update your profile.')
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearSession()
  }

  return {
    // state
    token,
    user,
    loading,
    error,
    // getters
    claims,
    userId,
    role,
    isAuthenticated,
    displayName,
    // actions
    login,
    register,
    fetchMe,
    updateProfile,
    logout,
    clearSession,
  }
})
