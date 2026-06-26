import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Unmatch / withdraw. A participant (session) removes the match, its messages,
   and the interest(s) between the two — usable to withdraw a pending request or
   end an accepted match. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { matchId } = await req.json()
    const { data: match } = await supabaseAdmin.from('matches')
      .select('user1, user2').eq('id', matchId).maybeSingle()
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (match.user1 !== meId && match.user2 !== meId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const otherId = match.user1 === meId ? match.user2 : match.user1

    await supabaseAdmin.from('messages').delete().eq('match_id', matchId)
    await supabaseAdmin.from('matches').delete().eq('id', matchId)
    await supabaseAdmin.from('interests').delete()
      .or(`and(from_user.eq.${meId},to_user.eq.${otherId}),and(from_user.eq.${otherId},to_user.eq.${meId})`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
