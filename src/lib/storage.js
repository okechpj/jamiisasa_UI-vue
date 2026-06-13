const R2_PUBLIC_URL = (import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '')

/** Turn a stored file_key (or full URL) into a browser-loadable image URL. */
export function resolveMediaUrl(value) {
  const v = typeof value === 'string' ? value.trim() : ''
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('blob:') || v.startsWith('data:')) {
    return v
  }
  if (!R2_PUBLIC_URL) return v
  return `${R2_PUBLIC_URL}/${v.replace(/^\//, '')}`
}
