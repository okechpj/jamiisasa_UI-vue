<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { AlertTriangle, Briefcase, CalendarClock, Inbox, Wallet, X, Plus } from 'lucide-vue-next'
import { RouterLink, useRouter } from 'vue-router'

import * as authApi from '@/api/auth.api'
import * as postApi from '@/api/post.api'
import * as likeApi from '@/api/like.api'
import * as commentApi from '@/api/comment.api'
import * as connectionApi from '@/api/connection.api'
import { useAuthStore } from '@/stores/auth.store'
import { useConnectionStore } from '@/stores/connection.store'
import { useToast } from '@/composables/useToast'
import { usePwaStore } from '@/stores/pwa.store'
import { relativeTime } from '@/lib/time'
import { extractError } from '@/lib/errors'
import { resolveMediaUrl } from '@/lib/storage'

import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfilePostsPanel from '@/components/profile/ProfilePostsPanel.vue'
import CommentsModal from '@/components/feed/CommentsModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import MyBookingsView from '@/views/bookings/MyBookingsView.vue'

const props = defineProps({
  id: { type: String, default: '' },
})

const auth = useAuthStore()
const connections = useConnectionStore()
const toast = useToast()
const router = useRouter()
const pwaStore = usePwaStore()

const isStandalone = computed(() => {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
})

const showProfileCardLocal = ref(true)

const showProfileInstallCard = computed(() => {
  if (isStandalone.value) return false
  if (!auth.isAuthenticated) return false
  if (!isSelf.value) return false
  return showProfileCardLocal.value
})

function dismissProfileCard() {
  showProfileCardLocal.value = false
}

const isiOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

function installAppFromProfile() {
  if (pwaStore.isInstallable) {
    pwaStore.triggerInstall()
    dismissProfileCard()
  } else {
    if (isiOS()) {
      toast.info("Tap the Share button and select 'Add to Home Screen' to install.", 6000)
    } else {
      toast.info("Tap the browser menu (⋮) and select 'Add to Home Screen' to install.", 6000)
    }
    dismissProfileCard()
  }
}

const toText = (v) => (typeof v === 'string' ? v : '')

const targetId = computed(() => props.id || auth.userId)
const isSelf = computed(() => targetId.value === auth.userId)

// --- State ---------------------------------------------------------------
const user = ref(null)
const posts = ref([])
const loading = ref(false)
const postsLoading = ref(false)
const error = ref('')
const connectStatus = ref('none')

