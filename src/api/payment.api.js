import client from './client'

/*
 * payment.api.js — M-Pesa STK Push. The amount is always derived server-side
 * from the booking's accepted quote; the client only supplies the booking id
 * and the payer's phone number. Base URL comes from VITE_API_BASE_URL (client).
 */

// POST /api/v1/payments/stk  { booking_id, phone_number, email }
export async function initiateSTK(bookingId, phoneNumber, email) {
  const { data } = await client.post('/api/v1/payments/stk', {
    booking_id: bookingId,
    phone_number: phoneNumber,
    email: email,
  })
  return data
}

// GET /api/v1/payments/booking/:bookingId -> latest Payment (for polling)
export async function getPaymentStatus(bookingId) {
  const { data } = await client.get(`/api/v1/payments/booking/${bookingId}`)
  return data
}
