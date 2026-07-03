import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const SECRET = process.env.OTP_SECRET || (process.env.NODE_ENV !== 'production' ? 'natiive-matrimony-otp' : '')
const devSmsAllowed = process.env.NODE_ENV !== 'production' || process.env.DEV_SMS_ENABLED === 'true'

function sign(payload: string) {
  return createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 20)
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })
  if (!SECRET) {
    return NextResponse.json(
      { error: 'SMS verification is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    )
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expires = Date.now() + 10 * 60 * 1000 // 10 min
  const token = `${otp}.${expires}.${sign(otp + phone + expires)}`

  const apiKey = process.env.FAST2SMS_API_KEY
  if (!apiKey) {
    if (devSmsAllowed) {
      // Dev mode - return OTP in response so you can test without SMS credits.
      return NextResponse.json({ token, dev_otp: otp })
    }
    return NextResponse.json(
      { error: 'SMS verification is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    )
  }

  // Strip to last 10 digits (Fast2SMS expects Indian 10-digit numbers)
  const digits = phone.replace(/[^0-9]/g, '').slice(-10)

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ route: 'otp', variables_values: otp, numbers: digits }),
  })
  const data = await res.json()
  if (!data.return) {
    return NextResponse.json({ error: data.message || 'SMS failed - check the phone number' }, { status: 500 })
  }

  return NextResponse.json({ token })
}
