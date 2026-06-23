import axios from 'axios'

import { getToken } from '@/lib/token'

/*
 * client.js — the single configured Axios instance. Every api/*.api.js module
 * builds on it; components never import axios directly.
 *
 * The Go backend enables CORS, so we talk to it directly at VITE_API_BASE_URL
 * (no dev proxy). The bearer token is injected per-request and a 401 tears down
 * the session and bounces to login.
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

import { firebaseAuth } from '@/firestore'

// --- Request: attach the bearer token automatically -----------------------
client.interceptors.request.use(async (config) => {
  await firebaseAuth.authStateReady()
  const user = firebaseAuth.currentUser
  if (user) {
    try {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    } catch (e) {
      console.error('Failed to get Firebase token', e)
    }
  }
  return config
})

// --- Response: on 401, clear the session and bounce to login ---------------
// The store and router are imported dynamically to avoid an import cycle
// (client -> store -> api -> client) at module-eval time.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      import('@/stores/auth.store')
        .then(({ useAuthStore }) => useAuthStore().clearSession())
        .catch(() => {})

      import('@/router').then(({ default: router }) => {
        if (router.currentRoute.value.name !== 'login') {
          router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
        }
      })
    }
    return Promise.reject(error)
  },
)

export default client
