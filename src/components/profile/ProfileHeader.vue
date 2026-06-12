<script setup>
import { computed } from 'vue'

import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  user: { type: Object, default: () => ({}) },
  isSelf: { type: Boolean, default: false },
  postCount: { type: Number, default: 0 },
  connectionCount: { type: Number, default: null }, // null => unknown (other users)
  connectStatus: { type: String, default: 'none' }, // none | sending | pending | connected
})

defineEmits(['connect'])

const displayName = computed(() => {
  const u = props.user || {}
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  return full || u.username || 'User'
})

const connectLabel = computed(() => {
  if (props.connectStatus === 'connected') return 'Connected'
  if (props.connectStatus === 'pending' || props.connectStatus === 'sending') return 'Pending'
  return 'Connect'
})
</script>

<template>
  <div class="rounded-card border border-line bg-base p-5 sm:p-6">
    <div class="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
      <BaseAvatar :name="displayName" :src="user.profile_picture_url" size="xl" />

      <div class="mt-3 min-w-0 flex-1 sm:mt-0">
        <div class="flex flex-col items-center gap-1.5 sm:flex-row sm:items-center">
          <h1 class="truncate text-xl font-bold text-ink">{{ displayName }}</h1>
          <BaseBadge v-if="user.role" variant="brand" class="capitalize">{{ user.role }}</BaseBadge>
        </div>
        <p v-if="user.username" class="text-sm text-muted">@{{ user.username }}</p>
        <p v-if="isSelf && user.email" class="text-sm text-muted">{{ user.email }}</p>
      </div>

      <div v-if="!isSelf" class="mt-4 sm:mt-0">
        <BaseButton
          :variant="connectStatus === 'none' ? 'primary' : 'outline'"
          :disabled="connectStatus !== 'none'"
          :loading="connectStatus === 'sending'"
          @click="$emit('connect')"
        >
          {{ connectLabel }}
        </BaseButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="mt-5 flex gap-6 border-t border-line pt-4">
      <div>
        <span class="text-lg font-bold text-ink">{{ postCount }}</span>
        <span class="ml-1 text-sm text-muted">Posts</span>
      </div>
      <div v-if="connectionCount !== null">
        <span class="text-lg font-bold text-ink">{{ connectionCount }}</span>
        <span class="ml-1 text-sm text-muted">Connections</span>
      </div>
    </div>
  </div>
</template>
