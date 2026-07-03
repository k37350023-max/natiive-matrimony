import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { requestId, approve } = await req.json()
    if (!requestId) return NextResponse.json({ error: 'Missing request' }, { status: 400 })

    const { data: request } = await supabaseAdmin.from('field_requests')
      .select('id, from_user, to_user')
      .eq('id', requestId)
      .maybeSingle()
    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    if (request.to_user !== meId) return NextResponse.json({ error: 'Not your request to respond to' }, { status: 403 })

    await supabaseAdmin.from('field_requests')
      .update({ status: approve ? 'approved' : 'declined' })
      .eq('id', requestId)

    if (approve) {
      const [{ data: me }, { data: requester }] = await Promise.all([
        supabaseAdmin.from('profiles').select('full_name').eq('id', meId).maybeSingle(),
        supabaseAdmin.from('profiles').select('user_id').eq('id', request.from_user).maybeSingle(),
      ])
      if (requester?.user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: requester.user_id,
          type: 'field_request_approved',
          message: `${me?.full_name || 'Someone'} approved your request to see their private info`,
          from_profile_id: meId,
          read: false,
          link: `/profile/${meId}`,
        })
      }
    }

    return NextResponse.json({ ok: true, approved: Boolean(approve) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
