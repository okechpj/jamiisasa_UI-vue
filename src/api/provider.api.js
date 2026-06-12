import client from './client'

/*
 * provider.api.js — provider profiles.
 * Reads (/providers...) are open to any authenticated user; writes
 * (/provider/profile) are provider/admin only on the backend.
 * Provider identity is the owning user's id (:id below is a user id).
 */

// POST /api/v1/provider/profile
export async function createProfile(payload) {
  const { data } = await client.post('/api/v1/provider/profile', payload)
  return data
}

// GET /api/v1/provider/profile -> Profile (current provider)
export async function getMyProfile() {
  const { data } = await client.get('/api/v1/provider/profile')
  return data
}

// PUT /api/v1/provider/profile
export async function updateProfile(payload) {
  const { data } = await client.put('/api/v1/provider/profile', payload)
  return data
}

// GET /api/v1/providers/:id -> Profile
export async function getProvider(id) {
  const { data } = await client.get(`/api/v1/providers/${id}`)
  return data
}

// GET /api/v1/providers -> Profile[]
export async function listProviders() {
  const { data } = await client.get('/api/v1/providers')
  return Array.isArray(data) ? data : []
}
