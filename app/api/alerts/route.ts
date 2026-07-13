import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'
import { normalizeFilters, alertSignature, alertLabel, type AlertFilters } from '@/lib/alertFilters'

const MAX_ALERTS = 30

function cleanPlace(v: unknown): string {
  return String(v || '').trim().replace(/\s+/g, ' ').slice(0, 80)
}

/* Saved search alerts — members can keep many, each with its own filters.
   Server-only table (RLS deny); all access flows through the session cookie. */
export async function GET() {
  try {
    assertAdminConfigured()
    const profileId = await getSessionProfileId()
    if (!profileId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    const { data } = await supabaseAdmin.from('saved_alerts')
      .select('id, label, native_place, current_location, filters, created_at')
      .eq('profile_id', profileId).order('created_at', { ascending: false })
    return NextResponse.json({ alerts: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const profileId = await getSessionProfileId()
    if (!profileId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const action = body.action || 'create'

    if (action === 'delete') {
      if (!body.id) return NextResponse.json({ error: 'Missing alert id' }, { status: 400 })
      await supabaseAdmin.from('saved_alerts').delete().eq('id', body.id).eq('profile_id', profileId)
      return NextResponse.json({ ok: true })
    }

    const nativePlace = cleanPlace(body.nativePlace)
    const currentLocation = cleanPlace(body.currentLocation)
    const filters = normalizeFilters(body.filters as AlertFilters)
    const signature = alertSignature(nativePlace, currentLocation, filters)

    // Nothing to alert on — need at least a place or one filter.
    if (!nativePlace && Object.keys(filters).length === 0 && !currentLocation) {
      return NextResponse.json({ error: 'Add a native place or a filter before saving an alert' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin.from('saved_alerts')
      .select('id').eq('profile_id', profileId).eq('signature', signature).maybeSingle()

    if (action === 'check') {
      return NextResponse.json({ saved: Boolean(existing?.id), id: existing?.id ?? null })
    }

    if (existing?.id) {
      return NextResponse.json({ ok: true, id: existing.id, already: true })
    }

    const { count } = await supabaseAdmin.from('saved_alerts')
      .select('id', { count: 'exact', head: true }).eq('profile_id', profileId)
    if ((count ?? 0) >= MAX_ALERTS) {
      return NextResponse.json({ error: `You can keep up to ${MAX_ALERTS} alerts. Remove one to add another.` }, { status: 400 })
    }

    const { data: me } = await supabaseAdmin.from('profiles').select('user_id').eq('id', profileId).maybeSingle()
    const label = cleanPlace(body.label) || alertLabel(nativePlace, currentLocation, filters)

    const { data: inserted, error } = await supabaseAdmin.from('saved_alerts').insert({
      profile_id: profileId, user_id: me?.user_id ?? null,
      label, native_place: nativePlace || null, current_location: currentLocation || null,
      filters, signature,
    }).select('id').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, id: inserted?.id, label })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
