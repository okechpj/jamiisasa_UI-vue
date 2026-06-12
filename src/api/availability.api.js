import client from './client'

/* availability.api.js — provider weekly availability slots. */

// POST /api/v1/provider/availability
export async function createAvailability(payload) {
  const { data } = await client.post('/api/v1/provider/availability', payload)
  return data
}

// PUT /api/v1/provider/availability/:id
export async function updateAvailability(id, payload) {
  const { data } = await client.put(`/api/v1/provider/availability/${id}`, payload)
  return data
}

// DELETE /api/v1/provider/availability/:id
export async function deleteAvailability(id) {
  const { data } = await client.delete(`/api/v1/provider/availability/${id}`)
  return data
}

// GET /api/v1/provider/availability -> Availability[] (current provider)
export async function getMyAvailability() {
  const { data } = await client.get('/api/v1/provider/availability')
  return Array.isArray(data) ? data : []
}

// GET /api/v1/providers/:id/availability -> Availability[]
export async function getProviderAvailability(providerId) {
  const { data } = await client.get(`/api/v1/providers/${providerId}/availability`)
  return Array.isArray(data) ? data : []
}
