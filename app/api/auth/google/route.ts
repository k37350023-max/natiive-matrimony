import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { setSession } from '@/lib/session'
import { firebaseAdminConfigured, verifyFirebaseIdToken } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

/* Google sign-in. The client does the Google popup via Firebase and sends us the
   Firebase ID token; we verify it server-side, then link by EMAIL:
   - matching profile  → sign in (set session)
   - no profile        → tell the client to finish a quick signup (email prefilled) */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    if (!firebaseAdminConfigured()) {
      return NextResponse.json({ error: 'Google sign-in is not configured on the server' }, { status: 503 })
    }
    const { idToken } = await req.json().catch(() => ({}))
    if (!idToken) return NextResponse.json({ error: 'Missing Google token' }, { status: 400 })

    const decoded = await verifyFirebaseIdToken(idToken)
    const email = String(decoded.email || '').trim().toLowerCase()
    const name = String((decoded as { name?: string }).name || '').trim()
    if (!email) return NextResponse.json({ error: 'Google account has no email' }, { status: 400 })

    // Link by email — one profile per person, shared across phone/email/Google.
    const { data: profile } = await supabaseAdmin.from('profiles')
      .select('id, user_id').ilike('email', email).maybeSingle()

    if (profile) {
      await setSession(profile.id)
      supabaseAdmin.from('profiles').update({ last_login_at: new Date().toISOString() })
        .eq('id', profile.id).then(() => {})
      return NextResponse.json({ ok: true, profileId: profile.id, userId: profile.user_id })
    }

    // No account yet — client will send them through the short signup with the
    // Google-verified email prefilled (register verifies the same token).
    return NextResponse.json({ ok: true, needsProfile: true, email, name })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Google sign-in failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
