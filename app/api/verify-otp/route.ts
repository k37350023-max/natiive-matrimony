import { NextRequest, NextResponse } from 'next/server'
import { otpConfigured, verifyOtpToken } from '@/lib/otpToken'

export async function POST(req: NextRequest) {
  const { otp, token, phone } = await req.json()
  if (!otp || !token || !phone) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (!otpConfigured()) {
    return NextResponse.json(
      { error: 'SMS verification is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    )
  }

  const verified = verifyOtpToken(phone, otp, token)
  if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 400 })

  return NextResponse.json({ success: true })
}
