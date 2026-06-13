<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Heart, MessageCircle, Share2 } from 'lucide-vue-next'

import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps({
  post: { type: Object, required: true },
})

const emit = defineEmits(['like', 'comment', 'connect'])

// Local like persistence to keep liked state across reloads (client-side)
const localLiked = ref(false)
const lsKey = (id) => `post-liked:${id}`

// initialize localLiked from localStorage or server prop
localLiked.value = (() => {
  try {
    const v = localStorage.getItem(lsKey(props.post.id))
    if (v !== null) return v === '1'
  } catch (e) {}
  return !!props.post.liked
})()

watch(
  () => props.post.liked,
  (nv) => {
    // if server reports liked and we have no stored override, keep in sync
    try {
      const stored = localStorage.getItem(lsKey(props.post.id))
      if (stored === null) {
        localLiked.value = !!nv
      }
    } catch (e) {}
  },
)

watch(localLiked, (val) => {
  try {
    localStorage.setItem(lsKey(props.post.id), val ? '1' : '0')
  } catch (e) {}
})

const displayedLikes = computed(() => {
  const base = Number(props.post.likes || 0)
  // adjust count if local state differs from server-provided state
  if (props.post.liked && !localLiked.value) return Math.max(0, base - 1)
  if (!props.post.liked && localLiked.value) return base + 1
  return base
})

function handleLike() {
  // toggle local state immediately for optimistic UI
  localLiked.value = !localLiked.value
  emit('like', props.post.id)
}

const connectLabel = computed(() => {
  if (props.post.connectStatus === 'connected') return 'Connected'
  if (props.post.connectStatus === 'pending' || props.post.connectStatus === 'sending') return 'Pending'
  return 'Connect'
})

// Split body so hashtags can be tinted.
const segments = computed(() =>
  (props.post.content || '')
    .split(/(\s+)/)
    .map((token) => ({ token, isTag: token.startsWith('#') && token.length > 1 })),
)
</script>

<template>
  <article class="w-full bg-transparent border-transparent p-3 sm:rounded-card sm:border sm:border-line sm:bg-base sm:p-5 sm:transition-shadow sm:hover:shadow-sm">
    <!-- Header -->
    <header class="flex items-center gap-3">
      <RouterLink :to="{ name: 'user-profile', params: { id: post.authorId } }">
        <BaseAvatar :name="post.authorName" :src="post.authorAvatar" size="md" />
      </RouterLink>
      <div class="min-w-0 flex-1">
        <RouterLink
          :to="{ name: 'user-profile', params: { id: post.authorId } }"
          class="block truncate text-sm font-bold text-ink hover:text-brand"
        >
          {{ post.authorName }}
        </RouterLink>
        <p class="text-xs text-muted">{{ post.timeAgo }}</p>
      </div>
      <BaseBadge variant="brand">{{ post.category }}</BaseBadge>
    </header>

    <!-- Body -->
    <p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">
      <template v-for="(seg, i) in segments" :key="i">
        <span v-if="seg.isTag" class="font-semibold text-brand-light">{{ seg.token }}</span>
        <template v-else>{{ seg.token }}</template>
      </template>
    </p>

    <!-- Media (force 4:5 aspect ratio -- 1080x1350) -->
    <div v-if="post.mediaUrl" class="mt-3 overflow-hidden rounded-none sm:rounded-xl sm:border sm:border-line sm:bg-surface aspect-[4/5]">
      <img :src="post.mediaUrl" :alt="`${post.authorName}'s media`" class="h-full w-full object-cover" loading="lazy" width="1080" height="1350" />
    </div>

    <!-- Actions -->
    <footer class="mt-3 flex items-center justify-between">
      <div class="flex items-center gap-5 text-muted">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          :class="localLiked ? 'text-danger' : 'text-muted hover:text-ink'"
          @click="handleLike"
        >
          <Heart class="h-5 w-5" :fill="localLiked ? 'currentColor' : 'none'" />
          {{ displayedLikes }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-brand"
          @click="$emit('comment', post.id)"
        >
          <MessageCircle class="h-5 w-5" />
          {{ post.comments }}
        </button>
        <span class="inline-flex items-center gap-1.5 text-sm font-semibold">
          <Share2 class="h-5 w-5" />
        </span>
      </div>

      <template>
        <button
          v-if="post.connectStatus === 'none'"
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-bold transition-opacity bg-brand-light text-white hover:opacity-90"
          @click="$emit('connect', post.id)"
        >
          {{ connectLabel }}
        </button>

        <span v-else-if="post.connectStatus === 'pending' || post.connectStatus === 'sending'" class="text-sm font-semibold text-muted">
          {{ connectLabel }}
        </span>
        <!-- if connected, render nothing -->
      </template>
    </footer>
    <!-- Mobile divider (thicker) -->
    <div class="mt-3 sm:hidden">
      <div class="h-1 w-full bg-line opacity-80 rounded-full" />
    </div>
  </article>
</template>
