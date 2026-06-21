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
    if (!isOwner) {
      data.phone = null
      data.email = null
    }
    return NextResponse.json({ profile: data, isOwner })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
