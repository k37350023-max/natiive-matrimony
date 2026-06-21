import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { setSession } from '@/lib/session'

/* Verifies email/password server-side, then issues the trusted session cookie.
   The browser never gets to assert who it is — identity comes from this check. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Verify credentials against Supabase Auth (anon client, no session persisted).
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('id').eq('user_id', data.user.id).maybeSingle()
    if (!profile) {
      return NextResponse.json({ error: 'No profile found for this account' }, { status: 404 })
    }

    await setSession(profile.id)
    supabaseAdmin.from('profiles').update({ last_login_at: new Date().toISOString() })
      .eq('id', profile.id).then(() => {})

    return NextResponse.json({ profileId: profile.id, userId: data.user.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
