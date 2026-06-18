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

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registered successfully:', reg.scope)
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err)
      })
  })
}
