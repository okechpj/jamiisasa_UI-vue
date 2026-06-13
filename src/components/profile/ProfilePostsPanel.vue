<script setup>
import { FileText } from 'lucide-vue-next'

import PostCard from '@/components/feed/PostCard.vue'
import PostCardSkeleton from '@/components/feed/PostCardSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

defineProps({
  posts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  isSelf: { type: Boolean, default: false },
  emptyTitle: { type: String, default: '' },
  emptyDescription: { type: String, default: '' },
})

defineEmits(['like', 'comment'])
</script>

<template>
  <div>
    <div v-if="loading && !posts.length" class="space-y-4">
      <PostCardSkeleton v-for="i in 2" :key="i" />
    </div>

    <EmptyState
      v-else-if="!posts.length"
      :title="emptyTitle || (isSelf ? `You haven't posted yet` : 'No posts yet')"
      :description="emptyDescription || (isSelf ? 'Share something from the feed.' : '')"
    >
      <template #icon><FileText class="h-6 w-6" /></template>
    </EmptyState>

    <div v-else class="space-y-4">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @like="$emit('like', $event)"
        @comment="$emit('comment', $event)"
      />
    </div>
  </div>
</template>