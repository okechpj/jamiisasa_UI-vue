import client from './client'

/*
 * booking.api.js — the booking engine.
 * Customer: create + view own bookings, cancel.
 * Provider: view incoming bookings, accept/decline.
 */

// POST /api/v1/bookings
// body: { service_id, provider_id, availability_id, booking_date (RFC3339), notes }
export async function createBooking(payload) {
  const { data } = await client.post('/api/v1/bookings', payload)
  return data
}

// GET /api/v1/bookings/me -> Booking[] (current customer)
export async function getMyBookings() {
  const { data } = await client.get('/api/v1/bookings/me')
  return Array.isArray(data) ? data : []
}

// GET /api/v1/provider/bookings -> Booking[] (current provider)
export async function getProviderBookings() {
  const { data } = await client.get('/api/v1/provider/bookings')
  return Array.isArray(data) ? data : []
}

// POST /api/v1/provider/bookings/:id/accept
export async function acceptBooking(id) {
  const { data } = await client.post(`/api/v1/provider/bookings/${id}/accept`)
  return data
}

// POST /api/v1/provider/bookings/:id/decline
export async function declineBooking(id) {
  const { data } = await client.post(`/api/v1/provider/bookings/${id}/decline`)
  return data
}

// POST /api/v1/provider/bookings/:id/cancel
export async function cancelBooking(id) {
  const { data } = await client.post(`/api/v1/provider/bookings/${id}/cancel`)
  return data
}

// POST /api/v1/provider/bookings/:id/complete
export async function completeBooking(id) {
  const { data } = await client.post(`/api/v1/provider/bookings/${id}/complete`)
  return data
}
