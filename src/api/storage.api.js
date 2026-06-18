import apiClient from './client'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime'
]
const MAX_SIZE = 50 * 1024 * 1024

function validateImageFile(file) {
  if (!file) throw new Error('No file selected')
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP images and MP4, WebM, Quicktime videos are allowed')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File must be less than 50MB')
  }
}

/** Request a presigned upload URL from the backend. */
export async function requestUploadURL(file, entity) {
  validateImageFile(file)
  const response = await apiClient.post('/api/v1/storage/upload-url', {
    file_name: file.name,
    content_type: file.type,
    entity,
    file_size: file.size,
  })
  return response.data
}

/** Upload a file directly to R2 via presigned PUT URL. Optional onProgress(0–100). */
export function uploadToR2(uploadUrl, file, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error('Upload failed'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Upload failed')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.send(file)
  })
}

/** Full pipeline: presign → PUT to R2 → return file_key. */
export async function uploadImage(file, entity, onProgress) {
  const { upload_url, file_key } = await requestUploadURL(file, entity)
  await uploadToR2(upload_url, file, file.type, onProgress)
  return file_key
}

export const storageApi = {
  requestUploadURL,
  uploadToR2,
  uploadImage,

  async getFile(id) {
    const response = await apiClient.get(`/api/v1/storage/files/${id}`)
    return response.data
  },

  async listFiles(entity) {
    const response = await apiClient.get('/api/v1/storage/files', {
      params: { entity },
    })
    return response.data
  },

  async deleteFile(id) {
    const response = await apiClient.delete(`/api/v1/storage/files/${id}`)
    return response.data
  },
}
