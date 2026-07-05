import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

type FirebaseServiceAccount = {
  projectId: string
  clientEmail: string
  privateKey: string
}

function parseServiceAccount(): FirebaseServiceAccount | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (rawJson) {
    try {
      const firstParse = JSON.parse(rawJson) as
        | string
        | {
            project_id?: string
            client_email?: string
            private_key?: string
          }
      const parsed = typeof firstParse === 'string'
        ? JSON.parse(firstParse) as {
            project_id?: string
            client_email?: string
            private_key?: string
          }
        : firstParse
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, '\n'),
        }
      }
    } catch {
      // Continue to FIREBASE_SERVICE_ACCOUNT_BASE64 or split env vars below.
    }
  }

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  if (serviceAccountBase64) {
    try {
      const parsed = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8')) as {
        project_id?: string
        client_email?: string
        private_key?: string
      }
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, '\n'),
        }
      }
    } catch {
      return null
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) return null
  return { projectId, clientEmail, privateKey }
}

export function firebaseAdminConfigured() {
  return Boolean(parseServiceAccount())
}

export function getFirebaseAdminAuth() {
  const serviceAccount = parseServiceAccount()
  if (!serviceAccount) {
    throw new Error('Firebase Admin is not configured')
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: serviceAccount.projectId,
          clientEmail: serviceAccount.clientEmail,
          privateKey: serviceAccount.privateKey,
        }),
      })

  return getAuth(app)
}

export async function verifyFirebaseIdToken(idToken: string) {
  if (!idToken) throw new Error('Firebase ID token is required')
  return getFirebaseAdminAuth().verifyIdToken(idToken)
}

export function normalizePhoneNumber(value: string) {
  const digits = String(value || '').replace(/[^0-9]/g, '')
  return digits ? `+${digits}` : ''
}
