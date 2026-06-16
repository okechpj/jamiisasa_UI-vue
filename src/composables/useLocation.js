import { ref } from 'vue'
import * as authApi from '@/api/auth.api'

// Lightweight location composable — centralizes browser geolocation and
// backend updates. All pages/components should use this instead of
// duplicating geolocation logic.
export function useLocation() {
  const location = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const permissionDenied = ref(false)

  async function getBrowserLocation(opts = { timeout: 10000 }) {
    return new Promise((resolve, reject) => {
      if (!navigator || !navigator.geolocation) {
        return reject(new Error('geolocation-unavailable'))
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(err),
        opts,
      )
    })
  }

  async function updateBackendLocation({ latitude, longitude, location_address = null }) {
    try {
      await authApi.updateLocation({ latitude, longitude, location_address })
      return true
    } catch (e) {
      return false
    }
  }

  // Try to fetch saved location (via /api/v1/me). Non-fatal if unavailable.
  async function fetchSavedLocation() {
    try {
      const me = await authApi.me()
      if (me) {
        location.value = {
          latitude: me.last_known_latitude || null,
          longitude: me.last_known_longitude || null,
          address: me.last_known_location_address || null,
        }
      }
      return location.value
    } catch (e) {
      return null
    }
  }

  // Try to capture browser location and POST to backend. Returns true on
  // success, false otherwise. Does not throw.
  async function refreshLocation() {
    loading.value = true
    error.value = null
    permissionDenied.value = false
    try {
      const pos = await getBrowserLocation()
      const ok = await updateBackendLocation({ latitude: pos.latitude, longitude: pos.longitude })
      if (ok) {
        location.value = { latitude: pos.latitude, longitude: pos.longitude }
      }
      return ok
    } catch (e) {
      if (e && e.code === 1) {
        // PERMISSION_DENIED
        permissionDenied.value = true
      }
      error.value = e
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    location,
    loading,
    error,
    permissionDenied,
    getBrowserLocation,
    updateBackendLocation,
    fetchSavedLocation,
    refreshLocation,
  }
}
