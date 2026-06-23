import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  confirmPasswordReset, 
  GoogleAuthProvider, 
  signInWithPopup,
  onIdTokenChanged
} from 'firebase/auth'

import { firebaseAuth } from '@/firestore'
import * as authApi from '@/api/auth.api'
import { useLocation } from '@/composables/useLocation'
import { decodeJwt, isExpired } from '@/lib/jwt'
import { getToken, setToken, clearToken } from '@/lib/token'
import { extractError } from '@/lib/errors'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---------------------------------------------------------------
  const token = ref(getToken())
  const user = ref(null) // full profile from /me
  const loading = ref(false)
  const error = ref('')
  const justLoggedIn = ref(false)

  // Listen to Firebase Auth state and token changes
  onIdTokenChanged(firebaseAuth, async (fbUser) => {
    if (fbUser) {
      try {
        const idToken = await fbUser.getIdToken()
        setSession(idToken)
        await fetchMe()
      } catch (e) {
        console.error('Error syncing auth state:', e)
        clearSession()
      }
    } else {
      clearSession()
    }
  })

  // --- Getters -------------------------------------------------------------
  const claims = computed(() => (token.value ? decodeJwt(token.value) : null))
  const userId = computed(() => (user.value && user.value.id) || (claims.value && claims.value.user_id) || '')
  const role = computed(() => (user.value && user.value.role) || (claims.value && claims.value.role) || '')
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
    justLoggedIn.value = false
  }

  // --- Actions -------------------------------------------------------------
  async function login(email, password) {
    error.value = ''
    loading.value = true
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password)
      justLoggedIn.value = true
      // Best-effort: capture browser location for all users (non-blocking).
      try {
        const loc = useLocation()
        loc.refreshLocation().catch(() => {
          /* ignore */
        })
      } catch (e) {
        /* ignore */
      }
      return true
    } catch (e) {
      error.value = extractError(e, 'Invalid email or password.')
      clearSession()
      return false
    } finally {
      loading.value = false
    }
  }

  // Register, then log in immediately
  async function register(payload) {
    error.value = ''
    loading.value = true
    try {
      // 1. Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(firebaseAuth, payload.email, payload.password)
      const idToken = await cred.user.getIdToken()
      setSession(idToken)

      // 2. Fetch profile from Go backend (which triggers backend middleware user sync)
      await fetchMe()

      // 3. Update profile fields (first name, last name, phone number) on backend
      await authApi.updateProfile({
        first_name: payload.first_name,
        last_name: payload.last_name,
        username: payload.username,
        phone_number: payload.phone_number,
      })

      // 4. Refetch final profile
      await fetchMe()
      
      justLoggedIn.value = true
      return true
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

  async function loginWithGoogle() {
    error.value = ''
    loading.value = true
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(firebaseAuth, provider)
      justLoggedIn.value = true
      try {
        const loc = useLocation()
        loc.refreshLocation().catch(() => {
          /* ignore */
        })
      } catch (e) {
        /* ignore */
      }
      return true
    } catch (e) {
      error.value = extractError(e, 'Google login failed.')
      clearSession()
      return false
    } finally {
      loading.value = false
    }
  }

  async function forgotPassword(email) {
    error.value = ''
    loading.value = true
    try {
      await sendPasswordResetEmail(firebaseAuth, email)
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not send reset password email.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(actionCode, newPassword) {
    error.value = ''
    loading.value = true
    try {
      await confirmPasswordReset(firebaseAuth, actionCode, newPassword)
      return true
    } catch (e) {
      error.value = extractError(e, 'Password reset failed.')
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await signOut(firebaseAuth)
    } catch (e) {
      console.error('Firebase logout error:', e)
    }
    clearSession()
  }

  return {
    // state
    token,
    user,
    loading,
    error,
    justLoggedIn,
    // getters
    claims,
    userId,
    role,
    isAuthenticated,
    displayName,
    // actions
    login,
    loginWithGoogle,
    register,
    forgotPassword,
    resetPassword,
    fetchMe,
    updateProfile,
    logout,
    clearSession,
  }
})
