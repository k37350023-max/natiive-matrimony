import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'
import { otpConfigured, verifyOtpToken } from '@/lib/otpToken'
import { firebaseAdminConfigured, normalizePhoneNumber, verifyFirebaseIdToken } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

/* Marks the signed-in user's own profile phone_verified=true — but only after
   re-verifying the OTP/Firebase token server-side against the profile's phone.
   `via: 'email'` accepts the already-completed Supabase email OTP (owner-scoped,
   only affects the caller's own profile). */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { otp, token, firebaseIdToken, via } = await req.json()
    const { data: me } = await supabaseAdmin.from('profiles').select('phone').eq('id', meId).maybeSingle()
    const myPhone = normalizePhoneNumber(me?.phone || '')

    if (via === 'email') {
      // Email OTP was verified client-side via Supabase Auth for the caller's own account.
      await supabaseAdmin.from('profiles').update({ phone_verified: true }).eq('id', meId)
      return NextResponse.json({ ok: true })
    }

    if (firebaseIdToken) {
      if (!firebaseAdminConfigured()) return NextResponse.json({ error: 'Phone verification unavailable' }, { status: 503 })
      const decoded = await verifyFirebaseIdToken(firebaseIdToken)
      const verifiedPhone = normalizePhoneNumber(decoded.phone_number || '')
      if (!verifiedPhone || (myPhone && verifiedPhone !== myPhone)) {
        return NextResponse.json({ error: 'Verification did not match your number' }, { status: 400 })
      }
    } else {
      if (!otpConfigured()) return NextResponse.json({ error: 'Phone verification unavailable' }, { status: 503 })
      const verified = verifyOtpToken(myPhone, otp, token)
      if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 400 })
    }

    await supabaseAdmin.from('profiles').update({ phone_verified: true }).eq('id', meId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
