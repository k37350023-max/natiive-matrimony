import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

export async function POST() {
  try {
    assertAdminConfigured()
    const profileId = await getSessionProfileId()
    if (!profileId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    await supabaseAdmin.from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', profileId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
