import { ref } from 'vue'
import { defineStore } from 'pinia'

import * as serviceApi from '@/api/service.api'
import * as providerApi from '@/api/provider.api'
import { extractError } from '@/lib/errors'

const toText = (v) => (typeof v === 'string' ? v : '')
const toNum = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || 0)

function mapListing(raw) {
  return {
    id: toText(raw.id),
    providerId: toText(raw.provider_id),
    serviceName: toText(raw.service_name),
    serviceCategory: toText(raw.service_category),
    description: toText(raw.description),
    priceMin: toNum(raw.price_min),
    priceMax: toNum(raw.price_max),
  }
}

function toPayload(form) {
  return {
    service_name: toText(form.serviceName),
    service_category: toText(form.serviceCategory),
    description: toText(form.description),
    price_min: toNum(form.priceMin),
    price_max: toNum(form.priceMax),
  }
}

/*
 * service.store — the current provider's services (CRUD) and a viewed
 * provider's services (read-only).
 */
export const useServiceStore = defineStore('service', () => {
  const myServices = ref([])
  const providerServices = ref([])
  const marketplaceServices = ref([]) // all services across providers (customer browse)

  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  // Aggregate every provider's services into one browseable list. There's no
  // "list all services" endpoint, so we list providers then fetch each one's
  // services in parallel (fine at neighborhood scale).
  async function fetchMarketplaceServices() {
    error.value = ''
    loading.value = true
    try {
      const providers = await providerApi.listProviders()
      const lists = await Promise.all(
        providers.map(async (p) => {
          try {
            const svcs = await serviceApi.getProviderServices(p.user_id)
            return svcs.map((s) => ({
              ...mapListing(s),
              providerUserId: toText(p.user_id),
              providerName: toText(p.business_name) || 'Provider',
              location: toText(p.location),
              isVerified: p.is_verified === true,
            }))
          } catch {
            return []
          }
        }),
      )
      marketplaceServices.value = lists.flat()
    } catch (e) {
      marketplaceServices.value = []
      error.value = extractError(e, 'Could not load the marketplace.')
    } finally {
      loading.value = false
    }
  }

  async function fetchMyServices() {
    error.value = ''
    loading.value = true
    try {
      myServices.value = (await serviceApi.getMyServices()).map(mapListing)
    } catch (e) {
      myServices.value = []
      error.value = extractError(e, 'Could not load your services.')
    } finally {
      loading.value = false
    }
  }

  async function createService(form) {
    error.value = ''
    saving.value = true
    try {
      const created = mapListing(await serviceApi.createService(toPayload(form)))
      myServices.value = [created, ...myServices.value]
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not create the service.')
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateService(id, form) {
    error.value = ''
    saving.value = true
    try {
      const updated = mapListing(await serviceApi.updateService(id, toPayload(form)))
      myServices.value = myServices.value.map((s) => (s.id === id ? updated : s))
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not update the service.')
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteService(id) {
    error.value = ''
    try {
      await serviceApi.deleteService(id)
      myServices.value = myServices.value.filter((s) => s.id !== id)
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not delete the service.')
      return false
    }
  }

  async function fetchProviderServices(providerId) {
    error.value = ''
    loading.value = true
    try {
      providerServices.value = (await serviceApi.getProviderServices(providerId)).map(mapListing)
    } catch (e) {
      providerServices.value = []
      error.value = extractError(e, 'Could not load services.')
    } finally {
      loading.value = false
    }
  }

  return {
    myServices,
    providerServices,
    marketplaceServices,
    loading,
    saving,
    error,
    fetchMarketplaceServices,
    fetchMyServices,
    createService,
    updateService,
    deleteService,
    fetchProviderServices,
  }
})
