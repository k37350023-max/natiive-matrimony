import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Lock state for a chat thread. While an interest between the two is still
   'pending', the thread is locked (only the initial message exists) until the
   recipient accepts. Returns who the viewer is relative to the request. */
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

    const { data: interest } = await supabaseAdmin.from('interests')
      .select('id, from_user, status')
      .or(`and(from_user.eq.${meId},to_user.eq.${otherId}),and(from_user.eq.${otherId},to_user.eq.${meId})`)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()

    const status = interest?.status === 'accepted' ? 'accepted'
      : interest?.status === 'pending' ? 'pending' : 'accepted' // legacy matches w/o interest = open
    const iAmSender = interest ? interest.from_user === meId : false

    return NextResponse.json({ status, locked: status === 'pending', iAmSender, interestId: interest?.id || null })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
