<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ArrowLeft, CalendarClock, AlertTriangle, MapPin } from 'lucide-vue-next'

import { useProviderStore } from '@/stores/provider.store'
import { useServiceStore } from '@/stores/service.store'
import { useAvailabilityStore } from '@/stores/availability.store'
import { useBookingStore } from '@/stores/booking.store'
import { useToast } from '@/composables/useToast'
import { useLocation } from '@/composables/useLocation'
import { formatPriceRange, formatDate, todayYMD } from '@/lib/marketplace'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const props = defineProps({
  providerId: { type: String, required: true },
  serviceId: { type: String, required: true },
})

const providerStore = useProviderStore()
const serviceStore = useServiceStore()
const availabilityStore = useAvailabilityStore()
const booking = useBookingStore()
const toast = useToast()
const router = useRouter()

const { currentProvider } = storeToRefs(providerStore)
const { providerAvailability } = storeToRefs(availabilityStore)
const { saving } = storeToRefs(booking)

const loading = ref(false)
const locLoading = ref(false)
const locError = ref('')
const service = ref(null)
const loc = useLocation()

// Compute scrollable list of dates (next 14 days or extended if provider has slots further out)
const datesList = computed(() => {
  const list = []
  const today = new Date()
  const todayStr = todayYMD()
  
  // Filter active slots for this service
  const slots = providerAvailability.value.filter(
    (s) => s.serviceId === props.serviceId && s.isActive !== false && s.slotDate >= todayStr
  )
  
  let maxDays = 14
  for (const s of slots) {
    const diff = Math.ceil((new Date(s.slotDate) - today) / (1000 * 60 * 60 * 24))
    if (diff > maxDays && diff < 90) {
      maxDays = diff + 1
    }
  }

  for (let i = 0; i < maxDays; i++) {
    const d = new Date()
    d.setDate(today.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const ymd = `${yyyy}-${mm}-${dd}`

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }) // e.g. "Mon"
    const dayNum = d.getDate() // e.g. 12
    
    const dateSlots = slots.filter(s => s.slotDate === ymd)
    const isToday = i === 0
    const isTomorrow = i === 1
    let label = ''
    if (isToday) label = 'Today'
    else if (isTomorrow) label = 'Tomorrow'

    list.push({
      ymd,
      dayName,
      dayNum,
      label,
      hasSlots: dateSlots.length > 0,
      slots: dateSlots,
    })
  }
  return list
})

const hasSlots = computed(() => datesList.value.some(d => d.hasSlots))

const selectedDateYMD = ref('')

// Auto-select the first date with slots
watch(datesList, (newVal) => {
  if (newVal.length && !selectedDateYMD.value) {
    const firstAvailable = newVal.find(d => d.hasSlots)
    if (firstAvailable) {
      selectedDateYMD.value = firstAvailable.ymd
    } else {
      selectedDateYMD.value = newVal[0].ymd
    }
  }
}, { immediate: true })

const slotsForSelectedDate = computed(() => {
  const d = datesList.value.find(x => x.ymd === selectedDateYMD.value)
  return d ? d.slots.slice().sort((a, b) => a.startTime.localeCompare(b.startTime)) : []
})

const selectedSlot = ref(null)

// If selected date changes, reset the selected slot (unless it's on the same date)
watch(selectedDateYMD, (newVal) => {
  if (selectedSlot.value && selectedSlot.value.slotDate !== newVal) {
    selectedSlot.value = null
  }
})

const notes = ref('')
const selectedAddress = ref('')
const chosenLat = ref(null)
const chosenLon = ref(null)
const showRetry = ref(false)
const canConfirm = computed(() => selectedSlot.value && !saving.value)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      providerStore.fetchProvider(props.providerId),
      availabilityStore.fetchProviderAvailability(props.providerId),
      serviceStore.fetchProviderServices(props.providerId),
    ])
    service.value =
      booking.selectedService && booking.selectedService.id === props.serviceId
        ? booking.selectedService
        : serviceStore.providerServices.find((s) => s.id === props.serviceId) || null
    // Load saved user location (if any) and show it in the UI.
    try {
      const saved = await loc.fetchSavedLocation()
      if (saved) {
        if (saved.address) selectedAddress.value = saved.address
        if (saved.latitude != null) chosenLat.value = saved.latitude
        if (saved.longitude != null) chosenLon.value = saved.longitude
      }
    } catch (e) {
      // ignore
    }
  } finally {
    loading.value = false
  }
})

