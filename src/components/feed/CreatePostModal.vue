<script setup>
import { ref, watch } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'submit'])

const content = ref('')
const fileKey = ref(null)
const uploading = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      content.value = ''
      fileKey.value = null
      uploading.value = false
    }
  },
)

function handleUploadComplete({ file_key }) {
  fileKey.value = file_key
  uploading.value = false
}

function handleUploadStart() {
  uploading.value = true
}

function handleUploadError() {
  uploading.value = false
}

function handleRemove() {
  fileKey.value = null
}

function submit() {
  if (!content.value.trim()) return
  emit('submit', {
    content: content.value,
    category: '',
    mediaUrl: fileKey.value || '',
    mediaType: fileKey.value ? 'image' : '',
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

      <ImageUpload
        entity="feed_images"
        label="Add Image (optional)"
        @upload-complete="handleUploadComplete"
        @upload-start="handleUploadStart"
        @upload-error="handleUploadError"
        @remove="handleRemove"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="ghost" @click="emit('update:open', false)">Cancel</BaseButton>
        <BaseButton :loading="submitting || uploading" :disabled="!content.trim() || uploading" @click="submit">Post</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

