import client from './client'

/* like.api.js — likes. The backend keys likes by (postId, userId) in the URL. */

// POST /api/v1/posts/:postId/likes/:userId
export async function likePost(postId, userId) {
  const { data } = await client.post(`/api/v1/posts/${postId}/likes/${userId}`)
  return data
}

// DELETE /api/v1/posts/:postId/likes/:userId
export async function unlikePost(postId, userId) {
  const { data } = await client.delete(`/api/v1/posts/${postId}/likes/${userId}`)
  return data
}

// GET /api/v1/posts/:postId/likes -> { post_id, like_count }
export async function getLikeCount(postId) {
  const { data } = await client.get(`/api/v1/posts/${postId}/likes`)
  return data
}
