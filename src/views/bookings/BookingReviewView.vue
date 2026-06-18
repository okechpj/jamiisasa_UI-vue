<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { 
  ArrowLeft, 
  MoreVertical, 
  Star, 
  Video, 
  Image, 
  Smile, 
  Users, 
  Check, 
  X, 
  Loader2, 
  ShieldCheck 
} from 'lucide-vue-next'

import { useBookingStore } from '@/stores/booking.store'
import { useReviewStore } from '@/stores/review.store'
import { useToast } from '@/composables/useToast'
import { uploadImage } from '@/api/storage.api'
import { resolveMediaUrl } from '@/lib/storage'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'

const props = defineProps({
  bookingId: { type: String, required: true },
})

const router = useRouter()
const bookingStore = useBookingStore()
const reviewStore = useReviewStore()
const toast = useToast()

const loading = ref(true)
const rating = ref(0)
const hoverRating = ref(0)
const punctual = ref('') // 'punctual' | 'delayed'
const matchedExpectations = ref('') // 'matched' | 'needed_adjustments'
const hireAgain = ref('') // 'definitely' | 'maybe'
const comment = ref('')
const recommendation = ref('') // 'strongly_recommend' | 'recommend' | 'neutral' | 'not_recommend'

const videoKey = ref(null)
const uploadingVideo = ref(false)
const videoProgress = ref(0)

const workPhotos = ref([])
const uploadingPhotos = ref(false)
const submitting = ref(false)

const booking = computed(() => {
  return bookingStore.myBookings.find((b) => b.id === props.bookingId) || 
         bookingStore.providerBookings.find((b) => b.id === props.bookingId) || 
         null
})

const ratingText = computed(() => {
  const labels = {
    1: 'Poor & Unsatisfactory',
    2: 'Below Expectations',
    3: 'Average & Acceptable',
    4: 'Great & Professional',
    5: 'Excellent & Trustworthy'
  }
  return labels[rating.value] || 'Tap a star to rate'
})

const recommendations = [
  { value: 'strongly_recommend', label: 'Strongly Recommend', activeClass: 'bg-[#1b3a16] border-[#1b3a16] text-white', defaultClass: 'bg-base border-line text-ink hover:bg-surface' },
  { value: 'recommend', label: 'Recommend', activeClass: 'bg-[#1b3a16] border-[#1b3a16] text-white', defaultClass: 'bg-base border-line text-ink hover:bg-surface' },
  { value: 'neutral', label: 'Neutral', activeClass: 'bg-[#1b3a16] border-[#1b3a16] text-white', defaultClass: 'bg-base border-line text-ink hover:bg-surface' },
  { value: 'not_recommend', label: 'Not Recommend', activeClass: 'bg-danger border-danger text-white', defaultClass: 'bg-base border-line text-danger hover:bg-surface' }
]

function formatReviewDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    const options = { month: 'short', day: 'numeric' }
    return d.toLocaleDateString('en-US', options).toUpperCase()
  } catch {
    return dateStr
  }
}

onMounted(async () => {
  loading.value = true
  try {
    if (!bookingStore.myBookings.length) {
      await bookingStore.fetchMyBookings()
    }
  } catch (e) {
    toast.error('Failed to load booking details.')
  } finally {
    loading.value = false
  }
})

async function handleVideoUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  uploadingVideo.value = true
  videoProgress.value = 0
  try {
    const key = await uploadImage(file, 'review_media', (pct) => {
      videoProgress.value = pct
    })
    videoKey.value = key
    toast.success('Video uploaded successfully!')
  } catch (e) {
    toast.error(e.message || 'Failed to upload video.')
  } finally {
    uploadingVideo.value = false
  }
}

async function handlePhotoUpload(event) {
  const files = Array.from(event.target.files)
  if (!files.length) return
  uploadingPhotos.value = true
  try {
    for (const file of files) {
      const key = await uploadImage(file, 'review_media')
      workPhotos.value.push(key)
    }
    toast.success('Photos uploaded successfully!')
  } catch (e) {
    toast.error(e.message || 'Failed to upload photos.')
  } finally {
    uploadingPhotos.value = false
  }
}

function removePhoto(idx) {
  workPhotos.value.splice(idx, 1)
}

function goBack() {
  router.back()
}

