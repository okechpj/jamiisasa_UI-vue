import client from './client'

/*
 * chat.api.js — chat room lifecycle + Firebase custom token. Realtime messages
 * are read/written directly against Firestore (see composables/useChatRoom);
 * these endpoints only manage rooms, access, and the sign-in token.
 */

// POST /api/v1/chat/rooms  { booking_id } -> ChatRoom (idempotent)
export async function createRoom(bookingId) {
  const { data } = await client.post('/api/v1/chat/rooms', { booking_id: bookingId })
  return data
}

// GET /api/v1/chat/bookings/:bookingId/room -> ChatRoom
export async function getRoomByBooking(bookingId) {
  const { data } = await client.get(`/api/v1/chat/bookings/${bookingId}/room`)
  return data
}

// GET /api/v1/chat/rooms/:roomId/messages -> Message[] (fallback / initial)
export async function getMessages(roomId) {
  const { data } = await client.get(`/api/v1/chat/rooms/${roomId}/messages`)
  return Array.isArray(data) ? data : []
}

// POST /api/v1/chat/token -> { token } (Firebase custom token for this user)
export async function getCustomToken() {
  const { data } = await client.post('/api/v1/chat/token')
  return data
}
