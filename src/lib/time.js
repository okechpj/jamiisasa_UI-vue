// Render an ISO timestamp as a compact relative label ("3m ago", "2d ago").
export function relativeTime(iso) {
  if (!iso || typeof iso !== 'string') return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (secs < 60) return 'Just now'

  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`

  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`

  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`

  return new Date(then).toLocaleDateString()
}
