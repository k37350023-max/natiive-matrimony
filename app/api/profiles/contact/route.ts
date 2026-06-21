import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Returns a profile's contact details ONLY when the requester is connected
   (a match exists / interest accepted). Identity from the session cookie.
   Otherwise returns unlocked:false so the UI can show a "pending" state. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { profileId } = await req.json()
    if (!profileId) return NextResponse.json({ error: 'Missing profile' }, { status: 400 })

    const { data: match } = await supabaseAdmin.from('matches').select('id')
      .or(`and(user1.eq.${meId},user2.eq.${profileId}),and(user1.eq.${profileId},user2.eq.${meId})`)
      .maybeSingle()
    const { data: interest } = await supabaseAdmin.from('interests').select('status')
      .or(`and(from_user.eq.${meId},to_user.eq.${profileId}),and(from_user.eq.${profileId},to_user.eq.${meId})`)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()

    const unlocked = interest?.status === 'accepted'
    if (!unlocked) return NextResponse.json({ unlocked: false, hasMatch: !!match })

    const { data: p } = await supabaseAdmin.from('profiles')
      .select('phone, email').eq('id', profileId).maybeSingle()
    return NextResponse.json({ unlocked: true, phone: p?.phone || null, email: p?.email || null })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
