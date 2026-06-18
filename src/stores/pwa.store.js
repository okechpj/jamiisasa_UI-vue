import { ref } from 'vue'
import { defineStore } from 'pinia'

export const usePwaStore = defineStore('pwa', () => {
  const deferredPrompt = ref(null)
  const isInstallable = ref(false)
  const showModal = ref(false)
  const isDismissed = ref(false)

  function init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later.
      deferredPrompt.value = e
      isInstallable.value = true
    })

    window.addEventListener('appinstalled', () => {
      deferredPrompt.value = null
      isInstallable.value = false
      showModal.value = false
      console.log('PWA was installed')
    })
  }

  async function triggerInstall() {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    deferredPrompt.value = null
    isInstallable.value = false
    showModal.value = false
  }

  return {
    isInstallable,
    showModal,
    isDismissed,
    init,
    triggerInstall,
  }
})
