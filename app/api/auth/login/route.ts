import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { setSession } from '@/lib/session'

const OTP_SECRET = process.env.OTP_SECRET || 'natiive-matrimony-otp'
function otpSign(payload: string) {
  return createHmac('sha256', OTP_SECRET).update(payload).digest('hex').slice(0, 20)
}

/* Verifies phone+OTP (primary) or email/password (legacy/dev) server-side,
   then issues the trusted session cookie. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const { email, password, phone, otp, token } = await req.json()

    if (phone || otp || token) {
      if (!phone || !otp || !token) {
        return NextResponse.json({ error: 'Phone verification required' }, { status: 400 })
      }
      const parts = String(token || '').split('.')
      if (parts.length !== 3) return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
      const [storedOtp, expires, sig] = parts
      if (sig !== otpSign(storedOtp + phone + expires)) {
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
      }
      if (Date.now() > parseInt(expires)) {
        return NextResponse.json({ error: 'Code expired' }, { status: 400 })
      }
      if (String(otp).trim() !== storedOtp) {
        return NextResponse.json({ error: 'Incorrect code' }, { status: 400 })
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles').select('id,user_id').eq('phone', phone).maybeSingle()
      if (!profile) {
        return NextResponse.json({ error: 'No profile found for this mobile number' }, { status: 404 })
      }

      await setSession(profile.id)
      supabaseAdmin.from('profiles').update({ last_login_at: new Date().toISOString() })
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
