<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, ChevronRight, ChevronLeft, Award, HelpCircle, ShieldCheck } from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/ui/BaseButton.vue'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

// Steps 0 to 7 mapping to different states of Screen 1 to 5
const currentStep = ref(0)
const rating = ref(0)
const hoveredRating = ref(0)

// Helper to determine the screen number (1 to 5) for progress indicator
const currentScreen = computed(() => {
  if (currentStep.value <= 1) return 1
  if (currentStep.value <= 3) return 2
  if (currentStep.value <= 5) return 3
  if (currentStep.value === 6) return 4
  return 5
})

function onNext() {
  if (currentStep.value < 7) {
    currentStep.value++
  } else {
    completeOnboarding()
  }
}

function onBack() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function skipOnboarding() {
  currentStep.value = 7 // Jump to rating screen
}

function completeOnboarding() {
  const userId = auth.userId || 'guest'
  localStorage.setItem(`onboarding_completed_${userId}`, 'true')
  
  toast.success('Welcome to Jamii Sasa!')
  
  if (auth.role === 'provider') {
    router.push({ name: 'provider-profile' })
  } else {
    router.push({ name: 'feed' })
  }
}
</script>

<template>
  <div class="min-h-dvh flex flex-col justify-between bg-[#080D16] text-slate-100 py-6 px-4 md:px-8 font-sans selection:bg-[#f59e0b]/30 selection:text-[#f59e0b]">
    <!-- Header -->
    <header class="w-full max-w-5xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800/60">
      <div class="flex items-center gap-2.5">
        <img src="/icon-192.png" alt="Jamii Sasa Logo" class="h-8 w-8 rounded-lg object-contain bg-slate-900 border border-slate-700/60 shadow-sm" />
        <span class="text-lg font-bold tracking-tight text-white">Jamii Sasa</span>
      </div>
      
      <button 
        v-if="currentStep < 7"
        @click="skipOnboarding" 
        class="text-xs font-bold text-slate-400 hover:text-[#f59e0b] transition-colors cursor-pointer uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-slate-800/40"
      >
        Skip
      </button>
    </header>

    <!-- Main Split-Screen Container -->
    <main class="w-full max-w-5xl mx-auto my-auto py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center p-6 md:p-12 bg-slate-900/60 rounded-[2rem] border border-slate-800/80 shadow-2xl relative overflow-hidden min-h-[460px] md:min-h-[500px]">
        
        <!-- ==================== SCREEN 1 ==================== -->
        <template v-if="currentScreen === 1">
          <!-- Left Column / Top Card (Anchor content remains static) -->
          <div class="space-y-6">
            <h2 class="text-3xl md:text-4xl font-extrabold text-white leading-tight font-sans tracking-tight">
              Finding someone you can trust can be hard.
            </h2>
            <div class="space-y-4 text-slate-300 text-base md:text-lg leading-relaxed font-sans font-normal">
              <p class="font-medium text-slate-400">We all want to know:</p>
              <p class="text-xl italic text-[#f59e0b] font-medium pl-4 border-l-2 border-[#f59e0b]/40 py-1">
                "Huyu mtu atafanya kazi poa kweli?"
              </p>
              <p>Most times, we ask friends, family, or people we trust before trying someone new.</p>
            </div>
          </div>

          <!-- Right Column / Bottom Card (Dynamic transition) -->
          <div class="relative h-full flex flex-col justify-center">
            <div 
              class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40 transition-all duration-500 ease-out transform space-y-4 shadow-xl"
              :class="[
                currentStep >= 1 
                  ? 'translate-x-0 translate-y-0 opacity-100 scale-100' 
                  : 'translate-x-12 translate-y-12 opacity-0 scale-95 pointer-events-none'
              ]"
            >
              <div class="flex items-center gap-3 text-[#f59e0b]">
                <ShieldCheck class="w-6 h-6 shrink-0" />
                <span class="text-xs uppercase font-bold tracking-widest">Trust Built-in</span>
              </div>
              <p class="text-slate-200 text-base leading-relaxed">
                At jamiiWera, we connect you with trusted local services who are reviewed and recommended by customers before you, so that you do not gamble with trust.
              </p>
            </div>
          </div>
        </template>

        <!-- ==================== SCREEN 2 ==================== -->
        <template v-else-if="currentScreen === 2">
          <!-- Left Column / Top Card (Anchor content remains static) -->
          <div class="space-y-6">
            <h2 class="text-3xl md:text-4xl font-extrabold text-white leading-tight font-sans tracking-tight">
              Trust grows when we grow together.
            </h2>
            <div class="space-y-4 text-slate-300 text-base md:text-lg leading-relaxed">
              <p>At Jamii Sasa, we believe everyone has a story, lesson, or opportunity worth sharing.</p>
              <p>Join a community where Kenyans connect, share experiences, exchange ideas, and learn from each other's financial journeys.</p>
            </div>
          </div>

          <!-- Right Column / Bottom Card (Dynamic transition) -->
          <div class="relative h-full flex flex-col justify-center">
            <div 
              class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40 transition-all duration-500 ease-out transform space-y-4 shadow-xl"
              :class="[
                currentStep >= 3 
                  ? 'translate-x-0 opacity-100 scale-100' 
                  : '-translate-x-12 opacity-0 scale-95 pointer-events-none'
              ]"
            >
              <div class="flex items-center gap-3 text-[#f59e0b]">
                <Award class="w-6 h-6 shrink-0" />
                <span class="text-xs uppercase font-bold tracking-widest">Shared Growth</span>
              </div>
              <p class="text-slate-200 text-base leading-relaxed">
                From saving better, starting something new, or making smarter money decisions, grow together with people walking a similar path.
              </p>
            </div>
          </div>
        </template>

        <!-- ==================== SCREEN 3 ==================== -->
        <template v-else-if="currentScreen === 3">
          <!-- Left Column / Top Card (Anchor content remains static) -->
          <div class="space-y-6">
            <h2 class="text-3xl md:text-4xl font-extrabold text-white leading-tight font-sans tracking-tight">
              Did you know?
            </h2>
            <div class="space-y-4 text-slate-300 text-base md:text-lg leading-relaxed">
              <p>An average person in Kenya is more likely to trust a brand or service because someone they trust recommended that brand or service.</p>
              <p class="font-medium text-slate-400">Because sometimes the best review is simply:</p>
              <p class="text-xl italic text-[#f59e0b] font-medium pl-4 border-l-2 border-[#f59e0b]/40 py-1">
                "Nimetumia huyu, ako sawa."
              </p>
            </div>
          </div>

          <!-- Right Column / Bottom Card (Dynamic transition) -->
          <div class="relative h-full flex flex-col justify-center">
            <div 
              class="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40 transition-all duration-500 ease-out transform space-y-4 shadow-xl"
              :class="[
                currentStep >= 5 
                  ? 'translate-x-0 translate-y-0 opacity-100 scale-100' 
                  : 'translate-x-12 translate-y-12 opacity-0 scale-95 pointer-events-none'
              ]"
            >
              <div class="flex items-center gap-3 text-[#f59e0b]">
                <HelpCircle class="w-6 h-6 shrink-0" />
                <span class="text-xs uppercase font-bold tracking-widest">Community Verified</span>
              </div>
              <div class="space-y-3 text-slate-200 text-base leading-relaxed">
                <p class="font-bold text-white">That is the power of Jamii Sasa.</p>
                <p>Choose service providers based on real experiences from customers who have been there before you.</p>
                <p class="font-semibold text-slate-400 border-t border-slate-700/60 pt-3 text-sm">Trust built by people, for people.</p>
              </div>
            </div>
          </div>
        </template>

        <!-- ==================== SCREEN 4 ==================== -->
        <template v-else-if="currentScreen === 4">
          <!-- Left Column / Top Card -->
          <div class="space-y-6">
            <h2 class="text-3xl md:text-4xl font-extrabold text-white leading-tight font-sans tracking-tight">
              How Jamii Sasa Works
            </h2>
            <div class="w-16 h-1 bg-[#f59e0b] rounded-full"></div>
          </div>

          <!-- Right Column / Bottom Card -->
          <div class="space-y-6 animate-rise-fade">
            <!-- Step 1 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] font-bold flex items-center justify-center border border-[#f59e0b]/20">1</div>
              <div class="space-y-1">
                <h4 class="font-bold text-white text-base">Learn & Share</h4>
                <p class="text-sm text-slate-300 leading-relaxed">Connect with people, learn from their experiences, discover opportunities, and share your own journey.</p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] font-bold flex items-center justify-center border border-[#f59e0b]/20">2</div>
              <div class="space-y-1">
                <h4 class="font-bold text-white text-base">Book With Confidence</h4>
                <p class="text-sm text-slate-300 leading-relaxed">Discover, chat, book, and pay for services securely and confidently through jamiiWera.</p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex gap-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] font-bold flex items-center justify-center border border-[#f59e0b]/20">3</div>
              <div class="space-y-1">
                <h4 class="font-bold text-white text-base">Build Trust Together</h4>
                <p class="text-sm text-slate-300 leading-relaxed">Leave a review and rate your experience after every service to keep the community safe and trusted.</p>
              </div>
            </div>
          </div>
        </template>

        <!-- ==================== SCREEN 5 ==================== -->
        <template v-else-if="currentScreen === 5">
          <!-- Left Column / Top Card -->
          <div class="space-y-6">
            <h2 class="text-3xl md:text-4xl font-extrabold text-white leading-tight font-sans tracking-tight">
              Congratulations!
            </h2>
            <p class="text-slate-300 text-lg leading-relaxed max-w-sm">
              You have taken the first step towards connecting with the Jamii Sasa community.
            </p>
          </div>

          <!-- Right Column / Bottom Card -->
          <div class="flex flex-col items-center justify-center p-6 bg-slate-800/30 rounded-2xl border border-slate-700/30 space-y-6 shadow-xl animate-rise-fade">
            <h3 class="text-lg font-bold text-white">Rate your experience so far...</h3>
            
            <!-- Interactive Rating Stars -->
            <div class="flex items-center space-x-2">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="rating = star"
                @mouseenter="hoveredRating = star"
                @mouseleave="hoveredRating = 0"
                class="p-1.5 transition-transform hover:scale-125 duration-150 cursor-pointer bg-transparent border-none outline-none"
                :aria-label="`Rate ${star} stars`"
              >
                <Star
                  class="w-9 h-9 transition-colors"
                  :class="[
                    star <= (hoveredRating || rating)
                      ? 'fill-[#f59e0b] text-[#f59e0b]'
                      : 'text-slate-600'
                  ]"
                />
              </button>
            </div>
            
            <p class="text-xs text-slate-400 h-4">
              {{ rating > 0 ? `Thank you for rating us ${rating}/5!` : 'Tap a star to select a rating' }}
            </p>
          </div>
        </template>

      </div>
    </main>

    <!-- Footer: Controls & Navigation -->
    <footer class="w-full max-w-5xl mx-auto flex items-center justify-between pt-4 border-t border-slate-800/60">
      <!-- Back Button -->
      <button 
        v-if="currentStep > 0"
        @click="onBack"
        class="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-2 pr-4 pl-2 rounded-xl hover:bg-slate-800/40 bg-transparent border-none outline-none"
      >
        <ChevronLeft class="w-4 h-4" />
        Back
      </button>
      <div v-else class="w-10 h-10"></div> <!-- Placeholder to maintain alignment -->

      <!-- Progress Indicators (1-5) -->
      <div class="flex items-center space-x-2.5">
        <div 
          v-for="idx in 5" 
          :key="idx"
          class="h-1.5 rounded-full transition-all duration-300"
          :class="[
            currentScreen === idx
              ? 'w-7 bg-[#f59e0b]'
              : 'w-2.5 bg-slate-800'
          ]"
        ></div>
      </div>

      <!-- Action Button -->
      <BaseButton 
        size="lg"
        class="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 duration-150 inline-flex items-center gap-1 border-none outline-none cursor-pointer"
        @click="onNext"
      >
        <span>{{ currentStep === 7 ? 'Explore Jamii Sasa' : 'Continue' }}</span>
        <ChevronRight v-if="currentStep < 7" class="w-4 h-4 shrink-0" />
      </BaseButton>
    </footer>
  </div>
</template>

<style scoped>
/* Additional fade elements rise on mount */
@keyframes rise-fade {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-rise-fade {
  animation: rise-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
