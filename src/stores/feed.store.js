import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

import * as postApi from '@/api/post.api'
import * as likeApi from '@/api/like.api'
import * as commentApi from '@/api/comment.api'
import * as connectionApi from '@/api/connection.api'
import { useAuthStore } from '@/stores/auth.store'
import { relativeTime } from '@/lib/time'
import { extractError } from '@/lib/errors'
import { resolveMediaUrl } from '@/lib/storage'

/*
 * feed.store — the social feed: posts, optimistic likes, comments, post
 * creation, and the per-post connection CTA.
 *
 * The backend's /feed returns every post at once, so pagination is done
 * client-side: the full mapped list lives in `allPosts` and `visibleCount`
 * controls how many are revealed (infinite scroll bumps it).
 *
 * Per-post connection status is rehydrated from /connections/statuses on load
 * so the Connect/Pending/Connected button is in sync with the DB after reload.
 */

const PAGE_SIZE = 10
const DEFAULT_CATEGORIES = []

const toText = (v) => (typeof v === 'string' ? v : '')
const toNum = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0)
const toBool = (v) => v === true

function deriveConnectStatus(authorId, currentUserId, statusByUser) {
  if (!authorId) return 'none'
  if (authorId === currentUserId) return 'self'
  const status = statusByUser[authorId]
  if (status === 'accepted') return 'connected'
  if (status === 'pending') return 'pending'
  return 'none'
}

