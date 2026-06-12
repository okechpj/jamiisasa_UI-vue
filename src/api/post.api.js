import client from './client'

/* post.api.js — feed, post creation, and a user's posts. */

// GET /api/v1/feed?limit&offset -> Post[]  (public)
export async function getFeed({ limit = 20, offset = 0 } = {}) {
  const { data } = await client.get('/api/v1/feed', { params: { limit, offset } })
  return Array.isArray(data) ? data : []
}

// POST /api/v1/posts -> Post
export async function createPost(payload) {
  const { data } = await client.post('/api/v1/posts', payload)
  return data
}

// GET /api/v1/users/:id/posts -> Post[]
export async function getUserPosts(userId) {
  const { data } = await client.get(`/api/v1/users/${userId}/posts`)
  return Array.isArray(data) ? data : []
}
