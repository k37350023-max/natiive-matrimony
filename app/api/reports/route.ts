import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const reporter = await getSessionProfileId()
    if (!reporter) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { reported, reason } = await req.json()
    if (!reported || reported === reporter) return NextResponse.json({ error: 'Invalid profile' }, { status: 400 })
    if (typeof reason !== 'string' || reason.trim().length < 3) {
      return NextResponse.json({ error: 'Choose a report reason' }, { status: 400 })
    }

    await supabaseAdmin.from('reports').insert({
      reporter,
      reported,
      reason: reason.trim().slice(0, 160),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
