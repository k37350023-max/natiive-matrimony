import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { matchId, messageId } = await req.json()
    if (!matchId) return NextResponse.json({ error: 'Missing match' }, { status: 400 })

    const { data: match } = await supabaseAdmin.from('matches')
      .select('user1, user2')
      .eq('id', matchId)
      .maybeSingle()
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    if (match.user1 !== meId && match.user2 !== meId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = supabaseAdmin.from('messages')
      .update({ read: true })
      .eq('match_id', matchId)
      .neq('from_profile_id', meId)
    if (messageId) query = query.eq('id', messageId)
    await query

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
