import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Post a chat message. Sender = session; the server confirms the sender is a
   participant in the match before inserting, so you can't post into a thread
   you're not part of or impersonate the other person. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { matchId, content } = await req.json()
    const text = String(content || '').trim()
    if (!matchId || !text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (text.length > 2000) return NextResponse.json({ error: 'Message too long' }, { status: 400 })

    const { data: match } = await supabaseAdmin.from('matches')
      .select('user1, user2').eq('id', matchId).maybeSingle()
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    if (match.user1 !== meId && match.user2 !== meId) {
      return NextResponse.json({ error: 'Not part of this conversation' }, { status: 403 })
    }
    const otherId = match.user1 === meId ? match.user2 : match.user1

    // Locked until the request is accepted — only the initial message exists till then.
    const { data: interest } = await supabaseAdmin.from('interests').select('status')
      .or(`and(from_user.eq.${meId},to_user.eq.${otherId}),and(from_user.eq.${otherId},to_user.eq.${meId})`)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (interest?.status === 'pending') {
      return NextResponse.json({ error: 'Chat is locked until your request is accepted.' }, { status: 409 })
    }

    const { data: inserted, error } = await supabaseAdmin.from('messages')
      .insert({ match_id: matchId, from_profile_id: meId, content: text }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ message: inserted })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
