import client from './client'

/* service.api.js — provider service listings. */

// POST /api/v1/provider/services
export async function createService(payload) {
  const { data } = await client.post('/api/v1/provider/services', payload)
  return data
}

// PUT /api/v1/provider/services/:id
export async function updateService(id, payload) {
  const { data } = await client.put(`/api/v1/provider/services/${id}`, payload)
  return data
}

// DELETE /api/v1/provider/services/:id
export async function deleteService(id) {
  const { data } = await client.delete(`/api/v1/provider/services/${id}`)
  return data
}

// GET /api/v1/services/:id -> Listing
export async function getService(id) {
  const { data } = await client.get(`/api/v1/services/${id}`)
  return data
}

// GET /api/v1/provider/services -> Listing[] (current provider's services)
export async function getMyServices() {
  const { data } = await client.get('/api/v1/provider/services')
  return Array.isArray(data) ? data : []
}

// GET /api/v1/providers/:id/services -> Listing[]
export async function getProviderServices(providerId) {
  const { data } = await client.get(`/api/v1/providers/${providerId}/services`)
  return Array.isArray(data) ? data : []
}
