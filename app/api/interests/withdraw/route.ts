import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { interestId } = await req.json()
    if (!interestId) return NextResponse.json({ error: 'Missing interest' }, { status: 400 })

    const { data: interest } = await supabaseAdmin.from('interests')
      .select('id, from_user, status')
      .eq('id', interestId)
      .maybeSingle()
    if (!interest) return NextResponse.json({ error: 'Interest not found' }, { status: 404 })
    if (interest.from_user !== meId) return NextResponse.json({ error: 'Not your interest to withdraw' }, { status: 403 })
    if (interest.status !== 'pending') return NextResponse.json({ error: 'Only pending interests can be withdrawn' }, { status: 400 })

    await supabaseAdmin.from('interests').delete().eq('id', interestId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
