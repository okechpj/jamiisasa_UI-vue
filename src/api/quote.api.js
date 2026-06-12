import client from './client'

/*
 * quote.api.js — quote negotiation. Supabase is the source of truth for all
 * pricing/business state; these endpoints drive it. Accept/reject also update
 * the booking and post a chat message (handled server-side).
 */

// POST /api/v1/quotes  { booking_id, amount, notes }  (provider)
export async function createQuote(payload) {
  const { data } = await client.post('/api/v1/quotes', payload)
  return data
}

// GET /api/v1/quotes/:id -> { ...quote, services: [...] }
export async function getQuote(id) {
  const { data } = await client.get(`/api/v1/quotes/${id}`)
  return data
}

// POST /api/v1/quotes/:id/accept  (customer)
export async function acceptQuote(id) {
  const { data } = await client.post(`/api/v1/quotes/${id}/accept`)
  return data
}

// POST /api/v1/quotes/:id/reject  (customer)
export async function rejectQuote(id) {
  const { data } = await client.post(`/api/v1/quotes/${id}/reject`)
  return data
}
