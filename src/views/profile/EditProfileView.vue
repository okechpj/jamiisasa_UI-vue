<template>
  <section class="mx-auto max-w-2xl">
    <div class="rounded-card border border-line bg-base p-6">
      <h1 class="text-xl font-bold text-ink mb-6">Edit Profile</h1>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="flex justify-center">
          <div class="w-full max-w-xs">
            <label class="block text-sm font-medium text-ink mb-2">Profile Picture</label>
            <ImageUpload
              entity="profile_pictures"
              label="Upload Profile Picture"
              :initial-url="form.profilePictureUrl"
              @upload-complete="(payload) => { handleUploadComplete(payload); applyUploadedAvatar(payload.file_key); }"
              @upload-start="uploading = true"
              @upload-error="onUploadError"
              @remove="handleRemove"
            />
          </div>
        </div>

        <BaseInput
          v-model="form.firstName"
          label="First Name"
          placeholder="Enter first name"
        />

        <BaseInput
          v-model="form.lastName"
          label="Last Name"
          placeholder="Enter last name"
        />

        <BaseInput
          v-model="form.username"
          label="Username"
          placeholder="Enter username"
        />

        <BaseInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="Enter email"
          disabled
        />

        <div class="mt-4 border-t pt-4">
          <p class="text-sm font-medium text-ink">Current Location</p>
          <p class="mt-1 text-sm text-muted">{{ savedLocation?.address || 'No saved location' }}</p>
          <div class="mt-2 flex items-center gap-3">
            <BaseButton size="sm" variant="outline" :loading="locLoading" @click="handleRefreshLocation">Update Location</BaseButton>
            <p v-if="locError" class="text-sm text-red-600">{{ locError }}</p>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="text-sm text-green-600">{{ success }}</p>

        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" type="button" @click="$router.back()">
            Cancel
          </BaseButton>
          <BaseButton
            type="submit"
            :loading="saving || uploading"
            :disabled="uploading"
          >
            Save Changes
          </BaseButton>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useLocation } from '@/composables/useLocation'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'

const router = useRouter()
const auth = useAuthStore()

const form = ref({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  profilePictureUrl: '',
})

const uploading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const loc = useLocation()
const locLoading = ref(false)
const locError = ref('')
const savedLocation = ref(null)

onMounted(async () => {
  if (!auth.user) {
    await auth.fetchMe()
  }

  try {
    const s = await loc.fetchSavedLocation()
    if (s) savedLocation.value = s
  } catch (e) {
    // ignore
  }

  form.value = {
    firstName: auth.user?.first_name || '',
    lastName: auth.user?.last_name || '',
    username: auth.user?.username || '',
    email: auth.user?.email || '',
    profilePictureUrl: auth.user?.profile_picture_url || '',
  }
})

function handleUploadComplete({ file_key }) {
  form.value.profilePictureUrl = file_key
  uploading.value = false
}

// optimistic UI: immediately apply uploaded avatar to the auth store so
// feed posts, sidebar and other cards reflect the new picture before the
// user presses Save (will be persisted when they save changes).
function applyUploadedAvatar(file_key) {
  try {
    if (auth && auth.user) {
      auth.user = { ...auth.user, profile_picture_url: file_key }
      try {
        // eslint-disable-next-line no-console
        console.debug('[EditProfileView] applied uploaded avatar:', file_key)
      } catch (e) {}
    }
  } catch (e) {
    // ignore
  }
}

function onUploadError() {
  uploading.value = false
}

function handleRemove() {
  form.value.profilePictureUrl = ''
}

async function handleRefreshLocation() {
  locLoading.value = true
  locError.value = ''
  try {
    const ok = await loc.refreshLocation()
    if (ok) {
      // refresh profile from server to pick up new last-known location
      await auth.fetchMe()
      savedLocation.value = await loc.fetchSavedLocation()
    } else {
      locError.value = 'Could not update location.'
    }
  } catch (e) {
    locError.value = 'Could not update location.'
  } finally {
    locLoading.value = false
  }
}

async function handleSubmit() {
  error.value = ''
  success.value = ''
  saving.value = true

  try {
    const ok = await auth.updateProfile({
      first_name: form.value.firstName.trim(),
      last_name: form.value.lastName.trim(),
      username: form.value.username.trim(),
      profile_picture_url: form.value.profilePictureUrl,
    })

    if (!ok) {
      error.value = auth.error || 'Failed to update profile'
      return
    }

    success.value = 'Profile updated successfully!'
    setTimeout(() => router.push('/profile'), 1500)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to update profile'
  } finally {
    saving.value = false
  }
}
</script>
