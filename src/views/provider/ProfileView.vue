<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { BadgeCheck, Pencil } from 'lucide-vue-next'

import { useProviderStore } from '@/stores/provider.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const store = useProviderStore()
const auth = useAuthStore()
const toast = useToast()
const { myProfile, hasProfile, loading, saving } = storeToRefs(store)

const editing = ref(false)
const form = reactive({ businessName: '', description: '', location: '' })

function syncForm() {
  const p = myProfile.value
  form.businessName = p?.businessName || ''
  form.description = p?.description || ''
  form.location = p?.location || ''
}

onMounted(async () => {
  if (!auth.user) auth.fetchMe()
  await store.fetchMyProfile()
  syncForm()
  // No profile yet → drop straight into the create form.
  if (!hasProfile.value) editing.value = true
})

watch(myProfile, syncForm)

async function save() {
  if (!form.businessName.trim()) {
    toast.error('Business name is required.')
    return
  }
  const ok = hasProfile.value ? await store.updateProfile(form) : await store.createProfile(form)
  if (ok) {
    editing.value = false
    toast.success('Profile saved.')
  } else {
    toast.error(store.error || 'Could not save your profile.')
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <h1 class="mb-4 text-xl font-bold text-ink">Provider Profile</h1>

    <div v-if="loading && !myProfile" class="space-y-3 rounded-card border border-line bg-base p-6">
      <BaseSkeleton class="h-6 w-48" />
      <BaseSkeleton class="h-4 w-full" />
      <BaseSkeleton class="h-4 w-2/3" />
    </div>

    <!-- View mode -->
    <div v-else-if="hasProfile && !editing" class="space-y-6 rounded-card border border-line bg-base p-6">
      <div class="flex items-start justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h2 class="truncate text-lg font-bold text-ink">{{ myProfile.businessName || 'Unnamed business' }}</h2>
            <BaseBadge :variant="myProfile.isVerified ? 'success' : 'neutral'">
              <BadgeCheck class="h-3.5 w-3.5" />
              {{ myProfile.isVerified ? 'Verified' : 'Unverified' }}
            </BaseBadge>
          </div>
          <p v-if="myProfile.location" class="mt-0.5 text-sm text-muted">{{ myProfile.location }}</p>
        </div>
        <BaseButton variant="outline" size="sm" @click="editing = true">
          <Pencil class="h-4 w-4" />
          Edit
        </BaseButton>
      </div>

      <p class="whitespace-pre-wrap text-sm text-ink">{{ myProfile.description || 'No description yet.' }}</p>

      <!-- Read-only account fields -->
      <dl class="grid grid-cols-1 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-muted">Account name</dt>
          <dd class="font-medium text-ink">{{ auth.displayName }}</dd>
        </div>
        <div>
          <dt class="text-muted">Email</dt>
          <dd class="font-medium text-ink">{{ auth.user?.email || '—' }}</dd>
        </div>
        <div>
          <dt class="text-muted">Phone</dt>
          <dd class="font-medium text-ink">{{ auth.user?.phone_number || '—' }}</dd>
        </div>
        <div>
          <dt class="text-muted">Verification</dt>
          <dd class="font-medium text-ink">{{ myProfile.isVerified ? 'Verified' : 'Pending' }}</dd>
        </div>
      </dl>
    </div>

    <!-- Create / edit form -->
    <form v-else class="space-y-4 rounded-card border border-line bg-base p-6" @submit.prevent="save">
      <p v-if="!hasProfile" class="text-sm text-muted">Create your provider profile to start listing services.</p>
      <BaseInput v-model="form.businessName" label="Business name" required />
      <BaseTextarea v-model="form.description" label="Description" :rows="4" />
      <BaseInput v-model="form.location" label="Location" placeholder="e.g. Nairobi, Kilimani" />

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton v-if="hasProfile" variant="ghost" type="button" @click="editing = false">Cancel</BaseButton>
        <BaseButton type="submit" :loading="saving">{{ hasProfile ? 'Save changes' : 'Create profile' }}</BaseButton>
      </div>
    </form>
  </section>
</template>
