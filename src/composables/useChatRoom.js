import { ref, onUnmounted } from 'vue'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '@/firestore'
import { ensureFirebaseSignIn } from '@/firestore/auth'

/*
 * useChatRoom — the realtime layer. Subscribes to a room's message
 * subcollection in Firestore and exposes a reactive `messages` stream, plus a
 * direct `sendMessage` writer (the frontend owns realtime; the backend only
 * posts quote/system messages). Firebase sign-in is ensured before any access.
 */
export function useChatRoom() {
  const messages = ref([])
  const loading = ref(true)
  const error = ref('')
  let unsub = null

  function mapDoc(d) {
    const data = d.data()
    const ts = data.created_at
    return {
      id: d.id,
      senderId: data.sender_id || '',
      type: data.type || 'text',
      content: data.content || '',
      quoteId: data.quote_id || null,
      createdAt: ts && typeof ts.toMillis === 'function' ? ts.toMillis() : null,
    }
  }

  async function subscribeToChatRoom(roomId) {
    loading.value = true
    error.value = ''
    try {
      await ensureFirebaseSignIn()
      const messagesRef = collection(db, 'chat_rooms', roomId, 'messages')
      const q = query(messagesRef, orderBy('created_at', 'asc'))
      unsub = onSnapshot(
        q,
        (snap) => {
          messages.value = snap.docs.map(mapDoc)
          loading.value = false
        },
        (e) => {
          error.value = (e && e.message) || 'Realtime connection failed.'
          loading.value = false
        },
      )
    } catch (e) {
      error.value = (e && e.message) || 'Could not connect to chat.'
      loading.value = false
    }
  }

  async function sendMessage(roomId, { senderId, content, type = 'text', quoteId = null }) {
    await ensureFirebaseSignIn()
    const messagesRef = collection(db, 'chat_rooms', roomId, 'messages')
    await addDoc(messagesRef, {
      sender_id: senderId,
      type,
      content,
      quote_id: quoteId,
      created_at: serverTimestamp(),
    })
  }

  function stop() {
    if (unsub) {
      unsub()
      unsub = null
    }
  }

  onUnmounted(stop)

  return { messages, loading, error, subscribeToChatRoom, sendMessage, stop }
}
