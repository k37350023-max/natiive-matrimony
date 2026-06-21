'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '../components/AppHeader'
import MobileNav from '../components/MobileNav'
import AppFooter from '../components/AppFooter'

type Profile = {
  id: string; full_name: string; gender: string; date_of_birth: string | null
  photo_url: string | null; photo_visibility: string | null
  profession: string | null; education: string | null; about: string | null
  native_state: string | null; native_district: string | null
  current_city: string | null; height_cm: number | null
  religion: string | null; caste: string | null; mother_tongue: string | null
  marital_status: string | null; diet: string | null; family_type: string | null
  annual_income: string | null; visa_status: string | null
  star: string | null; rashi: string | null; manglik: string | null; gotra: string | null
  verified: boolean; member_number: number | null; premium_expires_at: string | null
  created_at: string; last_login_at: string | null
}

type ViewerProfile = {
  id: string; full_name: string; profession: string | null
  native_district: string | null; photo_url: string | null; photo_visibility: string | null
  date_of_birth: string | null
}

type ShortlistProfile = ViewerProfile

/* ─── Completeness ───────────────────────────────────────────── */
const COMPLETENESS_FIELDS: { key: keyof Profile; label: string; weight: number }[] = [
  { key: 'photo_url',       label: 'Profile photo',        weight: 20 },
  { key: 'about',           label: 'About yourself',       weight: 10 },
  { key: 'profession',      label: 'Profession',           weight: 8  },
  { key: 'education',       label: 'Education',            weight: 8  },
  { key: 'height_cm',       label: 'Height',               weight: 5  },
  { key: 'religion',        label: 'Religion',             weight: 5  },
  { key: 'caste',           label: 'Caste / Community',    weight: 5  },
  { key: 'mother_tongue',   label: 'Mother tongue',        weight: 5  },
  { key: 'marital_status',  label: 'Marital status',       weight: 5  },
  { key: 'diet',            label: 'Diet preference',      weight: 4  },
  { key: 'family_type',     label: 'Family type',          weight: 4  },
  { key: 'annual_income',   label: 'Annual income',        weight: 4  },
  { key: 'native_district', label: 'Native district',      weight: 5  },
  { key: 'current_city',    label: 'Current city',         weight: 4  },
  { key: 'star',            label: 'Star / Nakshatra',     weight: 4  },
  { key: 'rashi',           label: 'Rashi',                weight: 4  },
]

function calcCompleteness(p: Profile): { pct: number; missing: string[] } {
  let total = 0; let earned = 0; const missing: string[] = []
  COMPLETENESS_FIELDS.forEach(({ key, label, weight }) => {
    total += weight
    const val = p[key]
    if (val !== null && val !== undefined && val !== '') earned += weight
    else missing.push(label)
  })
  return { pct: Math.round((earned / total) * 100), missing }
}

function getAge(dob: string | null) {
  if (!dob) return null
  const a = Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return a > 0 ? a : null
}

function timeAgo(ts: string | null) {
  if (!ts) return null
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

/* ─── Small avatar ───────────────────────────────────────────── */
function MiniAvatar({ p, size = 40 }: { p: ViewerProfile; size?: number }) {
  const show = !!(p.photo_url && p.photo_visibility === 'public')
  const colors = ['#0B132B','#1D4E7F','#1D7F4E','#7F5A1D','#4E1D7F']
  const bg = colors[(p.full_name?.charCodeAt(0) || 0) % colors.length]
  const init = p.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {show
        ? <img src={p.photo_url!} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.35, fontWeight: 700, color: 'white' }}>{init}</span>}
    </div>
  )
}