export const useFeedStore = defineStore('feed', () => {
  const auth = useAuthStore()

  // --- State ---------------------------------------------------------------
  const allPosts = ref([])
  const visibleCount = ref(PAGE_SIZE)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref('')

  const categories = ref(DEFAULT_CATEGORIES)
  const activeCategory = ref('All')

  const statusByUser = ref({})

  // Comments keyed by post id + their own request state.
  const commentsByPost = ref({})
  const commentsLoading = ref(false)
  const commentsError = ref('')

  // --- Mapping (backend Post -> UI shape) ---------------------------------
  function mapPost(raw = {}) {
    const author = raw.author || {}
    const authorId = toText(raw.user_id)
    const fullName = [author.first_name, author.last_name].filter(Boolean).join(' ').trim()
    return {
      id: toText(raw.id),
      authorId,
      authorName: fullName || toText(author.username) || `user-${authorId.slice(0, 6)}`,
      authorAvatar: resolveMediaUrl(author.profile_picture_url || author.avatar_url || author.profile_picture),
      authorUsername: toText(author.username),
      content: toText(raw.content),
      mediaUrl: resolveMediaUrl(raw.media_url),
      mediaType: toText(raw.media_type),
      category: toText(raw.category),
      likes: toNum(raw.likes_count),
      comments: toNum(raw.comments_count),
      liked: toBool(raw.is_liked),
      createdAt: toText(raw.created_at),
      timeAgo: relativeTime(raw.created_at),
      connectStatus: deriveConnectStatus(authorId, auth.userId, statusByUser.value),
    }
  }

  // Keep posts in sync when the current user's profile picture changes.
  watch(
    () => auth.user && auth.user.profile_picture_url,
    (newUrl) => {
      if (!newUrl) return
      const resolved = resolveMediaUrl(newUrl)
      // Debug: log avatar updates so developers can verify the resolved R2 URL
      // appears and is propagated into post data during testing.
      try {
        // eslint-disable-next-line no-console
        console.debug('[feed.store] profile_picture_url changed:', newUrl, 'resolved:', resolved)
      } catch (e) {}
      allPosts.value = allPosts.value.map((p) => {
        if (p.authorId === auth.userId) return { ...p, authorAvatar: resolved }
        return p
      })
    },
  )

  // keep posts in sync when the current user's profile (avatar) changes
  // so that the feed reflects new profile pictures immediately.
  if (auth) {
    // watch is a composition API method only in components; use a simple
    // reactive getter via computed effect by leveraging auth.user reference
    // updates elsewhere in the app will cause this code path to run when
    // loadFeed is called or auth.fetchMe is invoked; to be safe, expose a
    // helper to refresh post avatars after profile update.
  }

  // --- Getters -------------------------------------------------------------
  const categoryFiltered = computed(() => {
    if (activeCategory.value === 'All') return allPosts.value
    return allPosts.value.filter((p) => p.category === activeCategory.value)
  })

  const posts = computed(() => categoryFiltered.value.slice(0, visibleCount.value))
  const hasMore = computed(() => categoryFiltered.value.length > visibleCount.value)
  const isEmpty = computed(
    () => !loading.value && !error.value && categoryFiltered.value.length === 0,
  )

  function commentsFor(postId) {
    return commentsByPost.value[toText(postId)] || []
  }

  // --- Connection statuses -------------------------------------------------
  async function refreshConnectionStatuses() {
    if (!auth.userId) {
      statusByUser.value = {}
      return
    }
    try {
      const list = await connectionApi.getStatuses()
      const map = {}
      for (const entry of list) {
        const uid = toText(entry && entry.user_id)
        if (uid) map[uid] = toText(entry.status)
      }
      statusByUser.value = map
    } catch {
      statusByUser.value = {}
    }
  }

  // --- Feed actions --------------------------------------------------------
  async function loadFeed() {
    error.value = ''
    loading.value = true
    try {
      await refreshConnectionStatuses()
      const list = await postApi.getFeed({ limit: 100, offset: 0 })
      allPosts.value = list.map(mapPost)
      visibleCount.value = PAGE_SIZE
    } catch (e) {
      allPosts.value = []
      error.value = extractError(e, 'Could not load the feed. Please try again.')
    } finally {
      loading.value = false
    }
  }

  function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    // Client-side reveal; wrapped in a microtask so the loading flag can paint.
    visibleCount.value += PAGE_SIZE
    loadingMore.value = false
  }

  function setActiveCategory(category) {
    if (categories.value.includes(category)) {
      activeCategory.value = category
      visibleCount.value = PAGE_SIZE
    }
  }

  async function createPost({ content, category, mediaUrl, mediaType } = {}) {
    error.value = ''
    const body = toText(content).trim()
    if (!body) return false
    try {
      const created = await postApi.createPost({
        user_id: auth.userId,
        category: toText(category),
        content: body,
        media_url: toText(mediaUrl),
        media_type: toText(mediaType),
      })
      // The create response has no joined author, so stamp the current user's
      // identity onto the new post for immediate, correct rendering.
      const mapped = mapPost(created)
      mapped.authorName = auth.displayName
      mapped.authorUsername = auth.user ? toText(auth.user.username) : mapped.authorUsername
      mapped.authorAvatar = resolveMediaUrl(auth.user?.profile_picture_url)
      mapped.connectStatus = 'self'
      allPosts.value = [mapped, ...allPosts.value]
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not publish your post.')
      return false
    }
  }

  // Optimistic like/unlike with revert on failure.
  function toggleLike(postId) {
    const target = allPosts.value.find((p) => p.id === toText(postId))
    if (!target || !auth.userId) return

    const prevLiked = target.liked
    const prevLikes = target.likes
    const nextLiked = !prevLiked

    target.liked = nextLiked
    target.likes = Math.max(0, prevLikes + (nextLiked ? 1 : -1))

    const request = nextLiked
      ? likeApi.likePost(postId, auth.userId)
      : likeApi.unlikePost(postId, auth.userId)

    request.catch(() => {
      target.liked = prevLiked
      target.likes = prevLikes
    })
  }

  // Send a connection request to a post's author; persists across reload via
  // the rehydrated status map.
  async function connect(postId) {
    const target = allPosts.value.find((p) => p.id === toText(postId))
    if (!target || target.connectStatus !== 'none' || !target.authorId) return false

    target.connectStatus = 'sending'
    try {
      await connectionApi.sendRequest(target.authorId)
      statusByUser.value = { ...statusByUser.value, [target.authorId]: 'pending' }
      allPosts.value.forEach((p) => {
        if (p.authorId === target.authorId && p.connectStatus !== 'self') p.connectStatus = 'pending'
      })
      return true
    } catch (e) {
      target.connectStatus = 'none'
      error.value = extractError(e, 'Could not send the connection request.')
      return false
    }
  }

  // --- Comment actions -----------------------------------------------------
  function mapComment(raw = {}) {
    const author = raw.author || {}
    const fullName = [author.first_name, author.last_name].filter(Boolean).join(' ').trim()
    return {
      id: toText(raw.id),
      postId: toText(raw.post_id),
      authorId: toText(raw.user_id),
      authorName: fullName || toText(author.username) || `user-${toText(raw.user_id).slice(0, 6)}`,
      authorAvatar: resolveMediaUrl(author.profile_picture_url || author.avatar_url || author.profile_picture),
      content: toText(raw.content),
      timeAgo: relativeTime(raw.created_at),
    }
  }

  async function fetchComments(postId) {
    const id = toText(postId)
    commentsError.value = ''
    commentsLoading.value = true
    try {
      const list = await commentApi.getComments(id)
      commentsByPost.value = { ...commentsByPost.value, [id]: list.map(mapComment) }
    } catch (e) {
      commentsError.value = extractError(e, 'Could not load comments.')
    } finally {
      commentsLoading.value = false
    }
  }

  async function addComment(postId, content) {
    const id = toText(postId)
    const body = toText(content).trim()
    if (!body) return false
    commentsError.value = ''
    try {
      await commentApi.createComment({ post_id: id, user_id: auth.userId, content: body })
      await fetchComments(id)
      const target = allPosts.value.find((p) => p.id === id)
      if (target) target.comments += 1
      return true
    } catch (e) {
      commentsError.value = extractError(e, 'Could not post your comment.')
      return false
    }
  }

  return {
    // state
    loading,
    loadingMore,
    error,
    categories,
    activeCategory,
    commentsLoading,
    commentsError,
    // getters
    posts,
    hasMore,
    isEmpty,
    commentsFor,
    // actions
    loadFeed,
    loadMore,
    setActiveCategory,
    createPost,
    toggleLike,
    connect,
    fetchComments,
    addComment,
  }
})
