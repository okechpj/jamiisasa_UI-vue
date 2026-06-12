<script setup>
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  danger: { type: Boolean, default: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'confirm'])
</script>

<template>
  <BaseModal :open="open" :title="title" @update:open="emit('update:open', $event)">
    <p class="text-sm text-muted">{{ message }}</p>
    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="ghost" @click="emit('update:open', false)">Cancel</BaseButton>
        <BaseButton :variant="danger ? 'danger' : 'primary'" :loading="busy" @click="emit('confirm')">
          {{ confirmLabel }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
