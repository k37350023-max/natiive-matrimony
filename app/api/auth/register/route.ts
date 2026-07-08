import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'
import { setSession } from '@/lib/session'
import { otpConfigured, verifyOtpToken } from '@/lib/otpToken'
import { firebaseAdminConfigured, normalizePhoneNumber, verifyFirebaseIdToken } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

const FOUNDING_MEMBER_LIMIT = 1000
const FOUNDING_MEMBER_YEARS = 2
const PREMIUM_TRIAL_MONTHS = 3

/* Creates the account server-side after re-verifying the OTP, then issues the
   trusted session cookie. Profile creation no longer happens in the browser. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const b = await req.json()
    const { full_name, gender, phone, date_of_birth, native_state, native_district, current_city, profile_created_by, otp, token, firebaseIdToken } = b

    if (!full_name || !gender || !phone || !date_of_birth || !native_state || !native_district || !current_city || !profile_created_by) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const normalizedPhone = normalizePhoneNumber(phone)
    if (firebaseIdToken) {
      if (!firebaseAdminConfigured()) {
        return NextResponse.json({ error: 'Firebase phone verification is not configured on the server' }, { status: 503 })
      }
      const decoded = await verifyFirebaseIdToken(firebaseIdToken)
      const verifiedPhone = normalizePhoneNumber(decoded.phone_number || '')
      if (!verifiedPhone || verifiedPhone !== normalizedPhone) {
        return NextResponse.json({ error: 'Mobile verification did not match this number' }, { status: 400 })
      }
    } else {
      if (!otpConfigured()) {
        return NextResponse.json(
          { error: 'SMS verification is temporarily unavailable. Please try again shortly.' },
          { status: 503 },
        )
      }

      // Re-verify the OTP token server-side (never trust the client's "verified" claim).
      const verified = verifyOtpToken(normalizedPhone, otp, token)
      if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 400 })
    }

    // Synthesised credentials (mobile-first). Real phone-native auth can replace later.
    const digits = normalizedPhone.replace(/[^0-9]/g, '')
    const synthEmail = `${digits}@phone.native`
    const synthPass = `Nm-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: synthEmail, password: synthPass, email_confirm: true,
    })
    if (cErr || !created.user) {
      const dup = cErr?.message?.toLowerCase().includes('already')
      return NextResponse.json({ error: dup ? 'This mobile number is already registered' : (cErr?.message || 'Signup failed') }, { status: 400 })
    }

    const { count: districtCount } = await supabaseAdmin.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('native_state', native_state)
      .eq('native_district', native_district)
      .eq('status', 'approved')

    const foundingMemberEligible = (districtCount ?? 0) < FOUNDING_MEMBER_LIMIT
    const premiumExpiresAt = new Date()
    if (foundingMemberEligible) {
      premiumExpiresAt.setFullYear(premiumExpiresAt.getFullYear() + FOUNDING_MEMBER_YEARS)
    } else {
      premiumExpiresAt.setMonth(premiumExpiresAt.getMonth() + PREMIUM_TRIAL_MONTHS)
    }

    const { data: profile, error: pErr } = await supabaseAdmin.from('profiles').insert({
      user_id: created.user.id,
      full_name: String(full_name).trim(),
      gender, phone: normalizedPhone, date_of_birth,
      native_state, native_district, native_region: native_state,
      current_city: String(current_city).trim(),
      marital_status: 'never_married', religion: 'Hindu', mother_tongue: null,
      profile_created_by, photo_url: '', photo_visibility: 'public',
      status: 'approved', verified: false,
      phone_verified: true,  // phone was OTP/Firebase verified immediately above
      premium_expires_at: premiumExpiresAt.toISOString(),
    }).select('id').maybeSingle()
    if (pErr || !profile) {
      return NextResponse.json({ error: pErr?.message || 'Could not create profile' }, { status: 400 })
    }

    await setSession(profile.id)

    // Fulfil the "Notify Me" waitlist: members waiting on this native place get
    // an in-app notification (best-effort, never blocks signup).
    ;(async () => {
      const { data: waiters } = await supabaseAdmin.from('native_place_waitlist')
        .select('id, profile_id').ilike('native_place', native_district)
        .is('notified_at', null).not('profile_id', 'is', null)
      if (!waiters?.length) return
      const ids = waiters.map(w => w.profile_id).filter(Boolean) as string[]
      const { data: users } = await supabaseAdmin.from('profiles').select('id, user_id').in('id', ids)
      for (const u of users || []) {
        if (!u.user_id || u.id === profile.id) continue
        await supabaseAdmin.from('notifications').insert({
          user_id: u.user_id, type: 'waitlist_joined',
          message: `Someone from ${native_district} just joined — take a look`,
          from_profile_id: profile.id, read: false, link: `/browse?native_place=${encodeURIComponent(native_district)}`,
        })
      }
      await supabaseAdmin.from('native_place_waitlist')
        .update({ notified_at: new Date().toISOString() }).in('id', waiters.map(w => w.id))
    })().catch(() => {})

    // Saved search alerts: notify members whose alert native place matches this
    // new profile's native district (best-effort, opposite gender only).
    ;(async () => {
      const { data: alerts } = await supabaseAdmin.from('saved_alerts')
        .select('id, user_id, profile_id, label')
        .ilike('native_place', native_district).not('user_id', 'is', null)
      if (!alerts?.length) return
      const { data: owners } = await supabaseAdmin.from('profiles')
        .select('id, gender').in('id', alerts.map(a => a.profile_id))
      const genderById = new Map((owners || []).map(o => [o.id, o.gender]))
      const matched: string[] = []
      for (const a of alerts) {
        if (a.profile_id === profile.id) continue
        if (genderById.get(a.profile_id) === gender) continue // opposite gender only
        await supabaseAdmin.from('notifications').insert({
          user_id: a.user_id, type: 'alert_match_joined',
          message: `New profile from ${native_district} matches your alert "${a.label}"`,
          from_profile_id: profile.id, read: false,
          link: `/browse?native_place=${encodeURIComponent(native_district)}`,
        })
        matched.push(a.id)
      }
      if (matched.length) {
        await supabaseAdmin.from('saved_alerts')
          .update({ last_notified_at: new Date().toISOString() }).in('id', matched)
      }
    })().catch(() => {})

    return NextResponse.json({
      profileId: profile.id,
      userId: created.user.id,
      foundingMemberEligible,
      premiumTrialMonths: foundingMemberEligible ? null : PREMIUM_TRIAL_MONTHS,
      premiumExpiresAt: premiumExpiresAt.toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signup failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
