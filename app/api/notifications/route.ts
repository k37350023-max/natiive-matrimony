import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Notification writes, scoped to the signed-in user (from the session cookie).
   Notifications are keyed by auth user_id, which we resolve from the session
   profile — the client can't act on anyone else's notifications. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { action, id } = await req.json()
    const { data: me } = await supabaseAdmin.from('profiles').select('user_id').eq('id', meId).maybeSingle()
    if (!me?.user_id) return NextResponse.json({ error: 'No account' }, { status: 404 })
    const uid = me.user_id

    if (action === 'markAllRead') {
      await supabaseAdmin.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false)
    } else if (action === 'markRead' && id) {
      await supabaseAdmin.from('notifications').update({ read: true }).eq('id', id).eq('user_id', uid)
    } else if (action === 'dismiss' && id) {
      await supabaseAdmin.from('notifications').delete().eq('id', id).eq('user_id', uid)
    } else {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
