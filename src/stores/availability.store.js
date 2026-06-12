import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import * as availabilityApi from '@/api/availability.api'
import { extractError } from '@/lib/errors'
import { groupByDate } from '@/lib/marketplace'

const toText = (v) => (typeof v === 'string' ? v : '')
const toBool = (v) => v === true

function mapSlot(raw) {
  return {
    id: toText(raw.id),
    providerId: toText(raw.provider_id),
    serviceId: toText(raw.service_id),
    slotDate: toText(raw.slot_date).slice(0, 10), // 'YYYY-MM-DD'
    startTime: toText(raw.start_time),
    endTime: toText(raw.end_time),
    isActive: toBool(raw.is_active),
  }
}

function toPayload(form) {
  return {
    service_id: toText(form.serviceId),
    // slot_date must be RFC3339 for the Go time.Time field; send midnight UTC.
    slot_date: `${toText(form.slotDate)}T00:00:00Z`,
    start_time: toText(form.startTime),
    end_time: toText(form.endTime),
    is_active: form.isActive !== false,
  }
}

/*
 * availability.store — the current provider's slots (CRUD) and a viewed
 * provider's slots (read-only), plus calendar grouping for display.
 */
export const useAvailabilityStore = defineStore('availability', () => {
  const myAvailability = ref([])
  const providerAvailability = ref([])

  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  const myByDate = computed(() => groupByDate(myAvailability.value))
  const providerByDate = computed(() => groupByDate(providerAvailability.value))

  async function fetchMyAvailability() {
    error.value = ''
    loading.value = true
    try {
      myAvailability.value = (await availabilityApi.getMyAvailability()).map(mapSlot)
    } catch (e) {
      myAvailability.value = []
      error.value = extractError(e, 'Could not load your availability.')
    } finally {
      loading.value = false
    }
  }

  async function createAvailability(form) {
    error.value = ''
    saving.value = true
    try {
      const created = mapSlot(await availabilityApi.createAvailability(toPayload(form)))
      myAvailability.value = [...myAvailability.value, created]
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not add the slot.')
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateAvailability(id, form) {
    error.value = ''
    saving.value = true
    try {
      const updated = mapSlot(await availabilityApi.updateAvailability(id, toPayload(form)))
      myAvailability.value = myAvailability.value.map((s) => (s.id === id ? updated : s))
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not update the slot.')
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteAvailability(id) {
    error.value = ''
    try {
      await availabilityApi.deleteAvailability(id)
      myAvailability.value = myAvailability.value.filter((s) => s.id !== id)
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not delete the slot.')
      return false
    }
  }

  async function fetchProviderAvailability(providerId) {
    error.value = ''
    loading.value = true
    try {
      providerAvailability.value = (await availabilityApi.getProviderAvailability(providerId)).map(mapSlot)
    } catch (e) {
      providerAvailability.value = []
      error.value = extractError(e, 'Could not load availability.')
    } finally {
      loading.value = false
    }
  }

  return {
    myAvailability,
    providerAvailability,
    loading,
    saving,
    error,
    myByDate,
    providerByDate,
    fetchMyAvailability,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    fetchProviderAvailability,
  }
})
