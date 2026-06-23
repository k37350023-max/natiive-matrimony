import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Send an interest. The sender is taken from the trusted session cookie —
   the client cannot send "as" someone else. Stays pending until accepted. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const fromId = await getSessionProfileId()
    if (!fromId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { toProfileId } = await req.json()
    if (!toProfileId) return NextResponse.json({ error: 'Missing target' }, { status: 400 })
    if (toProfileId === fromId) return NextResponse.json({ error: 'Cannot send to yourself' }, { status: 400 })

    // Idempotent: if an interest already exists, return it with its thread.
    const { data: existing } = await supabaseAdmin.from('interests')
      .select('id,status').eq('from_user', fromId).eq('to_user', toProfileId).maybeSingle()
    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id, status: existing.status })
    }

    const { data: created, error } = await supabaseAdmin.from('interests')
      .insert({ from_user: fromId, to_user: toProfileId, status: 'pending' })
      .select('id,status')
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const { data: me } = await supabaseAdmin.from('profiles').select('full_name').eq('id', fromId).maybeSingle()

    // Best-effort notification to the recipient.
    const { data: target } = await supabaseAdmin.from('profiles').select('user_id').eq('id', toProfileId).maybeSingle()
    if (target?.user_id) {
      supabaseAdmin.from('notifications').insert({
        user_id: target.user_id, type: 'interest_received',
        message: `${me?.full_name || 'Someone'} sent you an interest request`,
        from_profile_id: fromId, read: false, link: '/interests',
      }).then(() => {})
    }

    return NextResponse.json({ ok: true, id: created?.id, status: created?.status || 'pending' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
