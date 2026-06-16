import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import * as bookingApi from '@/api/booking.api'
import * as serviceApi from '@/api/service.api'
import * as providerApi from '@/api/provider.api'
import * as availabilityApi from '@/api/availability.api'
import * as authApi from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { extractError } from '@/lib/errors'
import { formatDate } from '@/lib/marketplace'
import { resolveMediaUrl } from '@/lib/storage'

const toText = (v) => (typeof v === 'string' ? v : '')

function mapBooking(raw) {
  return {
    id: toText(raw.id),
    customerId: toText(raw.customer_id),
    providerId: toText(raw.provider_id),
    serviceId: toText(raw.service_id),
    availabilityId: toText(raw.availability_id),
    bookingDate: toText(raw.booking_date),
    status: toText(raw.status),
    // Confirmation code — empty until the provider accepts, then shared by both parties.
    code: toText(raw.code),
    // Total due — set from the accepted quote; null until then.
    amount: raw.final_amount != null ? Number(raw.final_amount) : null,
    acceptedQuoteId: toText(raw.accepted_quote_id),
    notes: toText(raw.notes),
    createdAt: toText(raw.created_at),
    customerLatitude: raw.customer_latitude != null ? Number(raw.customer_latitude) : null,
    customerLongitude: raw.customer_longitude != null ? Number(raw.customer_longitude) : null,
    locationAddress: toText(raw.location_address),
    googleMapsUrl: toText(raw.google_maps_url),
  }
}

function slotLabel(slot) {
  if (!slot) return ''
  return `${formatDate(slot.slot_date)} · ${toText(slot.start_time)}–${toText(slot.end_time)}`
}

/*
 * booking.store — booking lifecycle for customers and providers.
 * Holds the transient booking selection (service + slot + date) plus the
 * customer and provider booking lists (rehydrated from the API).
 */
