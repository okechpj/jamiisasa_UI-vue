<script setup>
import { RouterLink } from 'vue-router'
import { Check, X } from 'lucide-vue-next'

import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

defineProps({
  connection: { type: Object, required: true },
  variant: { type: String, default: 'accepted' }, // accepted | pending
  busy: { type: Boolean, default: false },
})

defineEmits(['accept', 'reject'])
</script>

<template>
  <div class="flex items-center gap-3 rounded-card border border-line bg-base p-3 sm:p-4">
    <RouterLink :to="{ name: 'user-profile', params: { id: connection.otherUserId } }">
      <BaseAvatar :name="connection.name" size="md" />
    </RouterLink>

    <div class="min-w-0 flex-1">
      <RouterLink
        :to="{ name: 'user-profile', params: { id: connection.otherUserId } }"
        class="block truncate text-sm font-bold text-ink hover:text-brand"
      >
        {{ connection.name }}
      </RouterLink>
      <p v-if="connection.username" class="truncate text-xs text-muted">@{{ connection.username }}</p>
    </div>

    <!-- Pending: accept / reject -->
    <div v-if="variant === 'pending'" class="flex shrink-0 items-center gap-2">
      <BaseButton size="sm" :loading="busy" @click="$emit('accept', connection.id)">
        <Check class="h-4 w-4" />
        Accept
      </BaseButton>
      <BaseButton size="sm" variant="outline" :disabled="busy" @click="$emit('reject', connection.id)">
        <X class="h-4 w-4" />
        Decline
      </BaseButton>
    </div>

    <!-- Accepted -->
    <BaseBadge v-else variant="success">Connected</BaseBadge>
  </div>
</template>
