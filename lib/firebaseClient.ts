import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
}

export function firebaseClientConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  )
}

export function getFirebaseAuth() {
  if (!firebaseClientConfigured()) return null
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  return getAuth(app)
}

/* Google sign-in via popup. Returns the Firebase ID token (verified server-side)
   plus the Google email/name. Throws if not configured or the popup fails. */
export async function signInWithGoogle(): Promise<{ idToken: string; email: string; name: string }> {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Google sign-in is not available')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const cred = await signInWithPopup(auth, provider)
  const idToken = await cred.user.getIdToken()
  return { idToken, email: cred.user.email || '', name: cred.user.displayName || '' }
}
