import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

function cleanPlace(v: unknown): string {
  return String(v || '').trim().replace(/\s+/g, ' ').slice(0, 80)
}

export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const profileId = await getSessionProfileId()
    if (!profileId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { nativePlace, currentLocation, action } = await req.json().catch(() => ({}))
    const place = cleanPlace(nativePlace)
    const location = cleanPlace(currentLocation)
    if (!place) return NextResponse.json({ error: 'Choose a native place before saving an alert' }, { status: 400 })

    const { data: me } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .maybeSingle()
    if (!me?.user_id) return NextResponse.json({ error: 'No account found' }, { status: 404 })

    const link = `/browse?native_place=${encodeURIComponent(place)}${location ? `&current_location=${encodeURIComponent(location)}` : ''}`

    if (action === 'remove') {
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', me.user_id)
        .eq('type', 'place_alert_saved')
        .eq('link', link)
      return NextResponse.json({ ok: true, saved: false })
    }

    const message = location
      ? `Alert saved for ${place}. We will notify you when matching families join near ${location}.`
      : `Alert saved for ${place}. We will notify you when matching families join.`

    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', me.user_id)
      .eq('type', 'place_alert_saved')
      .eq('link', link)
      .maybeSingle()

    if (existing?.id) {
      await supabaseAdmin
        .from('notifications')
        .update({ message, read: false, created_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', me.user_id)
    } else {
      const { error } = await supabaseAdmin.from('notifications').insert({
        user_id: me.user_id,
        type: 'place_alert_saved',
        message,
        from_profile_id: null,
        read: false,
        link,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, saved: true, message, link })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not save alert'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    assertAdminConfigured()
    const profileId = await getSessionProfileId()
    if (!profileId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const url = new URL(req.url)
    const place = cleanPlace(url.searchParams.get('nativePlace'))
    const location = cleanPlace(url.searchParams.get('currentLocation'))
    if (!place) return NextResponse.json({ saved: false })

    const { data: me } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .maybeSingle()
    if (!me?.user_id) return NextResponse.json({ error: 'No account found' }, { status: 404 })

    const link = `/browse?native_place=${encodeURIComponent(place)}${location ? `&current_location=${encodeURIComponent(location)}` : ''}`
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', me.user_id)
      .eq('type', 'place_alert_saved')
      .eq('link', link)
      .maybeSingle()

    return NextResponse.json({ saved: Boolean(data?.id) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not load alert'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