const profileName = computed(() => {
  const u = user.value || {}
  return [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || toText(u.username) || 'User'
})
const connectionCount = computed(() => (isSelf.value ? connections.connectionCount : null))
const showMobileTabs = computed(() => isSelf.value)
const showProviderTab = computed(() => isSelf.value && auth.role === 'provider')

const mobileTabs = computed(() => {
  const tabs = [
    { key: 'posts', label: 'My Posts' },
    { key: 'orders', label: 'My Orders' },
  ]

  if (showProviderTab.value) {
    tabs.push({ key: 'provider', label: 'Provider' })
  }

  return tabs
})

const activeMobileTab = ref('posts')

watch(
  () => mobileTabs.value.map((tab) => tab.key).join('|'),
  () => {
    if (!mobileTabs.value.some((tab) => tab.key === activeMobileTab.value)) {
      activeMobileTab.value = 'posts'
    }
  },
  { immediate: true },
)

function mapPost(raw = {}) {
  return {
    id: toText(raw.id),
    authorId: toText(raw.user_id),
    authorName: profileName.value,
    authorUsername: toText(user.value && user.value.username),
    authorAvatar: resolveMediaUrl((raw.author && raw.author.profile_picture_url) || (user.value && user.value.profile_picture_url)),
    content: toText(raw.content),
    mediaUrl: resolveMediaUrl(raw.media_url),
    mediaType: toText(raw.media_type),
    category: toText(raw.category),
    likes: typeof raw.likes_count === 'number' ? raw.likes_count : 0,
    comments: typeof raw.comments_count === 'number' ? raw.comments_count : 0,
    liked: raw.is_liked === true,
    timeAgo: relativeTime(raw.created_at),
    // Per-post connect is redundant on a profile; the header owns it.
    connectStatus: 'self',
  }
}

// --- Load ----------------------------------------------------------------
async function loadProfile() {
  error.value = ''
  loading.value = true
  try {
    if (isSelf.value) {
      user.value = auth.user || (await auth.fetchMe())
      if (isSelf.value) connections.fetchConnections()
    } else {
      user.value = await authApi.getUser(targetId.value)
      await resolveConnectStatus()
    }
  } catch (e) {
    error.value = extractError(e, 'Could not load this profile.')
  } finally {
    loading.value = false
  }
}

async function loadPosts() {
  postsLoading.value = true
  try {
    const list = await postApi.getUserPosts(targetId.value)
    posts.value = list.map(mapPost)
  } catch {
    posts.value = []
  } finally {
    postsLoading.value = false
  }
}

async function resolveConnectStatus() {
  try {
    const statuses = await connectionApi.getStatuses()
    const match = statuses.find((s) => toText(s.user_id) === targetId.value)
    if (match) connectStatus.value = match.status === 'accepted' ? 'connected' : 'pending'
    else connectStatus.value = 'none'
  } catch {
    connectStatus.value = 'none'
  }
}

async function load() {
  posts.value = []
  connectStatus.value = 'none'
  await loadProfile()
  await loadPosts()
}

onMounted(load)
watch(() => props.id, load)

// --- Header connect ------------------------------------------------------
async function onConnect() {
  if (connectStatus.value !== 'none') return
  connectStatus.value = 'sending'
  const ok = await connections.sendRequest(targetId.value)
  if (ok) {
    connectStatus.value = 'pending'
    toast.success('Connection request sent.')
  } else {
    connectStatus.value = 'none'
    toast.error(connections.error || 'Could not send the request.')
  }
}

function onLogout() {
  try {
    auth.logout()
    toast.success('Logged out.')
    router.push('/')
  } catch (e) {
    toast.error('Could not log out.')
  }
}

// --- Post interactions ---------------------------------------------------
function toggleLike(postId) {
  const t = posts.value.find((p) => p.id === postId)
  if (!t || !auth.userId) return
  const prevLiked = t.liked
  const prevLikes = t.likes
  t.liked = !prevLiked
  t.likes = Math.max(0, prevLikes + (t.liked ? 1 : -1))
  const req = t.liked ? likeApi.likePost(postId, auth.userId) : likeApi.unlikePost(postId, auth.userId)
  req.catch(() => {
    t.liked = prevLiked
    t.likes = prevLikes
  })
}

// Comments (loaded on demand via the API directly).
const commentsOpen = ref(false)
const activePostId = ref('')
const activeComments = ref([])
const commentsLoading = ref(false)
const commentsError = ref('')

function mapComment(raw = {}) {
  const a = raw.author || {}
  const full = [a.first_name, a.last_name].filter(Boolean).join(' ').trim()
  return {
    id: toText(raw.id),
    authorName: full || toText(a.username) || `user-${toText(raw.user_id).slice(0, 6)}`,
    authorAvatar: resolveMediaUrl(a.profile_picture_url),
    content: toText(raw.content),
    timeAgo: relativeTime(raw.created_at),
  }
}

async function openComments(postId) {
  activePostId.value = postId
  commentsOpen.value = true
  commentsError.value = ''
  commentsLoading.value = true
  try {
    activeComments.value = (await commentApi.getComments(postId)).map(mapComment)
  } catch (e) {
    commentsError.value = extractError(e, 'Could not load comments.')
  } finally {
    commentsLoading.value = false
  }
}

async function addComment(body, done) {
  try {
    await commentApi.createComment({ post_id: activePostId.value, user_id: auth.userId, content: body })
    activeComments.value = (await commentApi.getComments(activePostId.value)).map(mapComment)
    const t = posts.value.find((p) => p.id === activePostId.value)
    if (t) t.comments += 1
    done(true)
  } catch (e) {
    commentsError.value = extractError(e, 'Could not post your comment.')
    done(false)
  }
}

const providerQuickLinks = [
  {
    name: 'provider-profile',
    title: 'Provider Profile',
    description: 'Update your business profile and visibility.',
    icon: Briefcase,
  },
  {
    name: 'provider-services',
    title: 'Services Management',
    description: 'Create, edit, and remove your service listings.',
    icon: Briefcase,
  },
  {
    name: 'provider-availability',
    title: 'Availability Management',
    description: 'Manage your slots and working schedule.',
    icon: CalendarClock,
  },
  {
    name: 'provider-bookings',
    title: 'Incoming Service Requests',
    description: 'Review and respond to customer orders.',
    icon: Inbox,
  },
  {
    name: 'provider-earnings',
    title: 'Provider Earnings Dashboard',
    description: 'Track completed orders and payouts.',
    icon: Wallet,
  },
]
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <!-- Profile header -->
    <div v-if="loading && !user" class="rounded-card border border-line bg-base p-6">
      <div class="flex items-center gap-5">
        <BaseSkeleton class="h-20 w-20 rounded-full" />
        <div class="flex-1 space-y-2">
          <BaseSkeleton class="h-5 w-40" />
          <BaseSkeleton class="h-3.5 w-24" />
        </div>
      </div>
    </div>

    <EmptyState v-else-if="error" title="Couldn't load profile" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action><BaseButton variant="secondary" @click="load">Try again</BaseButton></template>
    </EmptyState>

    <template v-else-if="user">
      <!-- PWA Inline Install Card -->
      <div 
        v-if="showProfileInstallCard" 
        class="relative mb-4 rounded-card border border-line bg-base p-5 shadow-sm"
      >
        <!-- Close button -->
        <button 
          type="button" 
          @click="dismissProfileCard" 
          class="absolute top-4 right-4 text-muted hover:text-ink transition-colors p-1"
          aria-label="Close install card"
        >
          <X class="h-4 w-4" />
        </button>

        <!-- App branding header info -->
        <div class="flex items-center gap-3.5">
          <img src="/icon-192.png" alt="Logo" class="h-12 w-12 shrink-0 rounded-xl object-contain bg-base shadow-md border border-line" />
          <div class="min-w-0 flex-1">
            <h3 class="text-sm font-bold text-ink leading-snug">Install Jamii Sasa</h3>
            <p class="text-xs text-muted mt-0.5">🤖 Mobile · Add to your home screen for quick access</p>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2.5 mt-5">
          <button 
            type="button" 
            @click="dismissProfileCard"
            class="flex-1 py-3 text-xs font-bold border border-line rounded-xl text-ink bg-base hover:bg-surface transition"
          >
            Not now
          </button>
          <button 
            type="button" 
            @click="installAppFromProfile"
            class="flex-1 py-3 text-xs font-bold rounded-xl text-white bg-[#d97706] hover:bg-[#b45309] shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <Plus class="h-3.5 w-3.5 stroke-[3px]" />
            Install App
          </button>
        </div>
      </div>

      <ProfileHeader
        :user="user"
        :is-self="isSelf"
        :post-count="posts.length"
        :connection-count="connectionCount"
        :connect-status="connectStatus"
        @connect="onConnect"
      >
        <template #stats-right>
          <div v-if="isSelf" class="md:hidden">
            <BaseButton variant="ghost" @click="onLogout">Log out</BaseButton>
          </div>
        </template>
      </ProfileHeader>

      <!-- Mobile Facebook-style tabs -->
      <div v-if="showMobileTabs" class="mt-5 md:hidden">
        <div class="sticky top-14 z-10 -mx-4 border-b border-line bg-surface/95 px-4 backdrop-blur">
          <div class="-mx-1 flex gap-1 overflow-x-auto px-1 scrollbar-none">
            <button
              v-for="tab in mobileTabs"
              :key="tab.key"
              type="button"
              class="whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
              :class="activeMobileTab === tab.key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'"
              @click="activeMobileTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="pt-4">
          <div v-if="isSelf" class="mb-3 md:hidden flex justify-end px-4">
            <BaseButton variant="ghost" @click="onLogout">Log out</BaseButton>
          </div>
          <section v-if="activeMobileTab === 'posts'">
            <ProfilePostsPanel
              :posts="posts"
              :loading="postsLoading"
              :is-self="isSelf"
              @like="toggleLike"
              @comment="openComments"
            />
          </section>

          <section v-else-if="activeMobileTab === 'orders'">
            <MyBookingsView />
          </section>

          <section v-else class="space-y-4">
            <div class="rounded-card border border-line bg-base p-4">
              <h2 class="text-sm font-bold text-ink">Provider dashboard</h2>
              <p class="mt-1 text-sm text-muted">Jump into the tools you already use on desktop.</p>
            </div>

            <div class="grid gap-3">
              <RouterLink
                v-for="item in providerQuickLinks"
                :key="item.name"
                :to="{ name: item.name }"
                class="flex items-center gap-3 rounded-card border border-line bg-base p-4 transition-colors hover:bg-surface"
              >
                <div class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <component :is="item.icon" class="h-5 w-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-ink">{{ item.title }}</p>
                  <p class="mt-0.5 text-xs text-muted">{{ item.description }}</p>
                </div>
              </RouterLink>
            </div>
          </section>
        </div>
      </div>

      <!-- Desktop posts (unchanged) -->
      <div class="hidden md:block">
        <h2 class="mb-3 mt-6 text-sm font-bold text-ink">Posts</h2>
        <ProfilePostsPanel
          :posts="posts"
          :loading="postsLoading"
          :is-self="isSelf"
          @like="toggleLike"
          @comment="openComments"
        />
      </div>
    </template>

    <CommentsModal
      v-model:open="commentsOpen"
      :comments="activeComments"
      :loading="commentsLoading"
      :error="commentsError"
      @submit="addComment"
    />
  </section>
</template>