async function confirm() {
  if (!canConfirm.value) return

  locError.value = ''
  locLoading.value = true

  try {
    // Ensure we have a picked location; if not, try to pick now (triggers browser prompt)
    if (!selectedAddress.value || chosenLat.value == null || chosenLon.value == null) {
      const ok = await pickLocation()
      if (!ok) throw new Error('Location not available')
    }
    const created = await booking.createBooking({
      serviceId: props.serviceId,
      providerId: props.providerId,
      availabilityId: selectedSlot.value.id,
      date: selectedSlot.value.slotDate,
      notes: notes.value,
      latitude: chosenLat.value,
      longitude: chosenLon.value,
      locationAddress: selectedAddress.value,
    })

    if (created) {
      toast.success('Booking requested!')
      router.push({ name: 'my-bookings' })
    } else {
      toast.error(booking.error || 'Could not create the booking.')
    }
  } catch (e) {
    locError.value = 'Unable to retrieve your location. Tap retry to try again.'
    toast.error(locError.value)
    showRetry.value = true
  } finally {
    locLoading.value = false
  }
}

// Geolocation
async function pickLocation() {
  locError.value = ''
  locLoading.value = true
  showRetry.value = false
  try {
    const ok = await loc.refreshLocation()
    if (!ok) {
      throw new Error('location-refresh-failed')
    }
    if (loc.location) {
      if (loc.location.address) selectedAddress.value = loc.location.address
      if (loc.location.latitude != null) chosenLat.value = loc.location.latitude
      if (loc.location.longitude != null) chosenLon.value = loc.location.longitude
    }
    if ((selectedAddress.value === '' || !selectedAddress.value) && chosenLat.value != null && chosenLon.value != null) {
      const ok2 = await fetchReverseGeocode(chosenLat.value, chosenLon.value)
      if (!ok2) {
        selectedAddress.value = `Lat: ${chosenLat.value.toFixed(6)}, Lon: ${chosenLon.value.toFixed(6)}`
      }
    }
    return true
  } catch (err) {
    const denied = err && (err.code === 1 || err.message === 'User denied Geolocation')
    if (denied) {
      console.debug('pickLocation: user denied geolocation')
      toast.info('Location permission denied. Enable location in your browser settings or retry.')
      locError.value = 'Location permission denied.'
    } else {
      console.debug('pickLocation error:', err && (err.message || err))
      locError.value = 'Unable to retrieve your location.'
    }
    showRetry.value = true
    return false
  } finally {
    locLoading.value = false
  }
}

async function fetchReverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'JamiiSasa-Booking/1.0'
      }
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data && data.display_name) {
      selectedAddress.value = data.display_name
      return true
    }
    return false
  } catch (e) {
    return false
  }
}

function clearLocation() {
  selectedAddress.value = ''
  chosenLat.value = null
  chosenLon.value = null
  showRetry.value = true
}
</script>

