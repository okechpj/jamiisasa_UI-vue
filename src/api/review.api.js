import apiClient from './client'

export async function createReview(reviewData) {
  const response = await apiClient.post('/api/v1/reviews', reviewData)
  return response.data
}

export async function getReviewByBooking(bookingId) {
  const response = await apiClient.get(`/api/v1/reviews/booking/${bookingId}`)
  return response.data
}

export async function getProviderReviews(providerId) {
  const response = await apiClient.get(`/api/v1/providers/${providerId}/reviews`)
  return response.data
}

export const reviewApi = {
  createReview,
  getReviewByBooking,
  getProviderReviews,
}
