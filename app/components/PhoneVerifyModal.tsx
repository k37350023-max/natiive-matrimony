'use client'
import { useRef, useState } from 'react'
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth'

const CODES = ['+91', '+1', '+44', '+61', '+971', '+65']

/* Post-signup phone verification popup. Email/Google accounts have no phone yet;
   this attaches + verifies one. Uses Firebase SMS first (real OTP), falling back
   to the server OTP path if Firebase is unavailable. */
export default function PhoneVerifyModal({ onDone, onDismiss }: { onDone: () => void; onDismiss: () => void }) {
  const [code, setCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [stage, setStage] = useState<'enter' | 'code'>('enter')
  const [otp, setOtp] = useState('')
  const [token, setToken] = useState('')       // server-OTP fallback token
  const [devOtp, setDevOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const full = `${code}${phone.trim()}`

  async function sendViaFirebase(fullPhone: string): Promise<boolean> {
    const { firebaseClientConfigured, getFirebaseAuth } = await import('@/lib/firebaseClient')
    if (!firebaseClientConfigured()) return false
    const auth = getFirebaseAuth()
    if (!auth) return false
    const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth')
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'phone-verify-recaptcha', { size: 'invisible' })
    }
    const confirmation = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current)
    confirmationRef.current = confirmation
    setToken(''); setDevOtp('')
    return true
  }

  async function sendCode() {
    if (phone.trim().length < 7) { setError('Enter a valid mobile number'); return }
    setBusy(true); setError('')
    try {
      // Try Firebase SMS first; race an 8s timeout so a stuck reCAPTCHA/region
      // issue falls back to the server OTP path instead of hanging.
      let sent = false
      try {
        sent = await Promise.race([
          sendViaFirebase(full),
          new Promise<boolean>((_, rej) => setTimeout(() => rej(new Error('firebase-timeout')), 8000)),
        ])
      } catch {
        try { recaptchaRef.current?.clear() } catch {}
        recaptchaRef.current = null
        confirmationRef.current = null
        sent = false
      }
      if (!sent) {
        const r = await fetch('/api/send-otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: full }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Could not send code')
        setToken(d.token); setDevOtp(d.dev_otp || '')
      }
      setStage('code')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send code') }
    finally { setBusy(false) }
  }

  async function verify() {
    if (otp.trim().length < 4) { setError('Enter the code'); return }
    setBusy(true); setError('')
    try {
      let body: Record<string, string>
      if (confirmationRef.current) {
        const cred = await confirmationRef.current.confirm(otp.trim())
        const firebaseIdToken = await cred.user.getIdToken()
        body = { phone: full, firebaseIdToken }
      } else {
        body = { phone: full, otp: otp.trim(), token }
      }
      const r = await fetch('/api/profiles/verify-phone', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Could not verify')
      onDone()
    } catch (e) { setError(e instanceof Error ? e.message : 'Incorrect code — try again') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(20,36,28,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onDismiss()}>
      <div id="phone-verify-recaptcha" />
      <div onClick={e => e.stopPropagation()} className="w-full" style={{ background: 'white', maxWidth: 440, borderRadius: '20px 20px 0 0', padding: '22px 20px 26px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#14241C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EAF3EA" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
        </div>
        <p style={{ fontWeight: 800, fontSize: 17, color: '#14241C', textAlign: 'center', margin: '0 0 4px' }}>Verify your phone</p>
        <p style={{ fontSize: 13, color: '#5E6B62', textAlign: 'center', margin: '0 0 16px', lineHeight: 1.5 }}>
          A verified number builds trust with families. It&apos;s never shown to other members.
        </p>

        {error && <p style={{ fontSize: 13, color: '#B4231F', textAlign: 'center', margin: '0 0 10px' }}>{error}</p>}

        {stage === 'enter' ? (
          <>
            <div style={{ display: 'flex', border: '1.5px solid #E7E3D8', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
              <select value={code} onChange={e => setCode(e.target.value)}
                style={{ background: '#FBFAF5', fontSize: 13, fontWeight: 700, padding: '12px 8px', border: 'none', outline: 'none', borderRight: '1px solid #E7E3D8' }}>
                {CODES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input style={{ flex: 1, padding: '12px 13px', fontSize: 14, border: 'none', outline: 'none' }}
                type="tel" inputMode="numeric" placeholder="Mobile number" value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && sendCode()} />
            </div>
            <button onClick={sendCode} disabled={busy} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: 15, borderRadius: 8 }}>
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </>
        ) : (
          <>
            {devOtp && (
              <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, background: '#EDF3ED', color: '#14241C', border: '1px solid #CADFCA', marginBottom: 12 }}>
                Dev mode code: <strong>{devOtp}</strong>
              </div>
            )}
            <input className="input" inputMode="numeric" placeholder="Enter 6-digit code" value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verify()} style={{ marginBottom: 12 }} />
            <button onClick={verify} disabled={busy} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: 15, borderRadius: 8 }}>
              {busy ? 'Verifying…' : 'Verify & finish'}
            </button>
            <button onClick={() => { setStage('enter'); setOtp(''); setError(''); confirmationRef.current = null }}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, marginTop: 10 }}>
              Change number
            </button>
          </>
        )}
        <button onClick={onDismiss}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 13, marginTop: 12 }}>
          I&apos;ll do this later
        </button>
      </div>
    </div>
  )
}
