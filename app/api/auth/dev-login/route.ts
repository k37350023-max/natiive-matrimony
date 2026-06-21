import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { setSession } from '@/lib/session'

/* One-click TEST sign-in. Creates (once) and signs into a stable test account
   so you can demo the full flow without typing credentials.

   SAFETY: disabled in production unless DEV_LOGIN_ENABLED=true is explicitly set.
   Next sets NODE_ENV=production on a prod build, so this is off by default live. */

const ACCOUNTS: Record<string, {
  email: string; full_name: string; gender: string; phone: string
  native_state: string; native_district: string; profession: string; about: string
  photo_url: string; height_cm: number
}> = {
  groom: {
    email: 'test-groom@native.test', full_name: 'Aarav Test (Groom)', gender: 'male',
    phone: '+910000000001', native_state: 'Telangana', native_district: 'Hyderabad',
    profession: 'Software Engineer', about: 'Test account for demoing the groom side.',
    photo_url: 'https://randomuser.me/api/portraits/men/41.jpg', height_cm: 178,
  },
  bride: {
    email: 'test-bride@native.test', full_name: 'Ananya Test (Bride)', gender: 'female',
    phone: '+910000000002', native_state: 'Telangana', native_district: 'Hyderabad',
    profession: 'Product Manager', about: 'Test account for demoing the bride side.',
    photo_url: 'https://randomuser.me/api/portraits/women/41.jpg', height_cm: 162,
  },
}

function devAllowed() {
  return process.env.NODE_ENV !== 'production' || process.env.DEV_LOGIN_ENABLED === 'true'
}

export async function POST(req: Request) {
  try {
    if (!devAllowed()) return NextResponse.json({ error: 'Disabled' }, { status: 403 })
    assertAdminConfigured()

    const { role } = await req.json()
    const acct = ACCOUNTS[role === 'bride' ? 'bride' : 'groom']

    // Find existing test profile by email.
    let { data: profile } = await supabaseAdmin.from('profiles')
      .select('id, user_id').eq('email', acct.email).maybeSingle()

    if (!profile) {
      // Create the auth user (idempotent-ish: tolerate "already exists").
      let userId: string | undefined
      const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email: acct.email, password: `Test-${Math.random().toString(36).slice(2)}`, email_confirm: true,
      })
      if (created?.user) userId = created.user.id
      else if (cErr) {
        // Already exists → find the user id by listing.
        const { data: list } = await supabaseAdmin.auth.admin.listUsers()
        userId = list?.users.find(u => u.email === acct.email)?.id
      }
      if (!userId) return NextResponse.json({ error: 'Could not create test user' }, { status: 500 })

      const { data: inserted } = await supabaseAdmin.from('profiles').insert({
        user_id: userId, email: acct.email,
        full_name: acct.full_name, gender: acct.gender, phone: acct.phone,
        date_of_birth: '1995-06-15',
        native_state: acct.native_state, native_district: acct.native_district,
        native_region: acct.native_state, current_city: acct.native_district,
        profession: acct.profession, about: acct.about, height_cm: acct.height_cm,
        religion: 'Hindu', mother_tongue: 'Telugu', marital_status: 'never_married',
        profile_created_by: 'self', photo_url: acct.photo_url, photo_visibility: 'public',
        status: 'approved', verified: true,
        last_login_at: new Date().toISOString(),
        premium_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }).select('id, user_id').maybeSingle()
      profile = inserted
    }

    if (!profile) return NextResponse.json({ error: 'Could not load test profile' }, { status: 500 })

    await setSession(profile.id)
    return NextResponse.json({ profileId: profile.id, userId: profile.user_id, role: acct.gender === 'female' ? 'bride' : 'groom' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
