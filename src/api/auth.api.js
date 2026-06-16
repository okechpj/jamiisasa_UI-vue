import client from './client'

/* auth.api.js — registration, login, and current/other user profiles. */

// POST /auth/register -> { message }  (no token; caller logs in afterwards)
export async function register(payload) {
  const { data } = await client.post('/auth/register', payload)
  return data
}

// POST /auth/login -> { token }
export async function login(payload) {
  const { data } = await client.post('/auth/login', payload)
  return data
}

// GET /api/v1/me -> User (the authenticated user's full profile)
export async function me() {
  const { data } = await client.get('/api/v1/me')
  return data
}

// GET /api/v1/users/:id -> User (another user's public profile)
export async function getUser(id) {
  const { data } = await client.get(`/api/v1/users/${id}`)
  return data
}

// PUT /api/v1/me -> User (update authenticated user's profile)
export async function updateProfile(payload) {
  const { data } = await client.put('/api/v1/me', payload)
  return data
}

// POST /api/v1/me/location -> { message }
export async function updateLocation(payload) {
  const { data } = await client.post('/api/v1/me/location', payload)
  return data
}
