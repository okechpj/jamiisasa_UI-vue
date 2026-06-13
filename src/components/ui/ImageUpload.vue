<template>
  <div class="image-upload">
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Empty state -->
    <div
      v-if="!previewSrc && !uploading"
      class="upload-area"
      role="button"
      tabindex="0"
      @click="triggerFileInput"
      @keydown.enter="triggerFileInput"
    >
      <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="upload-text">{{ label }}</p>
      <p class="upload-hint">JPEG, PNG or WebP · max 20MB</p>
    </div>

    <!-- Preview (before / during / after upload) -->
    <div v-if="previewSrc" class="preview">
      <img :src="previewSrc" :alt="fileName || 'Selected image'" />

      <div v-if="uploading" class="preview-overlay">
        <div class="progress-wrap">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }" />
          </div>
          <p class="progress-label">Uploading… {{ progress }}%</p>
        </div>
      </div>

      <div v-else-if="uploaded" class="preview-badge success">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Uploaded
      </div>

      <button
        v-if="!uploading"
        type="button"
        class="remove-btn"
        aria-label="Remove image"
        @click="removeImage"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<script>
import { uploadImage } from '@/api/storage.api'
import { resolveMediaUrl } from '@/lib/storage'

export default {
  name: 'ImageUpload',
  props: {
    entity: {
      type: String,
      required: true,
      validator: (v) => ['profile_pictures', 'feed_images', 'service_images'].includes(v),
    },
    label: {
      type: String,
      default: 'Add Image',
    },
    initialUrl: {
      type: String,
      default: null,
    },
  },
  emits: ['upload-complete', 'upload-start', 'upload-error', 'remove'],
  data() {
    return {
      uploading: false,
      uploaded: false,
      error: null,
      previewSrc: null,
      localPreview: null,
      fileName: null,
      fileKey: null,
      progress: 0,
    }
  },
  watch: {
    initialUrl: {
      immediate: true,
      handler(value) {
        if (this.uploading) return
        this.setInitialPreview(value)
      },
    },
  },
  beforeUnmount() {
    this.revokeLocalPreview()
  },
  methods: {
    setInitialPreview(value) {
      this.revokeLocalPreview()
      this.fileKey = value || null
      this.previewSrc = value ? resolveMediaUrl(value) : null
      this.uploaded = Boolean(value)
      this.fileName = null
    },

    triggerFileInput() {
      if (this.uploading) return
      this.$refs.fileInput.click()
    },

    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return

      this.error = null
      this.uploaded = false
      this.fileKey = null

      this.revokeLocalPreview()
      this.localPreview = URL.createObjectURL(file)
      this.previewSrc = this.localPreview
      this.fileName = file.name

      await this.uploadFile(file)
    },

    async uploadFile(file) {
      this.uploading = true
      this.progress = 0
      this.error = null
      this.$emit('upload-start')

      try {
        const fileKey = await uploadImage(file, this.entity, (pct) => {
          this.progress = pct
        })

        this.fileKey = fileKey
        this.uploaded = true
        this.revokeLocalPreview()
        this.previewSrc = resolveMediaUrl(fileKey)

        this.$emit('upload-complete', { file_key: fileKey })
      } catch (err) {
        this.error = err.response?.data?.error || err.message || 'Upload failed'
        this.$emit('upload-error', this.error)
      } finally {
        this.uploading = false
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = ''
        }
      }
    },

    removeImage() {
      this.revokeLocalPreview()
      this.previewSrc = null
      this.fileName = null
      this.fileKey = null
      this.uploaded = false
      this.progress = 0
      this.error = null
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
      this.$emit('remove')
    },

    revokeLocalPreview() {
      if (this.localPreview) {
        URL.revokeObjectURL(this.localPreview)
        this.localPreview = null
      }
    },
  },
}
</script>

<style scoped>
.image-upload {
  width: 100%;
}

.hidden {
  display: none;
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 28px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.upload-area:hover,
.upload-area:focus-visible {
  border-color: #2563eb;
  background: #f8fafc;
  outline: none;
}

.upload-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 10px;
  color: #64748b;
}

.upload-text {
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.upload-hint {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.preview img {
  width: 100%;
  height: auto;
  display: block;
  max-height: 280px;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.55);
  padding: 16px;
}

.progress-wrap {
  width: 100%;
  max-width: 220px;
}

.progress-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 999px;
  transition: width 0.15s ease;
}

.progress-label {
  margin-top: 8px;
  text-align: center;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.preview-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.preview-badge.success {
  background: rgba(22, 163, 74, 0.9);
  color: #fff;
}

.preview-badge svg {
  width: 14px;
  height: 14px;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  padding: 6px;
}

.remove-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.error {
  color: #ef4444;
  font-size: 14px;
  margin-top: 8px;
}

@media (max-width: 640px) {
  .upload-area {
    padding: 22px 16px;
  }
}
</style>
