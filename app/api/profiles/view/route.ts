import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const viewerId = await getSessionProfileId()
    if (!viewerId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { viewedId } = await req.json()
    if (!viewedId || viewedId === viewerId) return NextResponse.json({ ok: true })

    const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabaseAdmin.from('profile_views')
      .select('id', { count: 'exact', head: true })
      .eq('viewer_id', viewerId)
      .eq('viewed_id', viewedId)
      .gte('viewed_at', since)

    await supabaseAdmin.from('profile_views').insert({ viewer_id: viewerId, viewed_id: viewedId })

    if (!recentCount) {
      const [{ data: viewer }, { data: owner }] = await Promise.all([
        supabaseAdmin.from('profiles').select('full_name, hidden_fields').eq('id', viewerId).maybeSingle(),
        supabaseAdmin.from('profiles').select('user_id').eq('id', viewedId).maybeSingle(),
      ])
      if (owner?.user_id && viewer?.full_name) {
        const viewerName = Array.isArray(viewer.hidden_fields) && viewer.hidden_fields.includes('name')
          ? 'Name hidden'
          : viewer.full_name
        await supabaseAdmin.from('notifications').insert({
          user_id: owner.user_id,
          type: 'profile_view',
          message: `${viewerName} viewed your profile`,
          from_profile_id: viewerId,
          read: false,
          link: `/profile/${viewerId}`,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
