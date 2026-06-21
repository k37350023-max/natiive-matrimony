import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Update the signed-in user's OWN profile only (id from session cookie).
   Server-side allowlist prevents tampering with trust/account fields like
   status, verified, premium_expires_at, member_number, user_id, email. */
const EDITABLE = new Set([
  'full_name', 'gender', 'date_of_birth', 'phone', 'birth_time', 'birth_place',
  'profession', 'company', 'annual_income', 'visa_status', 'education', 'about',
  'native_region', 'native_state', 'native_district', 'current_city', 'current_state',
  'height_cm', 'caste', 'mother_tongue', 'family_type', 'religion',
  'father_name', 'father_occupation', 'mother_name', 'mother_occupation',
  'siblings', 'siblings_married', 'star', 'rashi', 'gotra', 'manglik',
  'diet', 'smoking', 'drinking', 'marital_status', 'profile_created_by',
  'pref_age_min', 'pref_age_max', 'photo_url', 'hidden_fields', 'photo_visibility',
])

export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { fields } = await req.json()
    if (!fields || typeof fields !== 'object') {
      return NextResponse.json({ error: 'No fields' }, { status: 400 })
    }

    // Keep only allowlisted keys.
    const clean: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(fields)) if (EDITABLE.has(k)) clean[k] = v
    if (Object.keys(clean).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('profiles').update(clean).eq('id', meId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
