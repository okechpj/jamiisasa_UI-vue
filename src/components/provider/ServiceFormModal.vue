<script setup>
import { reactive, ref, watch, computed } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  service: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'submit'])

const form = reactive({
  serviceName: '',
  serviceCategory: '',
  description: '',
  priceMin: '',
  priceMax: '',
  imageUrl: '',
})
const error = ref('')
const uploading = ref(false)

const isEdit = computed(() => Boolean(props.service))

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    error.value = ''
    uploading.value = false
    const s = props.service
    form.serviceName = s?.serviceName || ''
    form.serviceCategory = s?.serviceCategory || ''
    form.description = s?.description || ''
    form.priceMin = s ? String(s.priceMin ?? '') : ''
    form.priceMax = s ? String(s.priceMax ?? '') : ''
    form.imageUrl = s?.imageUrl || ''
  },
)

function handleUploadComplete({ file_key }) {
  form.imageUrl = file_key
  uploading.value = false
}

function handleUploadStart() {
  uploading.value = true
}

function handleUploadError() {
  uploading.value = false
}

function handleRemove() {
  form.imageUrl = ''
}

function submit() {
  error.value = ''
  if (!form.serviceName.trim()) {
    error.value = 'Service name is required.'
    return
  }
  const min = Number(form.priceMin) || 0
  const max = Number(form.priceMax) || 0
  if (min < 0 || max < 0) {
    error.value = 'Prices cannot be negative.'
    return
  }
  if (min && max && max < min) {
    error.value = 'Maximum price must be greater than or equal to the minimum.'
    return
  }
  emit('submit', {
    serviceName: form.serviceName.trim(),
    serviceCategory: form.serviceCategory.trim(),
    description: form.description.trim(),
    priceMin: min,
    priceMax: max,
    imageUrl: form.imageUrl,
  })
}
</script>

<template>
  <BaseModal :open="open" :title="isEdit ? 'Edit service' : 'Add service'" @update:open="emit('update:open', $event)">
    <div class="space-y-4">
      <BaseInput v-model="form.serviceName" label="Service name" placeholder="e.g. Plumbing Repair" required />
      <BaseInput v-model="form.serviceCategory" label="Category" placeholder="e.g. Home Services" />
      <BaseTextarea v-model="form.description" label="Description" :rows="3" />
      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model="form.priceMin" label="Min price (KES)" type="number" />
        <BaseInput v-model="form.priceMax" label="Max price (KES)" type="number" :error="error" />
      </div>
      <ImageUpload
        entity="service_images"
        label="Service Image (optional)"
        :initial-url="form.imageUrl"
        @upload-complete="handleUploadComplete"
        @upload-start="handleUploadStart"
        @upload-error="handleUploadError"
        @remove="handleRemove"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="ghost" @click="emit('update:open', false)">Cancel</BaseButton>
        <BaseButton :loading="saving || uploading" :disabled="uploading" @click="submit">{{ isEdit ? 'Save' : 'Add service' }}</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
