import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Add/remove a shortlist entry for the signed-in user (from the session cookie). */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const byId = await getSessionProfileId()
    if (!byId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { profileId, action } = await req.json()
    if (!profileId || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    if (action === 'remove') {
      await supabaseAdmin.from('shortlists').delete()
        .eq('by_profile_id', byId).eq('profile_id', profileId)
    } else {
      const { data: existing } = await supabaseAdmin.from('shortlists')
        .select('id').eq('by_profile_id', byId).eq('profile_id', profileId).maybeSingle()
      if (!existing) {
        await supabaseAdmin.from('shortlists').insert({ by_profile_id: byId, profile_id: profileId })
      }
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
