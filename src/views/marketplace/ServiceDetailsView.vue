<script setup>
import { onMounted, ref, watch, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { 
  ArrowLeft, 
  MapPin, 
  Sparkles, 
  Briefcase, 
  Star, 
  ChevronRight, 
  ShieldCheck,
  CalendarCheck,
  AlertTriangle
} from 'lucide-vue-next'

import { useServiceStore } from '@/stores/service.store'
import { useProviderStore } from '@/stores/provider.store'
import { useReviewStore } from '@/stores/review.store'
import { useBookingStore } from '@/stores/booking.store'
import { formatPriceRange } from '@/lib/marketplace'
import { resolveMediaUrl } from '@/lib/storage'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const serviceStore = useServiceStore()
const providerStore = useProviderStore()
const reviewStore = useReviewStore()
const bookingStore = useBookingStore()
const router = useRouter()

const { currentService, loading: serviceLoading, error: serviceError } = storeToRefs(serviceStore)
const { currentProvider, loading: providerLoading } = storeToRefs(providerStore)

const reviews = ref([])
const reviewsLoading = ref(false)
const reviewsError = ref('')

const averageRating = computed(() => {
  if (!reviews.value || !reviews.value.length) return 0
  const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
  return (sum / reviews.value.length).toFixed(1)
})

const price = computed(() => {
  if (!currentService.value) return ''
  return formatPriceRange(currentService.value.priceMin, currentService.value.priceMax)
})

async function load() {
  reviews.value = []
  reviewsError.value = ''
  
  const svc = await serviceStore.fetchService(props.id)
  if (svc && svc.providerId) {
    providerStore.fetchProvider(svc.providerId)
    
    reviewsLoading.value = true
    try {
      const res = await reviewStore.fetchProviderReviews(svc.providerId)
      reviews.value = Array.isArray(res) ? res : []
    } catch (e) {
      reviewsError.value = 'Could not load reviews.'
    } finally {
      reviewsLoading.value = false
    }
  }
}

onMounted(load)
watch(() => props.id, load)

function handleBook() {
  if (!currentService.value || !currentService.value.providerId) return
  bookingStore.selectService(currentService.value, currentService.value.providerId)
  router.push({
    name: 'booking',
    params: {
      providerId: currentService.value.providerId,
      serviceId: currentService.value.id
    }
  })
}

function formatReviewDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl pb-24">
    <!-- Back button -->
    <RouterLink 
      :to="{ name: 'marketplace-providers' }" 
      class="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to JamiiWera
    </RouterLink>

    <!-- Skeleton Loading -->
    <div v-if="serviceLoading" class="space-y-4">
      <BaseSkeleton class="h-48 w-full rounded-card" />
      <BaseSkeleton class="h-8 w-2/3" />
      <BaseSkeleton class="h-4 w-1/3" />
      <BaseSkeleton class="h-20 w-full" />
    </div>

    <!-- Error State -->
    <EmptyState v-else-if="serviceError || !currentService" title="Service details unavailable" :description="serviceError">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action>
        <BaseButton variant="secondary" @click="load">Try again</BaseButton>
      </template>
    </EmptyState>

    <template v-else>
      <!-- Service Main Details -->
      <article class="overflow-hidden rounded-card border border-line bg-base shadow-sm">
        <div v-if="currentService.imageSrc" class="aspect-[16/9] w-full overflow-hidden bg-surface">
          <img 
            :src="currentService.imageSrc" 
            :alt="currentService.serviceName" 
            class="h-full w-full object-cover" 
          />
        </div>
        <div v-else class="grid aspect-[16/9] w-full place-items-center bg-gradient-to-br from-brand/10 to-brand-light/10">
          <Sparkles class="h-12 w-12 text-brand/30" />
        </div>

        <div class="p-5 sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <BaseBadge v-if="currentService.serviceCategory" variant="brand">
                {{ currentService.serviceCategory }}
              </BaseBadge>
              <h1 class="mt-2 text-2xl font-extrabold text-ink leading-tight">
                {{ currentService.serviceName }}
              </h1>
            </div>
            <p class="text-lg font-bold text-brand">{{ price }}</p>
          </div>

          <p v-if="currentService.description" class="mt-4 whitespace-pre-wrap text-sm text-ink leading-relaxed">
            {{ currentService.description }}
          </p>
        </div>
      </article>

      <!-- Clickable Provider Profile Card -->
      <h2 class="mb-3 mt-6 text-sm font-bold text-ink uppercase tracking-wider">
        Service Provider
      </h2>
      <div v-if="providerLoading && !currentProvider" class="rounded-card border border-line bg-base p-4">
        <div class="flex items-center gap-3">
          <BaseSkeleton class="h-12 w-12 rounded-full" />
          <div class="flex-1 space-y-2">
            <BaseSkeleton class="h-4 w-1/3" />
            <BaseSkeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>
      <RouterLink 
        v-else-if="currentProvider"
        :to="{ name: 'provider-details', params: { id: currentProvider.userId } }"
        class="group block rounded-card border border-line bg-base p-4 shadow-sm transition-all hover:border-brand hover:bg-surface/30"
      >
        <div class="flex items-center gap-4">
          <BaseAvatar 
            :name="currentProvider.businessName" 
            :src="currentProvider.avatar" 
            size="md" 
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="truncate text-base font-bold text-ink group-hover:text-brand">
                {{ currentProvider.businessName }}
              </h3>
              <ShieldCheck 
                v-if="currentProvider.isVerified" 
                class="h-4 w-4 shrink-0 text-brand" 
              />
            </div>
            <p v-if="currentProvider.location" class="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin class="h-3.5 w-3.5" />
              {{ currentProvider.location }}
            </p>
          </div>
          <ChevronRight class="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand" />
        </div>
        <p v-if="currentProvider.description" class="mt-3 line-clamp-2 text-xs text-muted leading-relaxed">
          {{ currentProvider.description }}
        </p>
      </RouterLink>

      <!-- Reviews Section -->
      <div class="mt-8">
        <div class="flex items-baseline justify-between border-b border-line pb-3">
          <h2 class="text-base font-bold text-ink">
            Customer Reviews
          </h2>
          <div v-if="reviews.length" class="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>{{ averageRating }}</span>
            <span class="text-muted">({{ reviews.length }} {{ reviews.length === 1 ? 'review' : 'reviews' }})</span>
          </div>
        </div>

        <div v-if="reviewsLoading" class="mt-4 space-y-3">
          <BaseSkeleton v-for="i in 2" :key="i" class="h-24 w-full rounded-card" />
        </div>

        <div v-else-if="reviewsError" class="mt-4 rounded-card bg-danger/5 border border-danger/10 p-4 text-center text-sm text-danger">
          {{ reviewsError }}
        </div>

        <div v-else-if="!reviews.length" class="py-8 text-center text-sm text-muted">
          No reviews yet. Be the first to book and rate this service!
        </div>

        <div v-else class="mt-4 space-y-4">
          <article 
            v-for="rev in reviews" 
            :key="rev.id" 
            class="rounded-card border border-line bg-base p-4 shadow-sm"
          >
            <!-- Review Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <BaseAvatar :name="rev.customer_name" :src="resolveMediaUrl(rev.customer_avatar)" size="sm" />
                <div>
                  <h4 class="text-sm font-bold text-ink leading-tight">{{ rev.customer_name || 'Customer' }}</h4>
                  <div class="mt-1 flex items-center gap-1">
                    <Star 
                      v-for="s in 5" 
                      :key="s" 
                      class="h-3 w-3" 
                      :class="s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-muted/30'" 
                    />
                  </div>
                </div>
              </div>
              <span class="text-[10px] font-medium text-muted">
                {{ formatReviewDate(rev.created_at) }}
              </span>
            </div>

            <!-- Badges -->
            <div class="mt-2 flex flex-wrap gap-1.5">
              <span 
                v-if="rev.punctual === 'punctual'" 
                class="rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
              >
                On Time
              </span>
              <span 
                v-else-if="rev.punctual === 'delayed'"
                class="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
              >
                Delayed
              </span>
              
              <span 
                v-if="rev.matched_expectations === 'matched'" 
                class="rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
              >
                Expectations Met
              </span>
              <span 
                v-else-if="rev.matched_expectations === 'needed_adjustments'"
                class="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
              >
                Needed Adjustments
              </span>

              <span 
                v-if="rev.recommendation === 'strongly_recommend' || rev.recommendation === 'recommend'" 
                class="rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
              >
                Recommended
              </span>
            </div>

            <!-- Comment -->
            <p v-if="rev.comment" class="mt-3 text-sm text-ink leading-relaxed">
              {{ rev.comment }}
            </p>

            <!-- Media Attachments -->
            <div v-if="rev.work_photos && rev.work_photos.length" class="mt-3 flex flex-wrap gap-2">
              <img 
                v-for="(photo, pidx) in rev.work_photos" 
                :key="pidx" 
                :src="resolveMediaUrl(photo)" 
                class="h-14 w-14 rounded-lg border border-line object-cover" 
              />
            </div>
            
            <div v-if="rev.video_key" class="mt-3">
              <video 
                :src="resolveMediaUrl(rev.video_key)" 
                controls 
                class="max-h-40 w-full max-w-xs rounded-lg border border-line"
              />
            </div>
          </article>
        </div>
      </div>
    </template>

    <!-- Sticky Booking Button -->
    <div 
      v-if="currentService && !serviceLoading"
      class="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-base/95 px-4 py-3 backdrop-blur md:static md:mt-8 md:border-0 md:bg-transparent md:p-0"
    >
      <div class="mx-auto max-w-2xl">
        <BaseButton 
          class="w-full justify-center py-3 font-extrabold text-white flex items-center gap-2 text-sm rounded-xl"
          @click="handleBook"
        >
          <CalendarCheck class="h-4.5 w-4.5" />
          Book Service
        </BaseButton>
      </div>
    </div>
  </section>
</template>
