// Decode a JWT payload without verifying the signature (the server is the only
// authority on validity — this is just for reading non-sensitive claims like
// user_id, role and exp on the client).
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

// True only when the token has an exp claim that is in the past.
export function isExpired(token) {
  const claims = decodeJwt(token)
  if (!claims || typeof claims.exp !== 'number') return false
  return Date.now() >= claims.exp * 1000
}
