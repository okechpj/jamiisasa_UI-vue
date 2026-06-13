<script setup>
import { computed } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { Compass, Users, UserPlus, User, Plus, LogOut, Store, Briefcase, CalendarClock, CalendarCheck, IdCard, Inbox, Wallet } from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth.store'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import { resolveMediaUrl } from '@/lib/storage'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isProvider = computed(() => auth.role === 'provider' || auth.role === 'admin')

// Primary nav — shown in the desktop sidebar and the mobile bottom bar.
// The mobile bar splits these around a centered create (+) FAB.
const primaryNav = [
  { name: 'feed', label: 'Discovery', icon: Compass },
  { name: 'marketplace-providers', label: 'Marketplace', icon: Store },
  { name: 'connections', label: 'Connections', icon: Users },
  { name: 'profile', label: 'Profile', icon: User },
]

// Desktop-only secondary links.
const secondaryNav = [
  { name: 'pending-requests', label: 'Requests', icon: UserPlus },
  { name: 'my-bookings', label: 'My Bookings', icon: CalendarCheck },
]

// Provider dashboard — only for providers/admins.
const providerNav = [
  { name: 'provider-profile', label: 'My Profile', icon: IdCard },
  { name: 'provider-services', label: 'My Services', icon: Briefcase },
  { name: 'provider-availability', label: 'My Availability', icon: CalendarClock },
  { name: 'provider-bookings', label: 'Bookings', icon: Inbox },
  { name: 'provider-earnings', label: 'Earnings', icon: Wallet },
]

const activeName = computed(() => route.name)
const linkClass = (name) =>
  activeName.value === name ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-base hover:text-ink'

function onCreate() {
  router.push({ name: 'feed', query: { compose: '1' } })
}

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-dvh bg-surface">
    <!-- Mobile top app bar -->
    <header class="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-base/95 px-4 py-3 backdrop-blur md:hidden">
      <RouterLink :to="{ name: 'feed' }" class="text-lg font-bold tracking-tight text-brand">Jamii Sasa</RouterLink>
    </header>

    <div class="mx-auto flex w-full max-w-6xl gap-6 px-4 lg:px-6">
      <!-- Desktop left sidebar -->
      <aside class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto py-6 md:flex">
        <RouterLink :to="{ name: 'feed' }" class="mb-8 flex items-center gap-2 px-2">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand text-sm font-bold text-white">JS</span>
          <span class="text-lg font-bold tracking-tight text-ink">Jamii Sasa</span>
        </RouterLink>

        <nav class="flex flex-1 flex-col gap-1">
          <RouterLink
            v-for="item in [...primaryNav, ...secondaryNav]"
            :key="item.name"
            :to="{ name: item.name }"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
            :class="linkClass(item.name)"
          >
            <component :is="item.icon" class="h-5 w-5" />
            {{ item.label }}
          </RouterLink>

          <!-- Provider dashboard -->
          <template v-if="isProvider">
            <p class="mt-4 px-3 text-xs font-bold uppercase tracking-wide text-muted">Provider</p>
            <RouterLink
              v-for="item in providerNav"
              :key="item.name"
              :to="{ name: item.name }"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
              :class="linkClass(item.name)"
            >
              <component :is="item.icon" class="h-5 w-5" />
              {{ item.label }}
            </RouterLink>
          </template>
        </nav>

        <!-- Current user + logout -->
        <div class="mt-2 border-t border-line pt-3">
          <RouterLink :to="{ name: 'profile' }" class="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-base">
            <BaseAvatar :name="auth.displayName" :src="resolveMediaUrl(auth.user?.profile_picture_url)" size="sm" />
            <span class="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{{ auth.displayName }}</span>
          </RouterLink>
          <button
            type="button"
            class="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-base hover:text-danger"
            @click="logout"
          >
            <LogOut class="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="min-w-0 flex-1 py-4 pb-24 md:py-6 md:pb-6">
        <RouterView />
      </main>

      <!-- Desktop right sidebar -->
      <aside class="sticky top-0 hidden h-dvh w-72 shrink-0 py-6 lg:block">
        <div class="rounded-card border border-line bg-base p-4">
          <h2 class="text-sm font-bold text-ink">Activity</h2>
          <p class="mt-2 text-sm text-muted">Suggestions and activity will appear here.</p>
        </div>
      </aside>
    </div>

    <!-- Mobile bottom navigation with a centered create (+) FAB -->
    <nav class="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-base/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div class="flex items-stretch justify-around px-1">
        <RouterLink
          v-for="item in primaryNav.slice(0, 2)"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
          :class="activeName === item.name ? 'text-brand' : 'text-muted'"
        >
          <component :is="item.icon" class="h-5 w-5" />
          {{ item.label }}
        </RouterLink>

        <!-- Centered raised create button -->
        <div class="flex w-16 shrink-0 items-start justify-center">
          <button
            type="button"
            aria-label="Create post"
            class="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg ring-4 ring-surface transition-transform hover:scale-105"
            @click="onCreate"
          >
            <Plus class="h-6 w-6" />
          </button>
        </div>

        <RouterLink
          v-for="item in primaryNav.slice(2)"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
          :class="activeName === item.name ? 'text-brand' : 'text-muted'"
        >
          <component :is="item.icon" class="h-5 w-5" />
          {{ item.label }}
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
