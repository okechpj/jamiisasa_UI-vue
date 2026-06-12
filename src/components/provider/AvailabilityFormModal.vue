<script setup>
import { reactive, ref, watch, computed } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { toMinutes, todayYMD } from '@/lib/marketplace'

const props = defineProps({
  open: { type: Boolean, default: false },
  slot: { type: Object, default: null }, // editing when set
  services: { type: Array, default: () => [] },
  existingSlots: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'submit'])

const form = reactive({ serviceId: '', slotDate: '', startTime: '09:00', endTime: '17:00' })
const error = ref('')
const isEdit = computed(() => Boolean(props.slot))
const minDate = todayYMD()

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    error.value = ''
    const s = props.slot
    form.serviceId = s?.serviceId || props.services[0]?.id || ''
    form.slotDate = s?.slotDate || todayYMD()
    form.startTime = s?.startTime || '09:00'
    form.endTime = s?.endTime || '17:00'
  },
)

function overlaps() {
  const start = toMinutes(form.startTime)
  const end = toMinutes(form.endTime)
  return props.existingSlots.some((s) => {
    if (props.slot && s.id === props.slot.id) return false // skip self
    if (s.serviceId !== form.serviceId || s.slotDate !== form.slotDate) return false
    const sStart = toMinutes(s.startTime)
    const sEnd = toMinutes(s.endTime)
    return start < sEnd && sStart < end // any overlap (covers duplicates too)
  })
}

function submit() {
  error.value = ''
  if (!form.serviceId) {
    error.value = 'Choose a service.'
    return
  }
  if (!form.slotDate) {
    error.value = 'Pick a date.'
    return
  }
  const start = toMinutes(form.startTime)
  const end = toMinutes(form.endTime)
  if (Number.isNaN(start) || Number.isNaN(end)) {
    error.value = 'Enter valid times.'
    return
  }
  if (end <= start) {
    error.value = 'End time must be after start time.'
    return
  }
  if (overlaps()) {
    error.value = 'This overlaps an existing slot for the same service and date.'
    return
  }
  emit('submit', {
    serviceId: form.serviceId,
    slotDate: form.slotDate,
    startTime: form.startTime,
    endTime: form.endTime,
    isActive: true,
  })
}
</script>

<template>
  <BaseModal :open="open" :title="isEdit ? 'Edit slot' : 'Add availability'" @update:open="emit('update:open', $event)">
    <div class="space-y-4">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-ink">Service</label>
        <select
          v-model="form.serviceId"
          class="w-full rounded-xl border border-line bg-base px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
        >
          <option v-if="!services.length" value="">No services — add one first</option>
          <option v-for="s in services" :key="s.id" :value="s.id">{{ s.serviceName }}</option>
        </select>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-ink">Date</label>
        <input
          v-model="form.slotDate"
          type="date"
          :min="minDate"
          class="w-full rounded-xl border border-line bg-base px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-ink">Start time</label>
          <input v-model="form.startTime" type="time" class="w-full rounded-xl border border-line bg-base px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-ink">End time</label>
          <input v-model="form.endTime" type="time" class="w-full rounded-xl border border-line bg-base px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand" />
        </div>
      </div>

      <p v-if="error" class="text-sm text-danger">{{ error }}</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="ghost" @click="emit('update:open', false)">Cancel</BaseButton>
        <BaseButton :loading="saving" :disabled="!services.length" @click="submit">{{ isEdit ? 'Save' : 'Add slot' }}</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
