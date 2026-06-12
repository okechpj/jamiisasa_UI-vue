// Single source of truth for where the JWT lives in the browser.
export const TOKEN_STORAGE_KEY = 'jamii.token'

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || ''
}

export function setToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}
