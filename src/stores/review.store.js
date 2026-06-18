import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as reviewApi from '@/api/review.api'
import { extractError } from '@/lib/errors'

export const useReviewStore = defineStore('review', () => {
  const loading = ref(false)
  const error = ref('')

  async function submitReview(reviewData) {
    loading.value = true
    error.value = ''
    try {
      const data = await reviewApi.createReview(reviewData)
      return data
    } catch (e) {
      error.value = extractError(e, 'Failed to submit review.')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchReviewByBooking(bookingId) {
    loading.value = true
    error.value = ''
    try {
      const data = await reviewApi.getReviewByBooking(bookingId)
      return data
    } catch (e) {
      error.value = extractError(e, 'Failed to fetch review.')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchProviderReviews(providerId) {
    loading.value = true
    error.value = ''
    try {
      const data = await reviewApi.getProviderReviews(providerId)
      return data
    } catch (e) {
      error.value = extractError(e, 'Failed to fetch reviews.')
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    submitReview,
    fetchReviewByBooking,
    fetchProviderReviews,
  }
})
