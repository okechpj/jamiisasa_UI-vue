import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useToast } from '@/composables/useToast'
import './assets/main.css'

const app = createApp(App)

// Global fallback so an uncaught render/async error surfaces to the user
// instead of failing silently.
app.config.errorHandler = (err, instance, info) => {
  console.error('[app error]', info, err)
  useToast().error('Something went wrong. Please try again.')
}

app.use(createPinia())
app.use(router)

app.mount('#app')

// Service worker and PWA caching can cause users to see stale builds after
// deployments. By default we *unregister* any existing service worker and
// clear stale caches unless the environment explicitly enables the SW via
// `VITE_ENABLE_SW=true`.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const enabled = import.meta.env.VITE_ENABLE_SW === 'true'
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (enabled) {
        if (!reg) {
          await navigator.serviceWorker.register('/sw.js')
          console.log('Service Worker registered (enabled by env)')
        } else {
          console.log('Service Worker already registered')
        }
      } else {
        // Unregister any existing service worker and clear caches to avoid
        // serving stale assets after a deployment.
        if (reg) {
          try {
            await reg.unregister()
            console.log('Service Worker unregistered to prevent stale caching')
          } catch (e) {
            console.warn('Failed to unregister service worker', e)
          }
        }
        if ('caches' in window) {
          try {
            const keys = await caches.keys()
            await Promise.all(keys.map((k) => caches.delete(k)))
            console.log('Cleared service worker caches')
          } catch (e) {
            console.warn('Failed to clear caches', e)
          }
        }
      }
    } catch (err) {
      console.error('Service Worker handling failed:', err)
    }
  })
}
