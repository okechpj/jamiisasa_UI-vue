import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import * as providerApi from '@/api/provider.api'
import * as serviceApi from '@/api/service.api'
import { extractError } from '@/lib/errors'

const toText = (v) => (typeof v === 'string' ? v : '')
const toBool = (v) => v === true

function mapProfile(raw) {
  if (!raw) return null
  return {
    id: toText(raw.id),
    userId: toText(raw.user_id),
    isVerified: toBool(raw.is_verified),
    businessName: toText(raw.business_name),
    description: toText(raw.description),
    location: toText(raw.location),
    createdAt: toText(raw.created_at),
  }
}

/*
 * provider.store — current provider profile, the provider directory, and a
 * single provider's details (for customer viewing).
 */
export const useProviderStore = defineStore('provider', () => {
  const myProfile = ref(null)
  const providers = ref([])
  const currentProvider = ref(null)

  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  const hasProfile = computed(() => Boolean(myProfile.value))

  async function fetchMyProfile() {
    error.value = ''
    loading.value = true
    try {
      myProfile.value = mapProfile(await providerApi.getMyProfile())
    } catch (e) {
      // 404 simply means the provider hasn't created a profile yet.
      myProfile.value = null
      if (!(e && e.response && e.response.status === 404)) {
        error.value = extractError(e, 'Could not load your provider profile.')
      }
    } finally {
      loading.value = false
    }
  }

  async function createProfile(form) {
    error.value = ''
    saving.value = true
    try {
      const created = await providerApi.createProfile({
        business_name: toText(form.businessName),
        description: toText(form.description),
        location: toText(form.location),
      })
      myProfile.value = mapProfile(created)
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not create your profile.')
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateProfile(form) {
    error.value = ''
    saving.value = true
    try {
      const updated = await providerApi.updateProfile({
        business_name: toText(form.businessName),
        description: toText(form.description),
        location: toText(form.location),
      })
      myProfile.value = mapProfile(updated)
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not update your profile.')
      return false
    } finally {
      saving.value = false
    }
  }

  async function fetchProviders() {
    error.value = ''
    loading.value = true
    try {
      const list = (await providerApi.listProviders()).map(mapProfile)
      // The list endpoint returns profiles only; enrich each with its service
      // categories + starting price (parallel) so cards can show them and the
      // category filter works. Fine at neighborhood scale; a backend aggregate
      // would be the move if the directory grows large.
      await Promise.all(
        list.map(async (p) => {
          try {
            const svcs = await serviceApi.getProviderServices(p.userId)
            p.categories = [...new Set(svcs.map((s) => s.service_category).filter(Boolean))]
            const mins = svcs.map((s) => Number(s.price_min) || 0).filter((n) => n > 0)
            p.startingPrice = mins.length ? Math.min(...mins) : null
            p.serviceCount = svcs.length
          } catch {
            p.categories = []
            p.startingPrice = null
            p.serviceCount = 0
          }
        }),
      )
      providers.value = list
    } catch (e) {
      providers.value = []
      error.value = extractError(e, 'Could not load providers.')
    } finally {
      loading.value = false
    }
  }

  async function fetchProvider(id) {
    error.value = ''
    loading.value = true
    currentProvider.value = null
    try {
      currentProvider.value = mapProfile(await providerApi.getProvider(id))
    } catch (e) {
      error.value = extractError(e, 'Could not load this provider.')
    } finally {
      loading.value = false
    }
  }

  return {
    myProfile,
    providers,
    currentProvider,
    loading,
    saving,
    error,
    hasProfile,
    fetchMyProfile,
    createProfile,
    updateProfile,
    fetchProviders,
    fetchProvider,
  }
})
