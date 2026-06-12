/*
 * firestore/auth.js — bridge our JWT session into Firebase Auth.
 *
 * The backend mints a Firebase custom token (uid = our user id); we sign the
 * browser into Firebase with it once, so Firestore security rules see
 * request.auth.uid. The promise is memoised so concurrent callers share one
 * sign-in, and reset on logout.
 */
import { signInWithCustomToken, signOut } from 'firebase/auth'

import { firebaseAuth } from '@/firestore'
import { getCustomToken } from '@/api/chat.api'

let signInPromise = null

export function ensureFirebaseSignIn() {
  if (firebaseAuth.currentUser) return Promise.resolve(firebaseAuth.currentUser)
  if (signInPromise) return signInPromise

  signInPromise = (async () => {
    const { token } = await getCustomToken()
    const cred = await signInWithCustomToken(firebaseAuth, token)
    return cred.user
  })().catch((e) => {
    signInPromise = null // allow a retry on the next call
    throw e
  })

  return signInPromise
}

export async function firebaseSignOut() {
  signInPromise = null
  if (firebaseAuth.currentUser) {
    await signOut(firebaseAuth)
  }
}
