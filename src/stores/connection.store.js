import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import * as connectionApi from '@/api/connection.api'
import * as authApi from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { extractError } from '@/lib/errors'

/*
 * connection.store — the user's accepted connections and incoming pending
 * requests.
 *
 * The backend returns only user ids on connection rows, so each row's "other
 * party" is resolved to a real profile via GET /users/:id (cached) so the UI
 * can show names instead of ids.
 */
const toText = (v) => (typeof v === 'string' ? v : '')

export const useConnectionStore = defineStore('connection', () => {
  const auth = useAuthStore()

  // --- State ---------------------------------------------------------------
  const accepted = ref([])
  const pending = ref([])
  const loading = ref(false)
  const error = ref('')

  // id -> resolved user profile (or {} when lookup failed).
  const userCache = ref({})

  const pendingCount = computed(() => pending.value.length)
  const connectionCount = computed(() => accepted.value.length)

  // --- Helpers -------------------------------------------------------------
  function otherPartyId(conn) {
    const me = auth.userId
    return conn.requester_id === me ? toText(conn.receiver_id) : toText(conn.requester_id)
  }

  async function ensureUser(id) {
    if (!id || userCache.value[id]) return
    try {
      userCache.value[id] = await authApi.getUser(id)
    } catch {
      userCache.value[id] = {}
    }
  }

  async function enrich(list) {
    const ids = [...new Set(list.map(otherPartyId).filter(Boolean))]
    await Promise.all(ids.map(ensureUser))

    return list.map((conn) => {
      const id = otherPartyId(conn)
      const u = userCache.value[id] || {}
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
      return {
        id: toText(conn.id),
        status: toText(conn.status),
        createdAt: toText(conn.created_at),
        otherUserId: id,
        name: name || toText(u.username) || `user-${id.slice(0, 6)}`,
        username: toText(u.username),
      }
    })
  }

  // --- Actions -------------------------------------------------------------
  async function fetchConnections() {
    error.value = ''
    loading.value = true
    try {
      accepted.value = await enrich(await connectionApi.getConnections())
    } catch (e) {
      error.value = extractError(e, 'Could not load your connections.')
    } finally {
      loading.value = false
    }
  }

  async function fetchPending() {
    error.value = ''
    loading.value = true
    try {
      pending.value = await enrich(await connectionApi.getPending())
    } catch (e) {
      error.value = extractError(e, 'Could not load pending requests.')
    } finally {
      loading.value = false
    }
  }

  async function loadAll() {
    await Promise.all([fetchConnections(), fetchPending()])
  }

  async function accept(id) {
    try {
      await connectionApi.accept(id)
      await loadAll()
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not accept the request.')
      return false
    }
  }

  async function reject(id) {
    try {
      await connectionApi.reject(id)
      await fetchPending()
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not reject the request.')
      return false
    }
  }

  async function sendRequest(receiverId) {
    error.value = ''
    const id = toText(receiverId).trim()
    if (!id) {
      error.value = 'Choose someone to connect with.'
      return false
    }
    try {
      await connectionApi.sendRequest(id)
      return true
    } catch (e) {
      error.value = extractError(e, 'Could not send the request.')
      return false
    }
  }

  return {
    // state
    accepted,
    pending,
    loading,
    error,
    // getters
    pendingCount,
    connectionCount,
    // actions
    fetchConnections,
    fetchPending,
    loadAll,
    accept,
    reject,
    sendRequest,
  }
})
