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
import { useAuthStore } from '@/stores/auth.store'

let signInPromise = null

// Ensure the browser Firebase user matches our app user (claims.user_id).
// If there's a mismatch (e.g. stale Firebase session), sign out first and
// sign in with a fresh custom token minted for the current user. This
// prevents the client from being authenticated as the wrong uid which
// causes Firestore security rules to reject writes.
export function ensureFirebaseSignIn() {
  const authStore = useAuthStore()
  const expectedUid = authStore.userId || ''

  if (firebaseAuth.currentUser && expectedUid && firebaseAuth.currentUser.uid === expectedUid) {
    return Promise.resolve(firebaseAuth.currentUser)
  }

  if (signInPromise) return signInPromise

  signInPromise = (async () => {
    // If a different firebase user is signed in, clear it first.
    if (firebaseAuth.currentUser && expectedUid && firebaseAuth.currentUser.uid !== expectedUid) {
      try {
        await signOut(firebaseAuth)
      } catch (e) {
        // ignore sign-out failures and continue to sign in
      }
    }

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