/* ─── Stat card ──────────────────────────────────────────────── */
function StatCard({ value, label, sub, color, icon, href }: { value: number | string; label: string; sub?: string; color: string; icon: React.ReactNode; href?: string }) {
  const inner = (
    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8EDF3', padding: '18px 16px', display: 'flex', gap: '14px', alignItems: 'center', transition: 'box-shadow 0.18s, transform 0.18s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => href && ((e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'), (e.currentTarget.style.transform = 'translateY(-1px)'))}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none' }}>
      <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${color}25` }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '26px', fontWeight: 800, color: '#0F0F0F', margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#334155', margin: '3px 0 0', whiteSpace: 'nowrap' }}>{label}</p>
        {sub && <p style={{ fontSize: '10.5px', color: '#94A3B8', margin: '2px 0 0' }}>{sub}</p>}
      </div>
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

/* ─── Completeness ring SVG ──────────────────────────────────── */
function CompletenessRing({ pct }: { pct: number }) {
  const r = 44; const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 80 ? '#06D6A0' : pct >= 50 ? '#D97706' : '#0B132B'
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#E8EDF3" strokeWidth="10" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 55 55)" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x="55" y="51" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0F0F0F">{pct}%</text>
      <text x="55" y="66" textAnchor="middle" fontSize="9" fill="#94A3B8" fontWeight="600">COMPLETE</text>
    </svg>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [stats,      setStats]      = useState({ views: 0, viewsWeek: 0, interests: 0, matches: 0, shortlistCount: 0 })
  const [viewers,    setViewers]    = useState<ViewerProfile[]>([])
  const [shortlist,  setShortlist]  = useState<ShortlistProfile[]>([])
  const [isPremium,  setIsPremium]  = useState(false)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (!id) { router.replace('/login'); return }
    load(id)
  }, [])

  async function load(id: string) {
    setLoading(true)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    if (!p) { router.replace('/login'); return }
    setProfile(p)
    setIsPremium(!!p.premium_expires_at && new Date(p.premium_expires_at) > new Date())

    // Interests received
    const { count: intCount } = await supabase.from('interests')
      .select('id', { count: 'exact', head: true }).eq('to_user', id).eq('status', 'pending')

    // Matches
    const { data: matchRows } = await supabase.from('matches').select('id').or(`user1.eq.${id},user2.eq.${id}`)
    const matchCount = matchRows?.length || 0

    // Profile views
    const { data: viewRows } = await supabase.from('profile_views')
      .select('viewer_id, viewed_at').eq('viewed_id', id)
      .order('viewed_at', { ascending: false }).limit(50)

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const viewsWeek = (viewRows || []).filter(v => new Date(v.viewed_at) > weekAgo).length

    // Load viewer profiles
    const viewerIds = [...new Set((viewRows || []).map(v => v.viewer_id))].slice(0, 10)
    if (viewerIds.length > 0) {
      const { data: vProfiles } = await supabase.from('profiles')
        .select('id, full_name, profession, native_district, photo_url, photo_visibility, date_of_birth')
        .in('id', viewerIds)
      setViewers(vProfiles || [])
    }

    // Shortlists of me
    const { count: shortCount } = await supabase.from('shortlists')
      .select('id', { count: 'exact', head: true }).eq('profile_id', id)

    // My shortlist
    const { data: myShortlist } = await supabase.from('shortlists')
      .select('profile_id').eq('by_profile_id', id).limit(10)

    if (myShortlist && myShortlist.length > 0) {
      const sIds = myShortlist.map(s => s.profile_id)
      const { data: sProfiles } = await supabase.from('profiles')
        .select('id, full_name, profession, native_district, photo_url, photo_visibility, date_of_birth')
        .in('id', sIds)
      setShortlist(sProfiles || [])
    }

    setStats({
      views: viewRows?.length || 0,
      viewsWeek,
      interests: intCount || 0,
      matches: matchCount,
      shortlistCount: shortCount || 0,
    })

    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <AppHeader />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: '80px', background: 'white', borderRadius: '12px', border: '1px solid #E8E8E8' }} />)}
        </div>
        <div style={{ height: '220px', background: 'white', borderRadius: '16px', border: '1px solid #E8E8E8' }} />
      </div>
      <MobileNav />
    </div>
  )

  if (!profile) return null

  const { pct, missing } = calcCompleteness(profile)
  const memberLabel = profile.member_number ? `NTV-${String(profile.member_number).padStart(5,'0')}` : null
  const age = getAge(profile.date_of_birth)

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '80px' }}>
      <AppHeader />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Profile header card ───────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E8E8', padding: '20px', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#0B132B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profile.photo_url
              ? <img src={profile.photo_url} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '26px', fontWeight: 700, color: 'white' }}>{profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}</span>}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F0F0F', margin: '0 0 3px', letterSpacing: '-0.01em' }}>{profile.full_name}</h1>
                <p style={{ fontSize: '12.5px', color: '#777', margin: 0 }}>
                  {[age ? `${age} yrs` : null, profile.profession, profile.native_district].filter(Boolean).join(' · ')}
                </p>
                {memberLabel && <p style={{ fontSize: '11px', color: '#94A3B8', margin: '3px 0 0', fontWeight: 600 }}>{memberLabel}</p>}
              </div>
              {isPremium && (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: '#E0F7FC', color: '#0B132B', border: '1px solid #BDE9F7', flexShrink: 0 }}>
                  ★ Premium
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <Link href={`/profile/${profile.id}`} style={{ fontSize: '12.5px', fontWeight: 600, padding: '7px 16px', borderRadius: '8px', background: '#0B132B', color: 'white', textDecoration: 'none' }}>
                View Profile
              </Link>
              <Link href="/profile/edit" style={{ fontSize: '12.5px', fontWeight: 600, padding: '7px 16px', borderRadius: '8px', background: 'white', color: '#555', textDecoration: 'none', border: '1.5px solid #E8E8E8' }}>
                Edit Profile
              </Link>
              {!isPremium && (
                <Link href="/pricing" style={{ fontSize: '12.5px', fontWeight: 600, padding: '7px 16px', borderRadius: '8px', background: '#EAF8FE', color: '#0B132B', textDecoration: 'none', border: '1.5px solid #BDE9F7' }}>
                  Upgrade →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats grid ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
          <StatCard value={stats.viewsWeek} label="Profile views" sub="this week" color="#1D4E7F" href="/dashboard#viewers"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D4E7F" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} />
          <StatCard value={stats.interests} label="Pending interests" sub="awaiting your reply" color="#0B132B" href="/interests"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B132B" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>} />
          <StatCard value={stats.matches} label="Mutual matches" sub="chat unlocked" color="#06D6A0" href="/matches"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06D6A0" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} />
          <StatCard value={stats.shortlistCount} label="Shortlisted you" sub="members who saved you" color="#7C3AED"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} />
        </div>

        {/* ── Profile completeness ──────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E8E8', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <CompletenessRing pct={pct} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: '0 0 6px' }}>
                {pct >= 90 ? 'Your profile looks great!' : pct >= 60 ? 'Good progress!' : 'Complete your profile'}
              </p>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: '0 0 10px', lineHeight: 1.5 }}>
                {pct >= 90
                  ? 'Profiles above 90% get 3× more matches.'
                  : `Add the missing details to get more visibility.`}
              </p>
              {missing.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {missing.slice(0, 4).map(m => (
                    <Link key={m} href="/profile/edit" style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '99px', background: '#EAF8FE', color: '#0B132B', border: '1px solid #BDE9F7', textDecoration: 'none' }}>
                      + {m}
                    </Link>
                  ))}
                  {missing.length > 4 && (
                    <span style={{ fontSize: '11px', color: '#94A3B8', padding: '3px 5px' }}>+{missing.length - 4} more</span>
                  )}
                </div>
              )}
              {missing.length === 0 && (
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#06D6A0' }}>✓ All fields complete</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Who viewed me ─────────────────────────────────────── */}
        <div id="viewers" style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E8E8', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: 0 }}>Who viewed my profile</h2>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>{stats.views} total views</span>
          </div>
          {viewers.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>
              No views yet — complete your profile to get discovered!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {viewers.map(v => (
                <Link key={v.id} href={`/profile/${v.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', padding: '8px', borderRadius: '10px', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <MiniAvatar p={v} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#111', margin: 0 }}>{v.full_name}</p>
                    <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '2px 0 0' }}>
                      {[getAge(v.date_of_birth) ? `${getAge(v.date_of_birth)} yrs` : null, v.profession, v.native_district].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── My shortlist ──────────────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E8E8', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>My shortlist</h2>
          {shortlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 10px' }}>No profiles shortlisted yet</p>
              <Link href="/browse" style={{ fontSize: '13px', fontWeight: 600, color: '#0B132B', textDecoration: 'none' }}>Browse profiles →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {shortlist.map(s => (
                <Link key={s.id} href={`/profile/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', padding: '8px', borderRadius: '10px', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <MiniAvatar p={s} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#111', margin: 0 }}>{s.full_name}</p>
                    <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '2px 0 0' }}>
                      {[getAge(s.date_of_birth) ? `${getAge(s.date_of_birth)} yrs` : null, s.profession, s.native_district].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick links ───────────────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E8E8', overflow: 'hidden' }}>
          {[
            { icon: '✏️', label: 'Edit profile details',    href: '/profile/edit' },
            { icon: '🔔', label: 'Notifications',            href: '/notifications' },
            { icon: '💰', label: 'Upgrade to Premium',       href: '/pricing', hide: isPremium },
            { icon: '🔒', label: 'Privacy settings',         href: '/profile/edit#privacy' },
            { icon: '📋', label: 'Download my biodata',      href: `/profile/${profile.id}` },
          ].filter(item => !item.hide).map((item, i, arr) => (
            <Link key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
              textDecoration: 'none', color: '#333', fontSize: '13.5px', fontWeight: 500,
              borderBottom: i < arr.length - 1 ? '1px solid #F8FAFC' : 'none',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
              <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          ))}
        </div>

      </div>
      <AppFooter />
      <MobileNav />
    </div>
  )
}
