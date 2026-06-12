<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Heart, MessageCircle, Share2 } from 'lucide-vue-next'

import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps({
  post: { type: Object, required: true },
})

defineEmits(['like', 'comment', 'connect'])

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
  <article class="rounded-card border border-line bg-base p-4 transition-shadow hover:shadow-sm sm:p-5">
    <!-- Header -->
    <header class="flex items-center gap-3">
      <RouterLink :to="{ name: 'user-profile', params: { id: post.authorId } }">
        <BaseAvatar :name="post.authorName" size="md" />
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

    <!-- Media -->
    <div v-if="post.mediaUrl" class="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
      <img :src="post.mediaUrl" :alt="`${post.authorName}'s media`" class="h-auto w-full object-cover" loading="lazy" />
    </div>

    <!-- Actions -->
    <footer class="mt-4 flex items-center justify-between">
      <div class="flex items-center gap-5 text-muted">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-danger"
          :class="post.liked ? 'text-danger' : ''"
          @click="$emit('like', post.id)"
        >
          <Heart class="h-5 w-5" :fill="post.liked ? 'currentColor' : 'none'" />
          {{ post.likes }}
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

      <button
        v-if="post.connectStatus !== 'self'"
        type="button"
        :disabled="post.connectStatus !== 'none'"
        class="rounded-xl px-4 py-2 text-sm font-bold transition-opacity"
        :class="{
          'bg-brand-light text-white hover:opacity-90': post.connectStatus === 'none',
          'border border-brand bg-transparent text-brand': post.connectStatus === 'pending' || post.connectStatus === 'sending',
          'border border-line bg-transparent text-muted': post.connectStatus === 'connected',
        }"
        @click="$emit('connect', post.id)"
      >
        {{ connectLabel }}
      </button>
    </footer>
  </article>
</template>
