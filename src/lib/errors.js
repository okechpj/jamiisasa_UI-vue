// Pull a human-readable message out of an Axios error, falling back to a
// caller-provided default. The Go backend returns errors as { "error": "..." }.
export function extractError(e, fallback = 'Something went wrong. Please try again.') {
  const msg = e && e.response && e.response.data && e.response.data.error
  return typeof msg === 'string' && msg !== '' ? msg : fallback
}