async function submit() {
  if (rating.value === 0) {
    toast.error('Please select a star rating.')
    return
  }
  if (!punctual.value) {
    toast.error('Please answer: Was the provider on time?')
    return
  }
  if (!matchedExpectations.value) {
    toast.error('Please answer: Did the work match expectations?')
    return
  }
  if (!hireAgain.value) {
    toast.error('Please answer: Would you hire them again?')
    return
  }
  if (!recommendation.value) {
    toast.error('Please select if you recommend this provider.')
    return
  }

  submitting.value = true
  try {
    await reviewStore.submitReview({
      booking_id: props.bookingId,
      rating: rating.value,
      punctual: punctual.value,
      matched_expectations: matchedExpectations.value,
      hire_again: hireAgain.value,
      comment: comment.value,
      recommendation: recommendation.value,
      video_key: videoKey.value,
      work_photos: workPhotos.value,
    })
    toast.success('Review submitted successfully!')
    router.push({ name: 'my-bookings' })
  } catch (e) {
    toast.error(reviewStore.error || 'Failed to submit review.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface">
    <!-- Header -->
    <header class="flex items-center justify-between py-4 border-b border-line px-4 bg-base sticky top-0 z-10">
      <button @click="goBack" class="flex items-center gap-2 text-ink font-semibold hover:opacity-80 transition-opacity">
        <ArrowLeft class="h-5 w-5" />
        <span class="text-base">Jamii Sasa</span>
      </button>
      <button class="text-ink hover:opacity-85">
        <MoreVertical class="h-5 w-5" />
      </button>
    </header>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <Loader2 class="h-8 w-8 animate-spin text-brand" />
      <span class="text-sm text-muted mt-2">Loading booking info...</span>
    </div>

    <div v-else-if="!booking" class="p-4 max-w-xl mx-auto">
      <div class="rounded-card border border-line bg-base p-6 text-center text-danger">
        Booking not found.
      </div>
    </div>

    <!-- Main Container -->
    <main v-else class="p-4 sm:p-6 max-w-xl mx-auto space-y-6 animate-rise-fade pb-10">
      <div>
        <h1 class="text-2xl font-bold text-ink">How was your experience?</h1>
        <p class="text-sm text-muted mt-1">Your feedback helps communities discover trusted providers.</p>
      </div>

      <!-- Provider Details Card -->
      <div class="flex items-center gap-4 p-4 border border-line rounded-card bg-base shadow-sm">
        <BaseAvatar :name="booking.counterpartyName" :src="booking.counterpartyAvatar" size="lg" />
        <div class="min-w-0 flex-1">
          <h2 class="font-bold text-ink truncate text-base leading-tight">{{ booking.counterpartyName }}</h2>
          <p class="text-sm text-muted mt-0.5">{{ booking.serviceName }}</p>
          <p class="text-xs font-semibold text-muted/80 uppercase mt-1.5 tracking-wider">{{ formatReviewDate(booking.bookingDate) }}</p>
        </div>
      </div>

      <!-- Interactive Stars -->
      <div class="flex flex-col items-center justify-center py-6 border border-line rounded-card bg-base/50">
        <div class="flex items-center gap-2">
          <button 
            v-for="star in 5" 
            :key="star" 
            type="button"
            @click="rating = star"
            @mouseenter="hoverRating = star"
            @mouseleave="hoverRating = 0"
            class="transition-transform active:scale-95 p-1"
          >
            <Star 
              class="h-9 w-9 stroke-[1.5px]"
              :class="star <= (hoverRating || rating) ? 'fill-[#48bb78] text-[#48bb78]' : 'text-muted/40'"
            />
          </button>
        </div>
        <p class="mt-3 text-sm font-bold text-[#48bb78]">{{ ratingText }}</p>
      </div>

      <!-- Questions Section -->
      <div class="space-y-4">
        <!-- Q1: Time-keeping -->
        <div class="space-y-2">
          <h3 class="text-sm font-bold text-ink">Was the provider on time?</h3>
          <div class="flex gap-2">
            <button 
              type="button"
              @click="punctual = 'punctual'"
              class="px-5 py-2 text-sm font-semibold rounded-full border transition-all"
              :class="punctual === 'punctual' 
                ? 'bg-[#1b3a16] border-[#1b3a16] text-white' 
                : 'bg-base border-line text-ink hover:bg-surface'"
            >
              Punctual
            </button>
            <button 
              type="button"
              @click="punctual = 'delayed'"
              class="px-5 py-2 text-sm font-semibold rounded-full border transition-all"
              :class="punctual === 'delayed' 
                ? 'bg-[#1b3a16] border-[#1b3a16] text-white' 
                : 'bg-base border-line text-ink hover:bg-surface'"
            >
              Slightly Delayed
            </button>
          </div>
        </div>

        <!-- Q2: Quality -->
        <div class="space-y-2">
          <h3 class="text-sm font-bold text-ink">Did the work match expectations?</h3>
          <div class="flex gap-2">
            <button 
              type="button"
              @click="matchedExpectations = 'matched'"
              class="px-5 py-2 text-sm font-semibold rounded-full border transition-all"
              :class="matchedExpectations === 'matched' 
                ? 'bg-[#1b3a16] border-[#1b3a16] text-white' 
                : 'bg-base border-line text-ink hover:bg-surface'"
            >
              Matched Perfectly
            </button>
            <button 
              type="button"
              @click="matchedExpectations = 'needed_adjustments'"
              class="px-5 py-2 text-sm font-semibold rounded-full border transition-all"
              :class="matchedExpectations === 'needed_adjustments' 
                ? 'bg-[#1b3a16] border-[#1b3a16] text-white' 
                : 'bg-base border-line text-ink hover:bg-surface'"
            >
              Needed Adjustments
            </button>
          </div>
        </div>

        <!-- Q3: Rehire -->
        <div class="space-y-2">
          <h3 class="text-sm font-bold text-ink">Would you hire {{ booking.counterpartyName }} again?</h3>
          <div class="flex gap-2">
            <button 
              type="button"
              @click="hireAgain = 'definitely'"
              class="px-5 py-2 text-sm font-semibold rounded-full border transition-all"
              :class="hireAgain === 'definitely' 
                ? 'bg-[#1b3a16] border-[#1b3a16] text-white' 
                : 'bg-base border-line text-ink hover:bg-surface'"
            >
              Definitely
            </button>
            <button 
              type="button"
              @click="hireAgain = 'maybe'"
              class="px-5 py-2 text-sm font-semibold rounded-full border transition-all"
              :class="hireAgain === 'maybe' 
                ? 'bg-[#1b3a16] border-[#1b3a16] text-white' 
                : 'bg-base border-line text-ink hover:bg-surface'"
            >
              Maybe
            </button>
          </div>
        </div>
      </div>

      <!-- Experience Comment -->
      <div class="space-y-2">
        <h3 class="text-sm font-bold text-ink">Tell others about your experience</h3>
        <textarea
          v-model="comment"
          rows="4"
          class="w-full p-4 border border-line rounded-card bg-base text-sm text-ink placeholder:text-muted/65 focus:outline-none focus:ring-1 focus:ring-brand/40"
          placeholder="Grace was incredibly thorough with the kitchen cleaning. She arrived early and brought her own high-quality supplies..."
        ></textarea>
      </div>

      <!-- Media Recommendation Uploaders -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Video Upload -->
        <label class="flex flex-col items-center justify-center p-4 border border-dashed border-line rounded-card bg-base cursor-pointer hover:bg-surface transition text-center min-h-[110px]">
          <input type="file" accept="video/mp4,video/webm,video/quicktime" class="hidden" @change="handleVideoUpload" :disabled="uploadingVideo" />
          <Video class="h-6 w-6 text-brand" v-if="!uploadingVideo && !videoKey" />
          <Loader2 class="h-6 w-6 animate-spin text-brand" v-else-if="uploadingVideo" />
          <Check class="h-6 w-6 text-success" v-else />
          <span class="text-xs font-bold text-ink mt-2">
            {{ uploadingVideo ? `Uploading ${videoProgress}%` : videoKey ? 'Video Uploaded' : 'Upload Video Recommendation' }}
          </span>
        </label>

        <!-- Photos Upload -->
        <label class="flex flex-col items-center justify-center p-4 border border-dashed border-line rounded-card bg-base cursor-pointer hover:bg-surface transition text-center min-h-[110px]">
          <input type="file" accept="image/*" multiple class="hidden" @change="handlePhotoUpload" :disabled="uploadingPhotos" />
          <Image class="h-6 w-6 text-brand" v-if="!uploadingPhotos" />
          <Loader2 class="h-6 w-6 animate-spin text-brand" v-else />
          <span class="text-xs font-bold text-ink mt-2">
            {{ uploadingPhotos ? 'Uploading...' : 'Add Work Photos' }}
          </span>
        </label>
      </div>

      <!-- Work Photos Previews -->
      <div v-if="workPhotos.length" class="flex flex-wrap gap-2 pt-1">
        <div v-for="(photo, idx) in workPhotos" :key="idx" class="relative w-14 h-14 rounded-lg overflow-hidden border border-line">
          <img :src="resolveMediaUrl(photo)" class="w-full h-full object-cover" />
          <button type="button" class="absolute top-0 right-0 p-0.5 bg-danger/80 text-white rounded-bl" @click="removePhoto(idx)">
            <X class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- Provider Recommendation Selector -->
      <div class="p-4 border border-line rounded-card bg-base space-y-4">
        <div class="flex items-center gap-2">
          <Smile class="h-5 w-5 text-ink" />
          <h3 class="text-sm font-bold text-ink">Would you recommend this provider?</h3>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button 
            v-for="rec in recommendations"
            :key="rec.value"
            type="button"
            @click="recommendation = rec.value"
            class="py-3 px-2 text-xs font-bold rounded-lg border text-center flex items-center justify-center gap-1.5 transition-all"
            :class="recommendation === rec.value 
              ? rec.activeClass 
              : rec.defaultClass"
          >
            <Check v-if="recommendation === rec.value" class="h-3.5 w-3.5" />
            {{ rec.label }}
          </button>
        </div>
      </div>

      <!-- Bottom grow notice -->
      <div class="flex items-center justify-center gap-2 text-xs text-muted/80 py-2">
        <Users class="h-4 w-4" />
        <span>Your review helps trusted local providers grow.</span>
      </div>

      <!-- Submit Review Button -->
      <button
        type="button"
        @click="submit"
        :disabled="submitting || uploadingVideo || uploadingPhotos || rating === 0"
        class="w-full py-4 bg-[#4caf50] hover:bg-[#43a047] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-full flex items-center justify-center gap-2 shadow-md transition-colors"
      >
        <Loader2 v-if="submitting" class="h-5 w-5 animate-spin" />
        <span v-else class="flex items-center gap-1.5 justify-center">
          Submit Review
          <ShieldCheck class="h-5 w-5" />
        </span>
      </button>
    </main>
  </div>
</template>