<template>
  <section class="mx-auto max-w-2xl pb-28">
    <button type="button" class="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink" @click="router.back()">
      <ArrowLeft class="h-4 w-4" />
      Back
    </button>

    <h1 class="mb-5 text-2xl font-bold text-ink">Book a service</h1>

    <div v-if="loading" class="space-y-4">
      <BaseSkeleton class="h-24 w-full rounded-card" />
      <BaseSkeleton class="h-48 w-full rounded-card" />
    </div>

    <template v-else-if="service">
      <!-- Selected service summary -->
      <div class="rounded-card border border-line bg-base p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-extrabold text-ink">{{ service.serviceName }}</h2>
            <p v-if="service.serviceCategory" class="mt-1.5">
              <span class="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                {{ service.serviceCategory }}
              </span>
            </p>
            <p class="mt-3 text-sm text-muted">
              Provider: <span class="font-semibold text-ink">{{ currentProvider?.businessName || 'Provider' }}</span>
            </p>
          </div>
          <div class="sm:text-right">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Price Range</p>
            <p class="mt-1 text-lg font-bold text-brand">{{ formatPriceRange(service.priceMin, service.priceMax) }}</p>
          </div>
        </div>
      </div>

      <!-- Availability: Choose Date & Time -->
      <h3 class="mb-3 mt-6 text-base font-bold text-ink">Choose a date &amp; time</h3>
      
      <EmptyState
        v-if="!hasSlots"
        title="No availability"
        description="This provider has no upcoming slots for this service yet."
      >
        <template #icon><CalendarClock class="h-6 w-6" /></template>
      </EmptyState>

      <div v-else class="space-y-6">
        <!-- Horizontal Scrollable Date Picker -->
        <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            v-for="d in datesList"
            :key="d.ymd"
            :disabled="!d.hasSlots"
            type="button"
            class="flex flex-col items-center justify-center min-w-[76px] py-3 rounded-2xl border transition-all cursor-pointer animate-fade-in"
            :class="[
              selectedDateYMD === d.ymd 
                ? 'border-brand bg-brand/5 text-brand shadow-sm font-bold ring-1 ring-brand' 
                : !d.hasSlots 
                  ? 'opacity-40 bg-surface border-line cursor-not-allowed' 
                  : 'border-line bg-base text-ink hover:bg-surface'
            ]"
            @click="selectedDateYMD = d.ymd"
          >
            <span class="text-[10px] font-bold text-muted uppercase tracking-wider">{{ d.dayName }}</span>
            <span class="text-lg font-black mt-0.5" :class="selectedDateYMD === d.ymd ? 'text-brand' : 'text-ink'">{{ d.dayNum }}</span>
            <span v-if="d.label" class="text-[8px] mt-1 font-bold bg-brand/10 text-brand px-1 py-0.5 rounded uppercase tracking-widest">{{ d.label }}</span>
          </button>
        </div>

        <!-- Selected Date Header -->
        <p class="text-sm font-bold text-ink mb-2">
          Available times for {{ formatDate(selectedDateYMD) }}:
        </p>

        <!-- Time Selection Slots -->
        <div v-if="slotsForSelectedDate.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="slot in slotsForSelectedDate"
            :key="slot.id"
            class="flex items-center gap-3.5 w-full rounded-2xl border p-4 bg-base cursor-pointer transition-all border-line hover:border-brand/40 shadow-sm"
            :class="selectedSlot?.id === slot.id ? 'border-brand bg-brand/5 ring-1 ring-brand' : ''"
            @click="selectedSlot = slot"
          >
            <!-- Custom Radio dot icon on the left -->
            <div 
              class="h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0" 
              :class="selectedSlot?.id === slot.id ? 'border-brand' : 'border-line bg-surface'"
            >
              <div v-if="selectedSlot?.id === slot.id" class="h-2.5 w-2.5 rounded-full bg-brand"></div>
            </div>
            <!-- Labels -->
            <div class="text-left min-w-0">
              <span class="block text-sm font-black text-ink leading-tight">{{ slot.startTime }}</span>
              <span class="block text-xs text-muted mt-0.5">{{ slot.startTime }} – {{ slot.endTime }}</span>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-muted italic">No times available for this date.</p>
      </div>

      <!-- Notes -->
      <h3 class="mb-2 mt-6 text-sm font-bold text-ink">Notes (optional)</h3>
      <BaseTextarea v-model="notes" placeholder="Anything the provider should know…" :rows="3" />
      <div class="mt-4">
        <!-- Show resolved/selected address in place of input -->
        <div v-if="selectedAddress" class="mt-2 flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-ink">Pickup address</p>
            <p class="mt-1 text-sm text-muted leading-relaxed">{{ selectedAddress }}</p>
          </div>
          <div>
            <button type="button" class="text-sm text-brand font-bold underline" @click="clearLocation">Change</button>
          </div>
        </div>

        <div v-else class="space-y-2">
          <button
            type="button"
            class="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
            @click="pickLocation"
            :disabled="locLoading"
          >
            <span v-if="!locLoading">Use my current location</span>
            <span v-else>Locating…</span>
          </button>

          <div v-if="showRetry" class="mt-2 flex items-center justify-between">
            <p class="text-sm text-muted">Location not available. Tap retry to try again.</p>
            <button type="button" class="text-sm text-brand font-semibold underline cursor-pointer" @click="pickLocation">Retry</button>
          </div>

          <div v-else class="mt-2 text-xs text-muted">The app will request your browser location to autofill pickup address.</div>
        </div>
      </div>
    </template>

    <EmptyState v-else title="Service unavailable" description="We couldn't load this service.">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action>
        <BaseButton variant="secondary" @click="router.push({ name: 'marketplace-providers' })">Back to JamiiWera</BaseButton>
      </template>
    </EmptyState>

    <!-- Sticky confirm bar -->
    <div
      v-if="service"
      class="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-base/95 px-4 py-3 backdrop-blur md:static md:mt-8 md:border-0 md:bg-transparent md:p-0"
    >
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <p class="truncate text-sm font-semibold text-muted">
          {{ selectedSlot ? `${formatDate(selectedSlot.slotDate)} · ${selectedSlot.startTime}` : 'Pick a slot' }}
        </p>
        <BaseButton :disabled="!canConfirm" :loading="saving" @click="confirm">Confirm Booking</BaseButton>
      </div>
    </div>
  </section>
</template>
