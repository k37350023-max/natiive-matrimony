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

    const { otp, token, firebaseIdToken, via, phone } = await req.json()
    const { data: me } = await supabaseAdmin.from('profiles').select('phone').eq('id', meId).maybeSingle()
    // Attach a NEW phone (email/Google signups have none yet) or re-verify the existing one.
    const targetPhone = normalizePhoneNumber(String(phone || me?.phone || ''))
    if (!targetPhone) return NextResponse.json({ error: 'Enter a valid mobile number' }, { status: 400 })

    if (via === 'email') {
      await supabaseAdmin.from('profiles').update({ phone_verified: true }).eq('id', meId)
      return NextResponse.json({ ok: true })
    }

    if (firebaseIdToken) {
      if (!firebaseAdminConfigured()) return NextResponse.json({ error: 'Phone verification unavailable' }, { status: 503 })
      const decoded = await verifyFirebaseIdToken(firebaseIdToken)
      const verifiedPhone = normalizePhoneNumber(decoded.phone_number || '')
      if (!verifiedPhone || verifiedPhone !== targetPhone) {
        return NextResponse.json({ error: 'Verification did not match your number' }, { status: 400 })
      }
    } else {
      if (!otpConfigured()) return NextResponse.json({ error: 'Phone verification unavailable' }, { status: 503 })
      const verified = verifyOtpToken(targetPhone, otp, token)
      if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 400 })
    }

    // Don't let a number already tied to another account be attached here.
    const { data: clash } = await supabaseAdmin.from('profiles')
      .select('id').eq('phone', targetPhone).neq('id', meId).maybeSingle()
    if (clash) return NextResponse.json({ error: 'That mobile number is already on another account' }, { status: 409 })

    await supabaseAdmin.from('profiles').update({ phone: targetPhone, phone_verified: true }).eq('id', meId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
