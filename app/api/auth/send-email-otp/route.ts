import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { createOtpToken, otpConfigured } from '@/lib/otpToken'
import { sendEmail, emailConfigured, emailLayout } from '@/lib/email'

/* Passwordless email login — step 1: email a 6-digit code.
   Mirrors the phone OTP flow but keyed on the email address. Only sends to an
   email that already belongs to an approved profile. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    if (!otpConfigured()) {
      return NextResponse.json({ error: 'Email login is temporarily unavailable.' }, { status: 503 })
    }
    const { email } = await req.json().catch(() => ({}))
    const normalized = String(email || '').trim().toLowerCase()
    if (!normalized || !normalized.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    // Only email a code if an account exists (avoids leaking + spam).
    const { data: profile } = await supabaseAdmin.from('profiles')
      .select('id').ilike('email', normalized).maybeSingle()
    if (!profile) {
      return NextResponse.json({ error: 'No account found for that email. Please register first.' }, { status: 404 })
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expires = Date.now() + 10 * 60 * 1000
    const token = createOtpToken(normalized, otp, expires)

    if (!emailConfigured()) {
      // Dev fallback — return the code so login is testable without a provider.
      return NextResponse.json({ token, dev_otp: otp })
    }

    const html = emailLayout(
      'Your login code',
      `Use this code to sign in to NativeMatrimony:<div style="font-size:30px;font-weight:800;letter-spacing:0.22em;color:#14241C;margin:14px 0 4px">${otp}</div>This code expires in 10 minutes. If you didn't request it, you can ignore this email.`,
    )
    const sent = await sendEmail({ to: normalized, subject: `${otp} is your NativeMatrimony login code`, html })
    if (!sent.ok) return NextResponse.json({ error: 'Could not send the email. Please try again.' }, { status: 502 })
    return NextResponse.json({ token })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send code'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
