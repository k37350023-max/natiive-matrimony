import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, subject, html } = await req.json()
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Gracefully skip — email not configured yet
    return NextResponse.json({ ok: true, skipped: true })
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'NatiiveMatrimony <noreply@natiivematrimony.in>', to, subject, html }),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
