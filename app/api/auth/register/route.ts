import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { setSession } from '@/lib/session'

const OTP_SECRET = process.env.OTP_SECRET || 'natiive-matrimony-otp'
function otpSign(payload: string) {
  return createHmac('sha256', OTP_SECRET).update(payload).digest('hex').slice(0, 20)
}

/* Creates the account server-side after re-verifying the OTP, then issues the
   trusted session cookie. Profile creation no longer happens in the browser. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const b = await req.json()
    const { full_name, gender, phone, date_of_birth, native_state, native_district, otp, token } = b

    if (!full_name || !gender || !phone || !date_of_birth || !native_state || !native_district) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Re-verify the OTP token server-side (never trust the client's "verified" claim).
    const parts = String(token || '').split('.')
    if (parts.length !== 3) return NextResponse.json({ error: 'Verification required' }, { status: 400 })
    const [storedOtp, expires, sig] = parts
    if (sig !== otpSign(storedOtp + phone + expires)) return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    if (Date.now() > parseInt(expires)) return NextResponse.json({ error: 'Code expired' }, { status: 400 })
    if (String(otp).trim() !== storedOtp) return NextResponse.json({ error: 'Incorrect code' }, { status: 400 })

    // Synthesised credentials (mobile-first). Real phone-native auth can replace later.
    const digits = String(phone).replace(/[^0-9]/g, '')
    const synthEmail = `${digits}@phone.native`
    const synthPass = `Nm-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: synthEmail, password: synthPass, email_confirm: true,
    })
    if (cErr || !created.user) {
      const dup = cErr?.message?.toLowerCase().includes('already')
      return NextResponse.json({ error: dup ? 'This mobile number is already registered' : (cErr?.message || 'Signup failed') }, { status: 400 })
    }

    const { data: profile, error: pErr } = await supabaseAdmin.from('profiles').insert({
      user_id: created.user.id,
      full_name: String(full_name).trim(),
      gender, phone, date_of_birth,
      native_state, native_district, native_region: native_state,
      marital_status: 'never_married', religion: 'Hindu', mother_tongue: 'Telugu',
      profile_created_by: 'self', photo_url: '', photo_visibility: 'private',
      status: 'approved', verified: false,
      premium_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }).select('id').maybeSingle()
    if (pErr || !profile) {
      return NextResponse.json({ error: pErr?.message || 'Could not create profile' }, { status: 400 })
    }

    await setSession(profile.id)
    return NextResponse.json({ profileId: profile.id, userId: created.user.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signup failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
