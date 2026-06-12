// Shared marketplace helpers.

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function dayName(n) {
  return DAYS[n] ?? ''
}

// Format a price range as KES, collapsing equal/blank bounds sensibly.
export function formatPriceRange(min, max) {
  const lo = Number(min) || 0
  const hi = Number(max) || 0
  const fmt = (n) => `KES ${n.toLocaleString()}`
  if (!lo && !hi) return 'Price on request'
  if (lo && hi && lo !== hi) return `${fmt(lo)} - ${fmt(hi)}`
  return fmt(lo || hi)
}

// Group availability slots by concrete date (ascending), each with its slots
// sorted by start time. Slots are the UI shape ({ slotDate: 'YYYY-MM-DD', ... }).
export function groupByDate(slots) {
  const byDate = new Map()
  for (const slot of slots) {
    if (!slot.slotDate) continue
    if (!byDate.has(slot.slotDate)) byDate.set(slot.slotDate, [])
    byDate.get(slot.slotDate).push(slot)
  }
  return [...byDate.keys()]
    .sort()
    .map((date) => ({
      date,
      dateLabel: formatDate(date),
      slots: byDate.get(date).slice().sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
}

// Today as 'YYYY-MM-DD' (local), for date inputs / filtering past slots.
export function todayYMD() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Booking status → display label + badge variant.
export const BOOKING_STATUS = {
  pending: { label: 'Pending', variant: 'warning' },
  pending_quote: { label: 'Awaiting quote', variant: 'warning' },
  quoted: { label: 'Quote sent', variant: 'brand' },
  accepted: { label: 'Accepted', variant: 'brand' },
  paid: { label: 'Paid', variant: 'success' },
  completed_unpaid: { label: 'Completed · Unpaid', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  declined: { label: 'Declined', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
}

export function bookingStatus(status) {
  return BOOKING_STATUS[status] || { label: status || 'Unknown', variant: 'neutral' }
}

// --- Bookings split + order progress -------------------------------------

// Finished states (shown under "History"). Everything else is "Current".
const TERMINAL_STATUSES = new Set(['paid', 'completed', 'completed_unpaid', 'declined', 'cancelled'])
export function isTerminalBooking(status) {
  return TERMINAL_STATUSES.has(status)
}

export function isCancelledBooking(status) {
  return status === 'declined' || status === 'cancelled'
}

// Happy-path order progress (declined/cancelled handled separately in the UI).
export const ORDER_STEPS = [
  { key: 'placed', label: 'Booked' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'done', label: 'Service done' },
  { key: 'paid', label: 'Paid' },
]

const STATUS_STEP = {
  pending_quote: 0,
  pending: 0,
  quoted: 1,
  accepted: 2,
  completed_unpaid: 3,
  completed: 3,
  paid: 4,
}

export function orderStepIndex(status) {
  return STATUS_STEP[status] ?? 0
}

export function formatKES(amount) {
  const n = Number(amount) || 0
  return `KSh ${n.toLocaleString()}`
}

// Combine a 'YYYY-MM-DD' date + 'HH:MM' time into a local Date, with fallbacks.
export function slotDateTime(slotDate, slotStart, fallbackIso) {
  const tryDate = (s) => {
    if (!s) return null
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (slotDate && slotStart) {
    const d = tryDate(`${slotDate}T${slotStart}`)
    if (d) return d
  }
  return tryDate(slotDate ? `${slotDate}T00:00:00` : '') || tryDate(fallbackIso)
}

// Format an RFC3339/ISO timestamp as a plain date (bookings carry a date).
export function formatDate(iso) {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  return new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// Minutes-since-midnight for an "HH:MM" string (for validation/sorting).
export function toMinutes(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map((x) => parseInt(x, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}
