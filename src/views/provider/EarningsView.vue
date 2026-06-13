<script setup>
import { ref, onMounted } from 'vue'
import { TrendingUp, Wallet, Calendar, DollarSign, Briefcase, AlertTriangle } from 'lucide-vue-next'

import { getEarningsDashboard } from '@/api/earnings.api'
import { extractError } from '@/lib/errors'
import { formatKES } from '@/lib/marketplace'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const dashboard = ref(null)
const loading = ref(true)
const error = ref('')

const stats = [
  { 
    key: 'today_earnings', 
    label: 'Today', 
    icon: DollarSign, 
    color: 'text-brand',
    bgColor: 'bg-brand/10'
  },
  { 
    key: 'week_earnings', 
    label: 'This Week', 
    icon: Calendar, 
    color: 'text-success',
    bgColor: 'bg-success/10'
  },
  { 
    key: 'month_earnings', 
    label: 'This Month', 
    icon: TrendingUp, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  { 
    key: 'lifetime_earnings', 
    label: 'All Time', 
    icon: Wallet, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    dashboard.value = await getEarningsDashboard()
  } catch (e) {
    error.value = extractError(e, 'Could not load earnings dashboard.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="mx-auto max-w-4xl">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-ink">Earnings Dashboard</h1>
      <p class="mt-1 text-sm text-muted">Track your income and completed jobs</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BaseSkeleton v-for="i in 4" :key="i" class="h-32 rounded-card" />
      </div>
      <BaseSkeleton class="h-40 rounded-card" />
    </div>

    <!-- Error State -->
    <EmptyState v-else-if="error" title="Couldn't load dashboard" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action>
        <BaseButton variant="secondary" @click="load">Try again</BaseButton>
      </template>
    </EmptyState>

    <!-- Dashboard Content -->
    <div v-else class="space-y-6">
      <!-- Earnings Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="stat in stats"
          :key="stat.key"
          class="rounded-card border border-line bg-base p-4 transition-shadow hover:shadow-sm"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium uppercase tracking-wide text-muted">{{ stat.label }}</p>
              <p class="mt-2 text-2xl font-extrabold text-ink">
                {{ formatKES(dashboard[stat.key] || 0) }}
              </p>
            </div>
            <div :class="[stat.bgColor, 'grid h-10 w-10 shrink-0 place-items-center rounded-full']">
              <component :is="stat.icon" :class="[stat.color, 'h-5 w-5']" />
            </div>
          </div>
        </article>
      </div>

      <!-- Total Jobs Card -->
      <div class="rounded-card border border-line bg-gradient-to-br from-brand/5 to-transparent p-6">
        <div class="flex items-center gap-4">
          <div class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand/10">
            <Briefcase class="h-7 w-7 text-brand" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-muted">Total Completed Jobs</p>
            <p class="mt-1 text-3xl font-extrabold text-ink">{{ dashboard.total_jobs || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Empty State for No Earnings -->
      <div 
        v-if="!dashboard.total_jobs && !loading"
        class="rounded-card border border-line bg-surface p-8 text-center"
      >
        <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-muted/20">
          <Wallet class="h-8 w-8 text-muted" />
        </div>
        <h3 class="mt-4 text-lg font-bold text-ink">No earnings yet</h3>
        <p class="mt-2 text-sm text-muted">
          Complete bookings and collect payments to start earning. Your earnings will appear here.
        </p>
      </div>

      <!-- Top Performing Services Placeholder -->
      <div class="rounded-card border border-line border-dashed bg-surface p-6">
        <div class="flex items-center gap-3">
          <TrendingUp class="h-5 w-5 text-muted" />
          <div>
            <h3 class="text-sm font-semibold text-ink">Top Performing Services</h3>
            <p class="mt-0.5 text-xs text-muted">Coming soon - Track which services earn the most</p>
          </div>
        </div>
      </div>

      <!-- Info Note -->
      <div class="rounded-card bg-brand/5 px-4 py-3 text-sm text-ink">
        <p class="font-semibold">💡 Note:</p>
        <p class="mt-1 text-muted">
          Earnings shown are after the 20% platform fee deduction. All amounts represent what you receive.
        </p>
      </div>
    </div>
  </section>
</template>
