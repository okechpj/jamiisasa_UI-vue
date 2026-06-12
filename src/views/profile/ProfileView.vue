<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { AlertTriangle, FileText } from 'lucide-vue-next'

import * as authApi from '@/api/auth.api'
import * as postApi from '@/api/post.api'
import * as likeApi from '@/api/like.api'
import * as commentApi from '@/api/comment.api'
import * as connectionApi from '@/api/connection.api'
import { useAuthStore } from '@/stores/auth.store'
import { useConnectionStore } from '@/stores/connection.store'
import { useToast } from '@/composables/useToast'
import { relativeTime } from '@/lib/time'
import { extractError } from '@/lib/errors'

import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import PostCard from '@/components/feed/PostCard.vue'
import PostCardSkeleton from '@/components/feed/PostCardSkeleton.vue'
import CommentsModal from '@/components/feed/CommentsModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const props = defineProps({
  id: { type: String, default: '' },
})

const auth = useAuthStore()
const connections = useConnectionStore()
const toast = useToast()

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

function mapPost(raw = {}) {
  return {
    id: toText(raw.id),
    authorId: toText(raw.user_id),
    authorName: profileName.value,
    authorUsername: toText(user.value && user.value.username),
    content: toText(raw.content),
    mediaUrl: toText(raw.media_url),
    mediaType: toText(raw.media_type),
    category: toText(raw.category) || 'JamiiLiza',
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
      <ProfileHeader
        :user="user"
        :is-self="isSelf"
        :post-count="posts.length"
        :connection-count="connectionCount"
        :connect-status="connectStatus"
        @connect="onConnect"
      />

      <!-- Posts -->
      <h2 class="mb-3 mt-6 text-sm font-bold text-ink">Posts</h2>

      <div v-if="postsLoading" class="space-y-4">
        <PostCardSkeleton v-for="i in 2" :key="i" />
      </div>

      <EmptyState
        v-else-if="!posts.length"
        :title="isSelf ? 'You haven\'t posted yet' : 'No posts yet'"
        :description="isSelf ? 'Share something from the feed.' : ''"
      >
        <template #icon><FileText class="h-6 w-6" /></template>
      </EmptyState>

      <div v-else class="space-y-4">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
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
