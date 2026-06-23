// Pull a human-readable message out of an Axios error or Firebase Auth error,
// falling back to a caller-provided default.
export function extractError(e, fallback = 'Something went wrong. Please try again.') {
  if (e && e.code) {
    switch (e.code) {
      case 'auth/email-already-in-use':
        return 'The email address is already in use by another account.'
      case 'auth/invalid-email':
        return 'The email address is not valid.'
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.'
      case 'auth/weak-password':
        return 'The password is too weak. Please use a stronger password.'
      case 'auth/user-disabled':
        return 'This user account has been disabled.'
      case 'auth/user-not-found':
        return 'No user found with this email.'
      case 'auth/wrong-password':
        return 'Incorrect password.'
      case 'auth/popup-closed-by-user':
        return 'Sign-in window closed before completion.'
    }
  }
  const msg = e && e.response && e.response.data && e.response.data.error
  return typeof msg === 'string' && msg !== '' ? msg : fallback
}
