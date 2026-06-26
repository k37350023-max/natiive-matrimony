import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

/* Trusted server session — a signed, httpOnly cookie carrying the verified
   profile_id. The browser can read nothing useful from it and cannot forge it
   (HMAC-signed with SESSION_SECRET). Secured API routes call getSessionProfileId()
   to know WHO is calling, instead of trusting a client-supplied id.

   Cookie value: `${profileId}.${expiresMs}.${sig}` */

const COOKIE = 'nm_session'
const MAX_AGE_DAYS = 30
const SECRET = process.env.SESSION_SECRET || ''

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a); const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function makeSessionValue(profileId: string): string {
  const expires = Date.now() + MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  const payload = `${profileId}.${expires}`
  return `${payload}.${sign(payload)}`
}

export function readSessionValue(value: string | undefined): string | null {
  if (!value || !SECRET) return null
  const parts = value.split('.')
  if (parts.length !== 3) return null
  const [profileId, expires, sig] = parts
  if (!safeEqual(sig, sign(`${profileId}.${expires}`))) return null
  if (Date.now() > Number(expires)) return null
  return profileId
}

/* Set the session cookie (call only after server-side verification of identity). */
export async function setSession(profileId: string) {
  const jar = await cookies()
  jar.set(COOKIE, makeSessionValue(profileId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
  })
}

export async function clearSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}

/* Returns the verified profile_id for the current request, or null. */
export async function getSessionProfileId(): Promise<string | null> {
  const jar = await cookies()
  return readSessionValue(jar.get(COOKIE)?.value)
}

export const SESSION_COOKIE = COOKIE
