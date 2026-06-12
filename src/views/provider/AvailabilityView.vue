<script setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, CalendarClock, AlertTriangle, Pencil, Trash2 } from 'lucide-vue-next'

import { useAvailabilityStore } from '@/stores/availability.store'
import { useServiceStore } from '@/stores/service.store'
import { useToast } from '@/composables/useToast'
import AvailabilityFormModal from '@/components/provider/AvailabilityFormModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const availability = useAvailabilityStore()
const services = useServiceStore()
const toast = useToast()

const { myAvailability, myByDate, loading, saving, error } = storeToRefs(availability)
const { myServices } = storeToRefs(services)

onMounted(() => {
  availability.fetchMyAvailability()
  services.fetchMyServices()
})

const serviceName = (id) => myServices.value.find((s) => s.id === id)?.serviceName || 'Service'

// Create / edit
const formOpen = ref(false)
const editing = ref(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}
function openEdit(slot) {
  editing.value = slot
  formOpen.value = true
}

async function onSubmit(form) {
  const ok = editing.value
    ? await availability.updateAvailability(editing.value.id, form)
    : await availability.createAvailability(form)
  if (ok) {
    formOpen.value = false
    toast.success(editing.value ? 'Slot updated.' : 'Slot added.')
  } else {
    toast.error(availability.error || 'Could not save the slot.')
  }
}

// Delete
const confirmOpen = ref(false)
const deleting = ref(null)
const deleteBusy = ref(false)

function askDelete(slot) {
  deleting.value = slot
  confirmOpen.value = true
}
async function confirmDelete() {
  deleteBusy.value = true
  const ok = await availability.deleteAvailability(deleting.value.id)
  deleteBusy.value = false
  confirmOpen.value = false
  if (ok) toast.success('Slot deleted.')
  else toast.error(availability.error || 'Could not delete the slot.')
}

const hasServices = computed(() => myServices.value.length > 0)
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <header class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-bold text-ink">My Availability</h1>
      <BaseButton size="sm" :disabled="!hasServices" @click="openCreate">
        <Plus class="h-4 w-4" />
        Add slot
      </BaseButton>
    </header>

    <p v-if="!hasServices && !loading" class="mb-4 rounded-card border border-line bg-base p-3 text-sm text-muted">
      Add a service first — availability slots are tied to a service.
    </p>

    <div v-if="loading && !myAvailability.length" class="space-y-3">
      <BaseSkeleton v-for="i in 3" :key="i" class="h-20 w-full rounded-card" />
    </div>

    <EmptyState v-else-if="error" title="Couldn't load availability" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action><BaseButton variant="secondary" @click="availability.fetchMyAvailability()">Try again</BaseButton></template>
    </EmptyState>

    <EmptyState v-else-if="!myAvailability.length" title="No availability yet" description="Add weekly slots so customers know when you're available.">
      <template #icon><CalendarClock class="h-6 w-6" /></template>
      <template #action v-if="hasServices"><BaseButton @click="openCreate">Add your first slot</BaseButton></template>
    </EmptyState>

    <!-- Grouped by date -->
    <div v-else class="space-y-4">
      <div v-for="group in myByDate" :key="group.date" class="rounded-card border border-line bg-base p-4">
        <h2 class="mb-2 text-sm font-bold text-ink">{{ group.dateLabel }}</h2>
        <ul class="space-y-2">
          <li v-for="slot in group.slots" :key="slot.id" class="flex items-center justify-between rounded-xl bg-surface px-3 py-2">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-ink">{{ slot.startTime }} – {{ slot.endTime }}</p>
              <p class="truncate text-xs text-muted">{{ serviceName(slot.serviceId) }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <button type="button" aria-label="Edit" class="rounded-lg p-1.5 text-muted hover:bg-base hover:text-ink" @click="openEdit(slot)">
                <Pencil class="h-4 w-4" />
              </button>
              <button type="button" aria-label="Delete" class="rounded-lg p-1.5 text-muted hover:bg-base hover:text-danger" @click="askDelete(slot)">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <AvailabilityFormModal
      v-model:open="formOpen"
      :slot="editing"
      :services="myServices"
      :existing-slots="myAvailability"
      :saving="saving"
      @submit="onSubmit"
    />
    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Delete slot?"
      message="This availability slot will be removed."
      confirm-label="Delete"
      :busy="deleteBusy"
      @confirm="confirmDelete"
    />
  </section>
</template>