export const useBookingStore = defineStore('booking', () => {
  const auth = useAuthStore()
  // --- Selection (set from the marketplace flow) --------------------------
  const selectedService = ref(null)
  const selectedProviderId = ref('')
  const selectedSlot = ref(null)
  const bookingDate = ref('')

  // --- Lists ---------------------------------------------------------------
  const myBookings = ref([])
  const providerBookings = ref([])

  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  function selectService(service, providerId) {
    selectedService.value = service
    selectedProviderId.value = providerId
    selectedSlot.value = null
    bookingDate.value = ''
  }

  // Keep booking counterparty avatars in sync if the current user updates
  // their profile picture (optimistic updates elsewhere in the app).
  watch(
    () => auth.user && auth.user.profile_picture_url,
    (newUrl) => {
      if (!newUrl) return
      const resolved = resolveMediaUrl(newUrl)
      try {
        myBookings.value = myBookings.value.map((b) => {
          if (b.providerId === auth.userId || b.customerId === auth.userId) {
            return { ...b, counterpartyAvatar: resolved }
          }
          return b
        })
        providerBookings.value = providerBookings.value.map((b) => {
          if (b.providerId === auth.userId || b.customerId === auth.userId) {
            return { ...b, counterpartyAvatar: resolved }
          }
          return b
        })
      } catch (e) {
        /* ignore */
      }
    },
  )

  // Resolve ids on each booking to human labels (service/provider/customer
  // names and the slot time) via the real APIs — no mock data.
  async function enrich(list, counterparty) {
    const serviceIds = [...new Set(list.map((b) => b.serviceId).filter(Boolean))]
    const providerIds = [...new Set(list.map((b) => b.providerId).filter(Boolean))]
    const customerIds = [...new Set(list.map((b) => b.customerId).filter(Boolean))]

    const serviceMap = {}
    const slotMap = {}
    const nameMap = {}
    const avatarMap = {}

    await Promise.all([
      ...serviceIds.map(async (id) => {
        try {
          serviceMap[id] = await serviceApi.getService(id)
        } catch {
          /* ignore */
        }
      }),
      ...providerIds.map(async (pid) => {
        try {
          const slots = await availabilityApi.getProviderAvailability(pid)
          slots.forEach((s) => {
            slotMap[s.id] = s
          })
        } catch {
          /* ignore */
        }
      }),
      ...(counterparty === 'provider'
        ? providerIds.map(async (id) => {
            try {
              const p = await providerApi.getProvider(id)
              nameMap[id] = toText(p.business_name) || 'Provider'
              avatarMap[id] = resolveMediaUrl(p.profile_picture_url || p.avatar_url || p.profile_picture)
            } catch {
              /* ignore */
            }
          })
        : customerIds.map(async (id) => {
            try {
              const u = await authApi.getUser(id)
              nameMap[id] = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || toText(u.username) || 'Customer'
              avatarMap[id] = resolveMediaUrl(u.profile_picture_url || u.avatar_url || u.profile_picture)
            } catch {
              /* ignore */
            }
          })),
    ])

    return list.map((b) => {
      const slot = slotMap[b.availabilityId]
      return {
        ...b,
        serviceName: serviceMap[b.serviceId] ? toText(serviceMap[b.serviceId].service_name) : 'Service',
        counterpartyName:
          counterparty === 'provider' ? nameMap[b.providerId] || 'Provider' : nameMap[b.customerId] || 'Customer',
        slotLabel: slotLabel(slot),
        slotDate: slot ? toText(slot.slot_date) : '',
        slotStart: slot ? toText(slot.start_time) : '',
        slotEnd: slot ? toText(slot.end_time) : '',
        counterpartyAvatar:
          counterparty === 'provider' ? avatarMap[b.providerId] || '' : avatarMap[b.customerId] || '',
      }
    })
  }

  async function createBooking({ serviceId, providerId, availabilityId, date, notes, latitude, longitude, locationAddress }) {
    error.value = ''
    saving.value = true
    try {
      // booking_date must be RFC3339 for the Go time.Time field; send midnight UTC.
      const payload = {
        service_id: serviceId,
        provider_id: providerId,
        availability_id: availabilityId,
        booking_date: `${date}T00:00:00Z`,
        notes: toText(notes),
      }
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        payload.latitude = latitude
        payload.longitude = longitude
      }
      if (locationAddress && typeof locationAddress === 'string') {
        payload.location_address = toText(locationAddress)
      }
      const created = await bookingApi.createBooking(payload)
      return mapBooking(created)
    } catch (e) {
      error.value = extractError(e, 'Could not create the booking.')
      return null
    } finally {
      saving.value = false
    }
  }

  async function fetchMyBookings() {
    error.value = ''
    loading.value = true
    try {
      myBookings.value = await enrich((await bookingApi.getMyBookings()).map(mapBooking), 'provider')
    } catch (e) {
      myBookings.value = []
      error.value = extractError(e, 'Could not load your bookings.')
    } finally {
      loading.value = false
    }
  }

  async function fetchProviderBookings() {
    error.value = ''
    loading.value = true
    try {
      providerBookings.value = await enrich((await bookingApi.getProviderBookings()).map(mapBooking), 'customer')
    } catch (e) {
      providerBookings.value = []
      error.value = extractError(e, 'Could not load incoming bookings.')
    } finally {
      loading.value = false
    }
  }

  async function accept(id) {
    try {
      await bookingApi.acceptBooking(id)
      // Refresh both provider and customer booking lists so the
      // generated confirmation code is visible to both parties.
      await fetchProviderBookings()
      await fetchMyBookings()
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not accept the booking.')
      return false
    }
  }

  async function decline(id) {
    try {
      await bookingApi.declineBooking(id)
      await fetchProviderBookings()
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not decline the booking.')
      return false
    }
  }

  async function cancel(id) {
    try {
      await bookingApi.cancelBooking(id)
      await fetchMyBookings()
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not cancel the booking.')
      return false
    }
  }

  async function complete(id) {
    try {
      await bookingApi.completeBooking(id)
      await fetchProviderBookings()
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not complete the booking.')
      return false
    }
  }

  return {
    selectedService,
    selectedProviderId,
    selectedSlot,
    bookingDate,
    myBookings,
    providerBookings,
    loading,
    saving,
    error,
    selectService,
    createBooking,
    fetchMyBookings,
    fetchProviderBookings,
    accept,
    decline,
    cancel,
    complete,
  }
})
