<script setup>
import { ref, watch } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'submit'])

const content = ref('')
const mediaUrl = ref('')
const category = ref('JamiiLiza')

// Pick a sensible default category (skip the "All" filter pseudo-category).
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      content.value = ''
      mediaUrl.value = ''
      category.value = props.categories.find((c) => c !== 'All') || 'JamiiLiza'
    }
  },
)

function submit() {
  if (!content.value.trim()) return
  emit('submit', {
    content: content.value,
    category: category.value,
    mediaUrl: mediaUrl.value.trim(),
    mediaType: mediaUrl.value.trim() ? 'image' : '',
  })
}
</script>

<template>
  <BaseModal :open="open" title="Create a post" @update:open="emit('update:open', $event)">
    <div class="space-y-4">
      <BaseTextarea
        v-model="content"
        placeholder="Share something with your neighborhood…"
        :rows="4"
        :maxlength="1000"
      />

      <BaseInput v-model="mediaUrl" label="Image URL (optional)" placeholder="https://…" />

      <div>
        <label class="mb-1.5 block text-sm font-medium text-ink">Category</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in categories.filter((x) => x !== 'All')"
            :key="c"
            type="button"
            class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
            :class="category === c ? 'border-brand bg-brand/10 text-brand' : 'border-line text-muted hover:bg-surface'"
            @click="category = c"
          >
            {{ c }}
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="ghost" @click="emit('update:open', false)">Cancel</BaseButton>
        <BaseButton :loading="submitting" :disabled="!content.trim()" @click="submit">Post</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
