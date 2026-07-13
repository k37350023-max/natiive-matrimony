import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { getSessionProfileId } from '@/lib/session'

/* Let a signed-in member set an email + password so they can log in with either
   email+password or an email code. Syncs both to the underlying auth user
   (phone accounts are created with a synthetic email/password) and stores the
   real email on the profile. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const meId = await getSessionProfileId()
    if (!meId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { email, password } = await req.json().catch(() => ({}))
    const normalized = String(email || '').trim().toLowerCase()
    if (!normalized.includes('@')) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    if (String(password || '').length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    const { data: me } = await supabaseAdmin.from('profiles').select('user_id').eq('id', meId).maybeSingle()
    if (!me?.user_id) return NextResponse.json({ error: 'No account found' }, { status: 404 })

    // Make sure the email isn't already used by a DIFFERENT member.
    const { data: clash } = await supabaseAdmin.from('profiles')
      .select('id').ilike('email', normalized).neq('id', meId).maybeSingle()
    if (clash) return NextResponse.json({ error: 'That email is already in use by another account' }, { status: 409 })

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(me.user_id, {
      email: normalized, password, email_confirm: true,
    })
    if (authErr) {
      const dup = authErr.message?.toLowerCase().includes('already')
      return NextResponse.json({ error: dup ? 'That email is already in use' : authErr.message }, { status: 400 })
    }

    await supabaseAdmin.from('profiles').update({ email: normalized }).eq('id', meId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not set password'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
