import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

const SECRET = process.env.OTP_SECRET || (process.env.NODE_ENV !== 'production' ? 'natiive-matrimony-otp' : '')
const VERSION = 'v2'

function hmac(payload: string) {
  return createHmac('sha256', SECRET).update(payload).digest('hex')
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export function otpConfigured() {
  return Boolean(SECRET)
}

export function createOtpToken(phone: string, otp: string, expires: number) {
  if (!SECRET) throw new Error('OTP secret is not configured')
  const nonce = randomBytes(12).toString('hex')
  const otpHash = hmac(`otp:${phone}:${otp}:${expires}:${nonce}`).slice(0, 32)
  const sig = hmac(`token:${phone}:${expires}:${nonce}:${otpHash}`).slice(0, 32)
  return `${VERSION}.${expires}.${nonce}.${otpHash}.${sig}`
}

export function verifyOtpToken(phone: string, otp: string, token: string): { ok: true } | { ok: false; error: string } {
  if (!SECRET) return { ok: false, error: 'SMS verification is temporarily unavailable. Please try again shortly.' }

  const parts = String(token || '').split('.')
  if (parts.length !== 5 || parts[0] !== VERSION) return { ok: false, error: 'Invalid token' }

  const [, expiresRaw, nonce, otpHash, sig] = parts
  const expires = Number(expiresRaw)
  if (!Number.isFinite(expires)) return { ok: false, error: 'Invalid token' }
  if (Date.now() > expires) return { ok: false, error: 'OTP expired - request a new one' }

  const expectedHash = hmac(`otp:${phone}:${String(otp).trim()}:${expiresRaw}:${nonce}`).slice(0, 32)
  const expectedSig = hmac(`token:${phone}:${expiresRaw}:${nonce}:${otpHash}`).slice(0, 32)
  if (!safeEqual(sig, expectedSig)) return { ok: false, error: 'Invalid token' }
  if (!safeEqual(otpHash, expectedHash)) return { ok: false, error: 'Incorrect OTP' }

  return { ok: true }
}
