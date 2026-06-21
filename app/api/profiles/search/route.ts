import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'

/* Secured browse/search endpoint.
   Runs the profile query server-side with the service_role key and returns
   ONLY non-sensitive columns — phone, email, and other PII never leave the
   server. Mirrors the DB-level filters the browse page used to run directly;
   the page keeps doing its fine-grained client-side filtering on this safe set. */

// Columns safe to expose to the browser for browsing/searching.
const SAFE_COLUMNS = [
  'id', 'full_name', 'gender', 'date_of_birth', 'profession', 'education',
  'annual_income', 'about', 'native_district', 'native_state', 'native_region',
  'current_city', 'current_state', 'height_cm', 'religion', 'caste',
  'mother_tongue', 'family_type', 'verified', 'status', 'created_at',
  'photo_url', 'photo_visibility', 'last_login_at', 'marital_status',
  'profile_created_by', 'member_number',
].join(', ')

export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const body = await req.json().catch(() => ({}))
    const { oppositeGender, region, state, district, casteFilter } = body as {
      oppositeGender?: string; region?: string; state?: string
      district?: string; casteFilter?: string
    }

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    let q = supabaseAdmin.from('profiles').select(SAFE_COLUMNS).eq('status', 'approved')
    if (oppositeGender) q = q.eq('gender', oppositeGender)
    if (region)         q = q.eq('native_region', region)
    if (state)          q = q.eq('native_state', state)
    if (district)       q = q.eq('native_district', district)
    if (casteFilter)    q = q.ilike('caste', `%${casteFilter}%`)

    const { data, error } = await q
      .or(`last_login_at.gt.${fourteenDaysAgo},last_login_at.is.null`)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ profiles: data ?? [] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
