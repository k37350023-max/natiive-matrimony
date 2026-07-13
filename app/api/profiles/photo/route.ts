import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Owner-only photo record operations (the file upload itself stays client-side
   against Storage; this records the resulting URL). Identity from the session
   cookie — a client can only change its OWN photos. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { action, url, position } = await req.json()

    if (action === 'setMain') {
      if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })
      const { error } = await supabaseAdmin.from('profiles')
        .update({ photo_url: url, photo_visibility: 'public' }).eq('id', meId)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }

    if (action === 'addExtra') {
      if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })
      const { error } = await supabaseAdmin.from('profile_photos')
        .insert({ profile_id: meId, url, position: typeof position === 'number' ? position : 0 })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }

    if (action === 'removeExtra') {
      if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })
      await supabaseAdmin.from('profile_photos').delete().eq('profile_id', meId).eq('url', url)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
