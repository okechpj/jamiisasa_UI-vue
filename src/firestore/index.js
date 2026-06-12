/*
 * firestore/index.js — single Firebase initialization for the app.
 *
 * Config comes from VITE_FIREBASE_* env vars (never hardcoded). The web config
 * is public by design; the Admin private key lives only on the Go backend.
 *
 * Realtime chat messages are read/written directly against Firestore by the
 * client. Identity comes from a Firebase *custom token* minted by our Go
 * backend (POST /api/v1/chat/token) so Firestore security rules can authorize
 * by our own user id.
 */
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const firebaseAuth = getAuth(app)
