import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { setSession } from '@/lib/session'
import { otpConfigured, verifyOtpToken } from '@/lib/otpToken'
import { firebaseAdminConfigured, normalizePhoneNumber, verifyFirebaseIdToken } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

/* Verifies phone+OTP (primary) or email/password (legacy/dev) server-side,
   then issues the trusted session cookie. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const { email, password, phone, otp, token, firebaseIdToken } = await req.json()

    if (phone || otp || token || firebaseIdToken) {
      if (!phone) {
        return NextResponse.json({ error: 'Phone verification required' }, { status: 400 })
      }
      const normalizedPhone = normalizePhoneNumber(phone)
      if (firebaseIdToken) {
        if (!firebaseAdminConfigured()) {
          return NextResponse.json({ error: 'Firebase phone verification is not configured on the server' }, { status: 503 })
        }
        const decoded = await verifyFirebaseIdToken(firebaseIdToken)
        const verifiedPhone = normalizePhoneNumber(decoded.phone_number || '')
        if (!verifiedPhone || verifiedPhone !== normalizedPhone) {
          return NextResponse.json({ error: 'Mobile verification did not match this number' }, { status: 400 })
        }
      } else {
        if (!otpConfigured()) {
          return NextResponse.json(
            { error: 'SMS verification is temporarily unavailable. Please try again shortly.' },
            { status: 503 },
          )
        }
        if (!otp || !token) {
          return NextResponse.json({ error: 'Phone verification required' }, { status: 400 })
        }
        const verified = verifyOtpToken(normalizedPhone, otp, token)
        if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 400 })
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles').select('id,user_id').eq('phone', normalizedPhone).maybeSingle()
      if (!profile) {
        return NextResponse.json({ error: 'No profile found for this mobile number' }, { status: 404 })
      }

      await setSession(profile.id)
      // OTP/Firebase login proves phone ownership — keep phone_verified in sync.
      supabaseAdmin.from('profiles').update({ last_login_at: new Date().toISOString(), phone_verified: true })
        .eq('id', profile.id).then(() => {})

      return NextResponse.json({ profileId: profile.id, userId: profile.user_id })
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Mobile number required' }, { status: 400 })
    }

    // Verify credentials against Supabase Auth (anon client, no session persisted).
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('id').eq('user_id', data.user.id).maybeSingle()
    if (!profile) {
      return NextResponse.json({ error: 'No profile found for this account' }, { status: 404 })
    }

    await setSession(profile.id)
    supabaseAdmin.from('profiles').update({ last_login_at: new Date().toISOString() })
      .eq('id', profile.id).then(() => {})

    return NextResponse.json({ profileId: profile.id, userId: data.user.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
