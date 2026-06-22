/*
 * firestore/auth.js — bridge our session state into Firebase Auth.
 *
 * In the refactored architecture, Firebase Auth is the single identity provider.
 * This helper ensures Firebase Auth has loaded its session before accessing Firestore.
 */
import { signOut } from 'firebase/auth'
import { firebaseAuth } from '@/firestore'

export function ensureFirebaseSignIn() {
  if (firebaseAuth.currentUser) {
    return Promise.resolve(firebaseAuth.currentUser)
  }

  // Wait for initial auth state verification to complete
  return new Promise((resolve, reject) => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      unsubscribe()
      if (user) {
        resolve(user)
      } else {
        reject(new Error('User not authenticated with Firebase'))
      }
    })
  })
}

export async function firebaseSignOut() {
  if (firebaseAuth.currentUser) {
    await signOut(firebaseAuth)
  }
}
