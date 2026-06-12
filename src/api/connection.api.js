import client from './client'

/* connection.api.js — connection requests, lists, and per-user statuses. */

// POST /api/v1/connections/request  (requester comes from the token)
export async function sendRequest(receiverId) {
  const { data } = await client.post('/api/v1/connections/request', { receiver_id: receiverId })
  return data
}

// GET /api/v1/connections -> Connection[]  (accepted, involving the current user)
export async function getConnections() {
  const { data } = await client.get('/api/v1/connections')
  return Array.isArray(data) ? data : []
}

// GET /api/v1/connections/pending -> Connection[]  (incoming pending requests)
export async function getPending() {
  const { data } = await client.get('/api/v1/connections/pending')
  return Array.isArray(data) ? data : []
}

// POST /api/v1/connections/:id/accept
export async function accept(id) {
  const { data } = await client.post(`/api/v1/connections/${id}/accept`)
  return data
}

// POST /api/v1/connections/:id/reject
export async function reject(id) {
  const { data } = await client.post(`/api/v1/connections/${id}/reject`)
  return data
}

// GET /api/v1/connections/statuses -> { user_id, status }[]
export async function getStatuses() {
  const { data } = await client.get('/api/v1/connections/statuses')
  return Array.isArray(data) ? data : []
}
