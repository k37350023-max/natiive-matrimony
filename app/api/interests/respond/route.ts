import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Accept/decline an interest. Only the RECIPIENT (session) may respond, and
   only to an interest addressed to them — enforced server-side. Accepting
   creates the mutual match. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { interestId, accept } = await req.json()
    if (!interestId) return NextResponse.json({ error: 'Missing interest' }, { status: 400 })

    const { data: interest } = await supabaseAdmin.from('interests')
      .select('id, from_user, to_user').eq('id', interestId).maybeSingle()
    if (!interest) return NextResponse.json({ error: 'Interest not found' }, { status: 404 })
    if (interest.to_user !== meId) return NextResponse.json({ error: 'Not your interest to respond to' }, { status: 403 })

    const fromUser = interest.from_user

    if (!accept) {
      // Decline → remove the conversation entirely for both sides.
      const { data: m } = await supabaseAdmin.from('matches').select('id')
        .or(`and(user1.eq.${meId},user2.eq.${fromUser}),and(user1.eq.${fromUser},user2.eq.${meId})`)
        .maybeSingle()
      if (m) { await supabaseAdmin.from('messages').delete().eq('match_id', m.id); await supabaseAdmin.from('matches').delete().eq('id', m.id) }
      await supabaseAdmin.from('interests').delete().eq('id', interestId)
      return NextResponse.json({ ok: true, accepted: false })
    }

    await supabaseAdmin.from('interests').update({ status: 'accepted' }).eq('id', interestId)

    // Create the match if it doesn't exist.
    const { data: existing } = await supabaseAdmin.from('matches').select('id')
      .or(`and(user1.eq.${meId},user2.eq.${fromUser}),and(user1.eq.${fromUser},user2.eq.${meId})`)
      .maybeSingle()
    let matchId = existing?.id
    if (!existing) {
      const { data: created } = await supabaseAdmin.from('matches')
        .insert({ user1: fromUser, user2: meId }).select('id').single()
      matchId = created?.id
    }

    const [{ data: sender }, { data: me }] = await Promise.all([
      supabaseAdmin.from('profiles').select('user_id, full_name').eq('id', fromUser).maybeSingle(),
      supabaseAdmin.from('profiles').select('full_name').eq('id', meId).maybeSingle(),
    ])
    if (sender?.user_id) {
      supabaseAdmin.from('notifications').insert({
        user_id: sender.user_id, type: 'interest_accepted',
        message: `${me?.full_name || 'Someone'} accepted your interest!`,
        from_profile_id: meId, read: false, link: '/matches',
      }).then(() => {})
    }

    return NextResponse.json({ ok: true, accepted: true, matchId, senderName: sender?.full_name || null })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
