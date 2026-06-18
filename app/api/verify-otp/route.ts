import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const SECRET = process.env.OTP_SECRET || 'natiive-matrimony-otp'

function sign(payload: string) {
  return createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 20)
}

export async function POST(req: NextRequest) {
  const { otp, token, phone } = await req.json()
  if (!otp || !token || !phone) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const parts = token.split('.')
  if (parts.length !== 3) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  const [storedOtp, expires, sig] = parts

  if (sig !== sign(storedOtp + phone + expires)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
  if (Date.now() > parseInt(expires)) {
    return NextResponse.json({ error: 'OTP expired — request a new one' }, { status: 400 })
  }
  if (otp.trim() !== storedOtp) {
    return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
