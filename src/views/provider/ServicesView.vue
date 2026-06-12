<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, Briefcase, AlertTriangle } from 'lucide-vue-next'

import { useServiceStore } from '@/stores/service.store'
import { useToast } from '@/composables/useToast'
import ServiceCard from '@/components/provider/ServiceCard.vue'
import ServiceFormModal from '@/components/provider/ServiceFormModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const store = useServiceStore()
const toast = useToast()
const { myServices, loading, saving, error } = storeToRefs(store)

onMounted(() => store.fetchMyServices())

// Create / edit
const formOpen = ref(false)
const editing = ref(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}
function openEdit(service) {
  editing.value = service
  formOpen.value = true
}

async function onSubmit(form) {
  const ok = editing.value
    ? await store.updateService(editing.value.id, form)
    : await store.createService(form)
  if (ok) {
    formOpen.value = false
    toast.success(editing.value ? 'Service updated.' : 'Service added.')
  } else {
    toast.error(store.error || 'Could not save the service.')
  }
}

// Delete
const confirmOpen = ref(false)
const deleting = ref(null)
const deleteBusy = ref(false)

function askDelete(service) {
  deleting.value = service
  confirmOpen.value = true
}
async function confirmDelete() {
  deleteBusy.value = true
  const ok = await store.deleteService(deleting.value.id)
  deleteBusy.value = false
  confirmOpen.value = false
  if (ok) toast.success('Service deleted.')
  else toast.error(store.error || 'Could not delete the service.')
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <header class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-bold text-ink">My Services</h1>
      <BaseButton size="sm" @click="openCreate">
        <Plus class="h-4 w-4" />
        Add service
      </BaseButton>
    </header>

    <div v-if="loading && !myServices.length" class="grid gap-3 sm:grid-cols-2">
      <BaseSkeleton v-for="i in 4" :key="i" class="h-28 w-full rounded-card" />
    </div>

    <EmptyState v-else-if="error" title="Couldn't load services" :description="error">
      <template #icon><AlertTriangle class="h-6 w-6" /></template>
      <template #action><BaseButton variant="secondary" @click="store.fetchMyServices()">Try again</BaseButton></template>
    </EmptyState>

    <EmptyState v-else-if="!myServices.length" title="No services yet" description="Add the services you offer so customers can find you.">
      <template #icon><Briefcase class="h-6 w-6" /></template>
      <template #action><BaseButton @click="openCreate">Add your first service</BaseButton></template>
    </EmptyState>

    <div v-else class="grid gap-3 sm:grid-cols-2">
      <ServiceCard
        v-for="s in myServices"
        :key="s.id"
        :service="s"
        editable
        @edit="openEdit"
        @delete="askDelete"
      />
    </div>

    <ServiceFormModal v-model:open="formOpen" :service="editing" :saving="saving" @submit="onSubmit" />
    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Delete service?"
      :message="`This will remove “${deleting?.serviceName}”. This can't be undone.`"
      confirm-label="Delete"
      :busy="deleteBusy"
      @confirm="confirmDelete"
    />
  </section>
</template>
