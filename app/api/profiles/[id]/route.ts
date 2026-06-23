import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Single profile read. Contact PII (phone, email) is returned ONLY to the
   profile's owner — identity comes from the session cookie. Everyone else
   gets it stripped, so it never reaches the browser. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertAdminConfigured()
    const { id } = await params
    const viewerId = await getSessionProfileId()

    const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', id).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data) return NextResponse.json({ profile: null }, { status: 404 })

    const isOwner = viewerId === data.id
    let isAccepted = false
    if (viewerId && !isOwner) {
      const { data: interest } = await supabaseAdmin.from('interests').select('status')
        .or(`and(from_user.eq.${viewerId},to_user.eq.${data.id}),and(from_user.eq.${data.id},to_user.eq.${viewerId})`)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      isAccepted = interest?.status === 'accepted'
    }
    if (!isOwner && !isAccepted) {
      data.full_name = 'Name hidden'
      data.phone = null
      data.email = null
      data.photo_url = null
      data.about = null
      data.birth_time = null
      data.birth_place = null
      data.company = null
      data.annual_income = null
      data.visa_status = null
      data.education = null
      data.height_cm = null
      data.religion = null
      data.caste = null
      data.mother_tongue = null
      data.family_type = null
      data.father_name = null
      data.father_occupation = null
      data.mother_name = null
      data.mother_occupation = null
      data.siblings = null
      data.siblings_married = null
      data.star = null
      data.rashi = null
      data.gotra = null
      data.manglik = null
      data.diet = null
      data.smoking = null
      data.drinking = null
    }
    if (!isOwner && isAccepted) {
      data.hidden_fields = []
    }
    return NextResponse.json({ profile: data, isOwner, isAccepted })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
