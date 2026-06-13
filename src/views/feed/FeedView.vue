<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { PenLine, Inbox, AlertTriangle, Loader2, Search } from 'lucide-vue-next'

import { useFeedStore } from '@/stores/feed.store'
import { useToast } from '@/composables/useToast'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import PostCard from '@/components/feed/PostCard.vue'
import PostCardSkeleton from '@/components/feed/PostCardSkeleton.vue'
import CreatePostModal from '@/components/feed/CreatePostModal.vue'
import CommentsModal from '@/components/feed/CommentsModal.vue'
import FeaturedProviders from '@/components/feed/FeaturedProviders.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const feed = useFeedStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const { posts, hasMore, isEmpty, loading, error, categories, activeCategory, commentsLoading, commentsError } =
  storeToRefs(feed)

onMounted(() => feed.loadFeed())

// --- Search (client-side filter over the loaded feed) --------------------
const searchQuery = ref('')
const visiblePosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return posts.value
  return posts.value.filter(
    (p) => p.content.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q),
  )
})

// --- Infinite scroll -----------------------------------------------------
const sentinel = ref(null)
useInfiniteScroll(sentinel, () => feed.loadMore())

// --- Create post ---------------------------------------------------------
const composerOpen = ref(false)
const submitting = ref(false)

watch(
  () => route.query.compose,
  (val) => {
    if (val) {
      composerOpen.value = true
      router.replace({ query: {} })
    }
  },
  { immediate: true },
)

async function handleCreate(payload) {
  submitting.value = true
  const ok = await feed.createPost(payload)
  submitting.value = false
  if (ok) {
    composerOpen.value = false
    toast.success('Posted!')
  } else {
    toast.error(feed.error || 'Could not publish your post.')
  }
}

// --- Comments ------------------------------------------------------------
const commentsOpen = ref(false)
const activePostId = ref('')
const activeComments = ref([])

function openComments(postId) {
  activePostId.value = postId
  commentsOpen.value = true
  feed.fetchComments(postId)
}

watch(
  () => (activePostId.value ? feed.commentsFor(activePostId.value) : []),
  (list) => {
    activeComments.value = list
  },
  { immediate: true },
)

async function handleAddComment(body, done) {
  const ok = await feed.addComment(activePostId.value, body)
  if (!ok) toast.error(feed.commentsError || 'Could not post your comment.')
  done(ok)
}

// --- Connect -------------------------------------------------------------
async function handleConnect(postId) {
  const ok = await feed.connect(postId)
  if (ok) toast.success('Connection request sent.')
  else if (feed.error) toast.error(feed.error)
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <!-- Search -->
    <div class="relative mb-4">
      <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search Jamii Sasa…"
        class="w-full rounded-xl border border-line bg-base py-2.5 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
      />
    </div>

    <!-- Category tabs -->
    <div class="-mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-line px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        class="whitespace-nowrap border-b-2 px-3 pb-2.5 text-sm font-semibold transition-colors"
        :class="activeCategory === c ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'"
        @click="feed.setActiveCategory(c)"
      >
        {{ c }}
      </button>
    </div>

    <!-- Featured providers carousel -->
    <FeaturedProviders />

    <!-- Compose -->
    <h2 class="mb-3 text-lg font-bold text-ink">Ungana na Jamii</h2>
    <button
      type="button"
      class="mb-5 flex w-full items-center gap-3 rounded-card border border-line bg-base px-4 py-3 text-left text-sm text-muted transition-colors hover:bg-surface"
      @click="composerOpen = true"
    >
      <PenLine class="h-5 w-5 text-brand" />
      Create a post…
    </button>

    <!-- Loading skeletons -->
    <div v-if="loading" class="space-y-4">
      <PostCardSkeleton v-for="i in 4" :key="i" />
    </div>

    <!-- Error -->
    <EmptyState v-else-if="error" title="Couldn't load the feed" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action>
        <BaseButton variant="secondary" @click="feed.loadFeed()">Try again</BaseButton>
      </template>
    </EmptyState>

    <!-- Empty -->
    <EmptyState
      v-else-if="isEmpty"
      title="No posts yet"
      description="Be the first to share something in your neighborhood."
    >
      <template #icon><Inbox class="h-6 w-6" /></template>
      <template #action>
        <BaseButton @click="composerOpen = true">Create a post</BaseButton>
      </template>
    </EmptyState>

    <!-- No search matches -->
    <EmptyState
      v-else-if="!visiblePosts.length"
      title="No matching posts"
      description="Try a different search."
    >
      <template #icon><Search class="h-6 w-6" /></template>
    </EmptyState>

    <!-- Feed -->
    <!-- Mobile: PostCard renders its own subtle divider; desktop keeps spaced cards. -->
    <div v-else class="space-y-0 sm:space-y-4">
      <PostCard
        v-for="post in visiblePosts"
        :key="post.id"
        :post="post"
        @like="feed.toggleLike"
        @comment="openComments"
        @connect="handleConnect"
      />

      <div ref="sentinel" class="py-2">
        <div v-if="hasMore && !searchQuery" class="flex justify-center py-2 text-muted">
          <Loader2 class="h-5 w-5 animate-spin" />
        </div>
        <p v-else-if="!searchQuery" class="py-2 text-center text-xs text-muted">You're all caught up.</p>
      </div>
    </div>

    <!-- Modals -->
    <CreatePostModal
      v-model:open="composerOpen"
      :categories="categories"
      :submitting="submitting"
      @submit="handleCreate"
    />
    <CommentsModal
      v-model:open="commentsOpen"
      :comments="activeComments"
      :loading="commentsLoading"
      :error="commentsError"
      @submit="handleAddComment"
    />
  </section>
</template>
