<script setup>
import { ref } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

defineProps({
  open: { type: Boolean, default: false },
  comments: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:open', 'submit'])

const draft = ref('')
const sending = ref(false)

async function submit() {
  const body = draft.value.trim()
  if (!body || sending.value) return
  sending.value = true
  // Parent owns the request; it returns a boolean.
  const ok = await new Promise((resolve) => emit('submit', body, resolve))
  if (ok) draft.value = ''
  sending.value = false
}
</script>

<template>
  <BaseModal :open="open" title="Comments" @update:open="emit('update:open', $event)">
    <!-- List -->
    <div class="max-h-[50dvh] space-y-4 overflow-y-auto">
      <template v-if="loading">
        <div v-for="i in 3" :key="i" class="flex gap-3">
          <BaseSkeleton class="h-8 w-8 rounded-full" />
          <div class="flex-1 space-y-2">
            <BaseSkeleton class="h-3 w-24" />
            <BaseSkeleton class="h-3 w-3/4" />
          </div>
        </div>
      </template>

      <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>

      <EmptyState
        v-else-if="!comments.length"
        title="No comments yet"
        description="Be the first to respond."
      />

      <div v-for="c in comments" v-else :key="c.id" class="flex gap-3">
        <BaseAvatar :name="c.authorName" :src="c.authorAvatar" size="sm" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-ink">{{ c.authorName }}</span>
            <span class="text-xs text-muted">{{ c.timeAgo }}</span>
          </div>
          <p class="whitespace-pre-wrap text-sm text-ink">{{ c.content }}</p>
        </div>
      </div>
    </div>

    <!-- Composer -->
    <template #footer>
      <form class="flex items-center gap-2" @submit.prevent="submit">
        <input
          v-model="draft"
          type="text"
          placeholder="Add a comment…"
          class="flex-1 rounded-xl border border-line bg-base px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-brand"
        />
        <BaseButton type="submit" :loading="sending" :disabled="!draft.trim()">Send</BaseButton>
      </form>
    </template>
  </BaseModal>
</template>
