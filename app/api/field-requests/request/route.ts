import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

const HIDEABLE: Record<string, string> = {
  name: 'name',
  photo: 'photo',
  phone: 'phone number',
  email: 'email',
  dob: 'date of birth',
  family: 'family details',
  astrology: 'astrology details',
}

export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const fromId = await getSessionProfileId()
    if (!fromId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { toProfileId, fields } = await req.json()
    const requestedFields = Array.isArray(fields)
      ? fields.filter((field): field is string => typeof field === 'string' && Boolean(HIDEABLE[field]))
      : []
    if (!toProfileId || toProfileId === fromId) return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
    if (!requestedFields.length) return NextResponse.json({ error: 'Choose at least one field' }, { status: 400 })

    const { data: existing } = await supabaseAdmin.from('field_requests')
      .select('*')
      .eq('from_user', fromId)
      .eq('to_user', toProfileId)
      .maybeSingle()

    let request = existing
    if (existing) {
      const merged = [...new Set([...(existing.fields || []), ...requestedFields])]
      const { data } = await supabaseAdmin.from('field_requests')
        .update({ fields: merged, status: 'pending' })
        .eq('id', existing.id)
        .select()
        .maybeSingle()
      request = data
    } else {
      const { data } = await supabaseAdmin.from('field_requests')
        .insert({ from_user: fromId, to_user: toProfileId, fields: requestedFields, status: 'pending' })
        .select()
        .maybeSingle()
      request = data
    }

    const [{ data: me }, { data: owner }] = await Promise.all([
      supabaseAdmin.from('profiles').select('full_name').eq('id', fromId).maybeSingle(),
      supabaseAdmin.from('profiles').select('user_id').eq('id', toProfileId).maybeSingle(),
    ])
    if (owner?.user_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: owner.user_id,
        type: 'field_request',
        message: `${me?.full_name || 'Someone'} requested to see your ${requestedFields.map(f => HIDEABLE[f]).join(', ')}`,
        from_profile_id: fromId,
        read: false,
        link: `/profile/${fromId}`,
      })
    }

    return NextResponse.json({ ok: true, request })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
