import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* "Notify Me" waitlist for native places with no profiles yet.
   Logged-in members are recorded by profile id; guests leave a mobile number.
   Table is server-only (RLS deny) — writes go through the service role here. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const { nativePlace, phone } = await req.json()
    const place = String(nativePlace || '').trim()
    if (!place || place.length > 80) {
      return NextResponse.json({ error: 'Enter a native place' }, { status: 400 })
    }

    const profileId = await getSessionProfileId()
    const mobile = String(phone || '').replace(/[^0-9+]/g, '')
    if (!profileId && mobile.replace(/\D/g, '').length < 7) {
      return NextResponse.json({ error: 'Enter a valid mobile number so we can notify you' }, { status: 400 })
    }

    // One entry per person per place.
    const dupe = supabaseAdmin.from('native_place_waitlist').select('id').ilike('native_place', place).limit(1)
    const { data: existing } = profileId
      ? await dupe.eq('profile_id', profileId).maybeSingle()
      : await dupe.eq('mobile_number', mobile).maybeSingle()
    if (existing) return NextResponse.json({ ok: true, already: true })

    const { error } = await supabaseAdmin.from('native_place_waitlist').insert({
      native_place: place,
      profile_id: profileId,
      mobile_number: profileId ? null : mobile,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
