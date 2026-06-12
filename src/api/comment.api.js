import client from './client'

/* comment.api.js — post comments. */

// GET /api/v1/posts/:postId/comments -> Comment[]
export async function getComments(postId) {
  const { data } = await client.get(`/api/v1/posts/${postId}/comments`)
  return Array.isArray(data) ? data : []
}

// POST /api/v1/comments -> Comment   body: { post_id, user_id, content }
export async function createComment(payload) {
  const { data } = await client.post('/api/v1/comments', payload)
  return data
}
