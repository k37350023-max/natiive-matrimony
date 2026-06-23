'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { computeCompleteness } from '@/lib/completeness'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import IndiaMap from '../components/IndiaMap'
import MobileNav from '../components/MobileNav'
import AppHeader from '../components/AppHeader'
import AppFooter from '../components/AppFooter'

/* ─── Constants ─────────────────────────────────────────────── */
const REGIONS: Record<string, Record<string, string[]>> = {
  'Coastal Andhra': {
    'Andhra Pradesh': ['Visakhapatnam', 'East Godavari', 'West Godavari', 'Krishna', 'Guntur', 'Prakasam', 'Nellore'],
  },
  'Rayalaseema': {
    'Andhra Pradesh': ['Kurnool', 'Kadapa', 'Chittoor', 'Anantapur'],
  },
  'Telangana': {
    'Telangana': ['Hyderabad', 'Rangareddy', 'Medchal', 'Warangal', 'Karimnagar', 'Khammam', 'Nizamabad', 'Adilabad', 'Mahbubnagar', 'Nalgonda'],
  },
}

const AGE_RANGES   = ['18–24', '25–29', '30–34', '35–40', '40+']
const PROFESSIONS  = ['IT / Software', 'Business', 'Government', 'Healthcare', 'Education', 'Other']
const PROF_KW: Record<string, string[]> = {
  'IT / Software': ['software','engineer','developer','it ','tech'],
  'Business':      ['business','entrepreneur','owner','trader'],
  'Government':    ['government','ias','ips','civil','bank','railway'],
  'Healthcare':    ['doctor','nurse','physician','medical','pharma'],
  'Education':     ['teacher','professor','lecturer','faculty'],
}
const MOTHER_TONGUES = ['Telugu','Hindi','Tamil','Kannada','Malayalam','Marathi','English']
const CASTES         = ['Reddy','Kamma','Kapu','Brahmin','Velama','Yadav','SC/ST','OBC']
const RELIGIONS      = ['Hindu','Muslim','Christian','Sikh','Jain','Buddhist']
const EDUCATION_LEVELS = ['Any','Graduate','Post Graduate','Doctorate','Diploma','12th / HSC']
const HEIGHT_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'Below 5\'2"', min: 0,   max: 157 },
  { label: '5\'2"–5\'5"', min: 157, max: 165 },
  { label: '5\'5"–5\'8"', min: 165, max: 173 },
  { label: '5\'8"–5\'11"',min: 173, max: 181 },
  { label: 'Above 5\'11"',min: 181, max: 999 },
]
const MARITAL_OPTIONS = [
  { value: 'never_married', label: 'Never married' },
  { value: 'divorced',      label: 'Divorced' },
  { value: 'widowed',       label: 'Widowed' },
]
const ACTIVE_WITHIN_OPTS = [
  { label: '24h', hours: 24 },
  { label: '7 days', hours: 168 },
  { label: '30 days', hours: 720 },
]
const INCOME_RANGES = ['Below ₹3L','₹3L–6L','₹6L–10L','₹10L–20L','₹20L–50L','₹50L+']
const PAGE_SIZE = 18
const POPULAR_NATIVE_PLACES = ['Guntur', 'Warangal', 'Nellore', 'Vijayawada', 'Chennai', 'Coimbatore', 'Madurai', 'Rajkot', 'Mysore']

/* ─── Types ──────────────────────────────────────────────────── */
type Profile = {
  id: string; full_name: string; gender: string; date_of_birth: string
  profession: string; education: string; about: string; height_cm: number
  photo_url: string; photo_visibility: string | null; caste: string
  native_district: string; native_state: string; native_region: string
  current_city: string; verified: boolean; phone_verified: boolean
  marital_status: string | null; last_login_at: string | null
  mother_tongue: string | null; created_at: string; religion: string | null
  family_type: string | null; user_id: string | null; hidden_fields: string[] | null
  member_number: number | null; profile_created_by: string | null; annual_income: string | null
}

type Stats = { interestsSent: number; interestsReceived: number; matches: number; profileViews: number }

/* ─── Helpers ────────────────────────────────────────────────── */
function cmToFeet(cm: number) {
  const ft = Math.floor(cm / 30.48); const inches = Math.round((cm % 30.48) / 2.54)
  return `${ft}'${inches}"`
}
function getAge(dob: string): number | null {
  if (!dob) return null
  const a = Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (365.25*24*60*60*1000))
  return a > 0 ? a : null
}
function initials(name: string) { return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) }
const AVATAR_COLORS = ['#14241C','#0369A1','#047857','#6D28D9','#BE185D']
function avatarBg(name: string) { return AVATAR_COLORS[(name?.charCodeAt(0)||0) % AVATAR_COLORS.length] }
function isVerified(p: Pick<Profile,'verified'|'phone_verified'>) { return p.verified || p.phone_verified }
function isAcceptedStatus(status?: string) { return status === 'matched' || status === 'accepted' }
function displayName(p: Pick<Profile,'full_name'>, unlocked: boolean) {
  if (unlocked) return p.full_name.split(' ').slice(0,2).join(' ')
  return 'Profile locked'
}
function lastSeen(ts: string | null): string | null {
  if (!ts) return null
  const m = Math.floor((Date.now()-new Date(ts).getTime())/60000)
  if (m < 2)   return 'Active now'
  if (m < 60)  return `Active ${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24)  return `Active ${h}h ago`
  const d = Math.floor(h/24)
  if (d === 1) return 'Active yesterday'
  if (d <= 6)  return `Active ${d} days ago`
  const w = Math.floor(d/7)
  if (w < 4)   return `Active ${w}w ago`
  return null
}
function memberLabel(n: number | null): string {
  if (!n) return ''
  return `NTV-${String(n).padStart(5,'0')}`
}

/* ─── Guest preview (unauthenticated browse wall) ─────────────── */
function GuestBrowsePreview({ nativePlace }: { nativePlace?: string }) {
  const [previews, setPreviews] = React.useState<{ full_name: string; profession: string; native_district: string; date_of_birth: string }[]>([])
  const [checkedPlace, setCheckedPlace] = React.useState(false)

  React.useEffect(() => {
    setCheckedPlace(false)
    let q = supabase
      .from('profiles')
      .select('full_name, profession, native_district, date_of_birth')
      .eq('status', 'approved')
      .limit(6)

    const place = nativePlace?.trim()
    if (place) {
      const safePlace = place.replace(/[%_,'"()]/g, ' ').trim()
      q = q.or(`native_district.ilike.%${safePlace}%,native_state.ilike.%${safePlace}%,current_city.ilike.%${safePlace}%`)
    }

    q.then(({ data }) => {
      setPreviews(data || [])
      setCheckedPlace(true)
    })
  }, [nativePlace])

  function maskName(name: string) {
    const parts = name.trim().split(' ')
    return parts.map(p => p[0] + '***').join(' ')
  }

  const searchedPlace = nativePlace?.trim()
  if (searchedPlace && checkedPlace && previews.length === 0) {
    return (
      <main className="nm-page">
        <div className="nm-shell" style={{ width: '100%', maxWidth: '340px', overflow: 'hidden' }}>
          <header className="nm-topbar">
            <Link href="/" className="nm-logo" aria-label="NativeMatrimony home">
              <span>native</span>
              <span>matrimony</span>
            </Link>
            <Link href="/login" className="nm-icon-btn" aria-label="Login">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </Link>
          </header>

          <section style={{ paddingTop: '58px' }}>
            <p className="section-label" style={{ margin: '0 0 14px' }}>Native-place registry</p>
            <h1 className="nm-title" style={{ fontSize: '33px', margin: 0, maxWidth: '330px' }}>
              No one from {searchedPlace} yet.
            </h1>
            <p className="nm-muted" style={{ fontSize: '15px', lineHeight: 1.7, margin: '18px 0 0', maxWidth: '300px' }}>
              Register your profile and we’ll keep your hometown search ready. When someone from {searchedPlace} joins, you’ll know where to start.
            </p>

            <div aria-hidden="true" style={{ position: 'relative', height: '210px', margin: '24px -18px 0', overflow: 'hidden' }}>
              <svg viewBox="0 0 390 220" width="100%" height="220" fill="none" style={{ display: 'block' }}>
                <path d="M0 190C45 163 88 159 132 177C176 195 208 186 248 165C292 142 338 151 390 177V220H0V190Z" fill="#F2F6EA" />
                <path d="M14 183C51 159 88 153 124 170C164 188 207 183 245 160C291 133 340 144 379 169" stroke="#B9CEB0" strokeWidth="2" />
                <path d="M104 164H180V205H104V164Z" fill="#F7E9C7" stroke="#9CB28E" strokeWidth="2" />
                <path d="M94 164L142 124L190 164H94Z" fill="#E9C980" stroke="#9CB28E" strokeWidth="2" />
                <path d="M129 205V178C129 170 135 164 143 164C151 164 157 170 157 178V205" fill="#FFF8E8" stroke="#9CB28E" strokeWidth="2" />
                <path d="M230 158L250 104L270 158H230Z" fill="#F1D992" stroke="#9CB28E" strokeWidth="2" />
                <path d="M237 158H263V204H237V158Z" fill="#F8EDD1" stroke="#9CB28E" strokeWidth="2" />
                <path d="M250 89V104" stroke="#0D6B44" strokeWidth="3" strokeLinecap="round" />
                <path d="M50 201V140M334 202V131" stroke="#8FAE80" strokeWidth="4" strokeLinecap="round" />
                <path d="M50 140C34 144 22 153 17 166M50 140C64 145 74 155 79 170M334 131C319 135 307 146 303 160M334 131C350 136 360 148 365 164" stroke="#7EA36F" strokeWidth="3" strokeLinecap="round" />
                <path d="M22 196C61 202 96 199 126 191C163 181 194 181 226 192C257 202 306 202 365 190" stroke="#C7D8BB" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, #FFFEFA 100%)' }} />
            </div>

            <div className="nm-card" style={{ padding: '16px', marginTop: '-18px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EAF3EA', color: '#075E3E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.55, color: '#26352C' }}>
                  <strong>Private until both sides agree.</strong><br />
                  Create your registry profile now. Your biodata and contact stay locked until a request is accepted.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '10px', marginTop: '22px' }}>
              <Link href={`/register?native_place=${encodeURIComponent(searchedPlace)}`} className="btn-primary" style={{ minHeight: 48 }}>
                Register and notify me
              </Link>
              <Link href="/" className="nm-outline" style={{ minHeight: 46, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
                Try another hometown
              </Link>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#FBFAF5' }}>
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E7E3D8' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Link href="/" className="text-base font-bold font-serif-display tracking-tight shrink-0">
            Native<span style={{ color: '#14241C' }}>Matrimony</span>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link href="/login" className="text-sm font-medium text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50">Login</Link>
            <Link href="/register" className="btn-primary text-sm px-3 py-1.5 whitespace-nowrap">Create Profile</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 font-serif-display mb-2">
            {searchedPlace ? `Profiles from ${searchedPlace}` : 'Search the native-place registry'}
          </h2>
          <p className="text-gray-500 text-sm">
            {searchedPlace
              ? 'Create a profile to request biodata and contact after acceptance.'
              : 'Create a profile to send requests and unlock biodata after acceptance.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {previews.map((p, i) => {
            const age = p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth + 'T00:00:00').getTime()) / (365.25*24*60*60*1000)) : null
            return (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: '#E7E3D8' }}>
                <div className="relative" style={{ paddingBottom: '115%' }}>
                  <GeometricPlaceholder name={p.full_name} />
                  <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                    <div className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}>
                      Photo visible after signup
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-gray-800 text-sm">{maskName(p.full_name)}</p>
                  <p className="text-xs text-gray-500">{age ? `${age} yrs` : ''}{p.profession ? ` · ${p.profession}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.native_district}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center bg-white rounded-2xl p-8 shadow-sm border overflow-hidden" style={{ borderColor: '#E7E3D8' }}>
          <p className="font-bold text-gray-900 text-lg mb-2">Request before contact unlocks</p>
          <p className="text-sm text-gray-500 mb-6 mx-auto max-w-xs">Names, photos, biodata, and contact stay private until accepted.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={searchedPlace ? `/register?native_place=${encodeURIComponent(searchedPlace)}` : '/register'} className="btn-primary px-8 py-3 text-sm">
              Create Profile
            </Link>
            <Link href="/login" className="btn-ghost px-8 py-3 text-sm">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Chip button ────────────────────────────────────────────── */
function Chip({ active, onClick, label }: { active: boolean; onClick: ()=>void; label: string }) {
  return (
    <button onClick={onClick}
      className="text-xs px-2.5 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap"
      style={active
        ? { background: '#14241C', color: 'white', borderColor: '#14241C' }
        : { borderColor: '#E7E3D8', color: '#5E6B62', background: 'white' }}>
      {label}
    </button>
  )
}

/* ─── Geometric placeholder (no photo) ───────────────────────── */
function GeometricPlaceholder({ name }: { name: string }) {
  const c = (name?.charCodeAt(0) || 65) % 4
  const palettes = [
    ['#C9A99A','#A8BFC4','#D4C5BE','#8FA8AD'],
    ['#B5C4B1','#D4B896','#9EB5B0','#C8A882'],
    ['#B8A9C9','#C9B8A8','#A9C4B8','#D4C9A8'],
    ['#C4A8A8','#A8C4B8','#C4BEA8','#8FA8B8'],
  ]
  const [c1,c2,c3,c4] = palettes[c]
  return (
    <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" className="w-full h-full absolute inset-0">
      <rect width="200" height="240" fill={c1}/>
      <rect x="100" y="0" width="100" height="120" fill={c2}/>
      <rect x="0" y="120" width="100" height="120" fill={c3}/>
      <circle cx="100" cy="120" r="70" fill={c4}/>
      <circle cx="100" cy="120" r="40" fill={c1} opacity="0.6"/>
    </svg>
  )
}

/* ─── Profile Card ─────────────────────────────────────────────── */
function ProfileCard({
  p, status, shortlisted, onToggleShortlist, onClick, onSendInterest, sending, onContact, chatHref
}: {
  p: Profile; status?: string; shortlisted: boolean
  onToggleShortlist: ()=>void; onClick: ()=>void
  onSendInterest?: ()=>void; sending?: boolean
  onContact?: ()=>void; chatHref?: string
}) {
  const age = getAge(p.date_of_birth)
  const unlocked = isAcceptedStatus(status)
  const showPhoto = unlocked && !!(p.photo_url && p.photo_visibility === 'public')
  const seenLabel = lastSeen(p.last_login_at)
  const isOnline = seenLabel === 'Active now'
  const isNew = p.created_at && (Date.now() - new Date(p.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', borderRadius: '10px', overflow: 'hidden',
        background: '#FFFFFF', cursor: 'pointer',
        border: '1px solid #E7E3D8',
        boxShadow: '0 1px 3px rgba(20,36,28,0.05), 0 8px 24px rgba(20,36,28,0.04)',
        transition: 'box-shadow 0.2s, transform 0.18s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 36px rgba(20,36,28,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(20,36,28,0.05), 0 8px 24px rgba(20,36,28,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
    >
      {/* Photo (4:5) — no overlays, photo stays clean */}
      <div style={{ position: 'relative', paddingBottom: '78%', overflow: 'hidden' }}>
        {showPhoto ? (
          <img loading="lazy"
            src={p.photo_url} alt={p.full_name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0 }}>
            <GeometricPlaceholder name={p.full_name} />
          </div>
        )}
        {!unlocked && (
          <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(7px)', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(20,36,28,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
          </div>
        )}

        {/* Mint Verified pill — the only badge on the image */}
        {isVerified(p) && unlocked && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '4px 9px', borderRadius: '99px', background: '#2E7D32', color: '#14241C', boxShadow: '0 2px 8px rgba(46,125,50,0.35)' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#14241C" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
              Verified
            </span>
          </div>
        )}
      </div>

      {/* Info — all text below the photo */}
      <div style={{ padding: '14px 14px 16px' }}>
        {/* Name + age */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
          <p style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, color: '#14241C', fontSize: '17px', lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName(p, unlocked)}
          </p>
          {age && <span style={{ fontSize: '14px', fontWeight: 600, color: '#5E6B62', flexShrink: 0 }}>{p.gender === 'male' ? 'Male' : 'Female'}, {age}</span>}
        </div>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#5E6B62" strokeWidth="2.25" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <p style={{ fontSize: '13px', color: '#5E6B62', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.native_district ? `Native: ${p.native_district}` : 'Native place not set'}
          </p>
        </div>

        {/* Profession */}
        <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#14241C', margin: '8px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.profession || '—'}
        </p>
        <p style={{ fontSize: '12.5px', color: '#5E6B62', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.current_city || 'Current city not set'}
        </p>

        {/* Activity meta */}
        {seenLabel && (
          <p style={{ fontSize: '11.5px', fontWeight: 600, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '5px', color: isOnline ? '#2E7D32' : '#8A938A' }}>
            {isOnline && <span style={{ width: '7px', height: '7px', borderRadius: '99px', background: '#2E7D32', flexShrink: 0 }} />}
            {seenLabel}
          </p>
        )}

        {/* Contact + Connect row */}
        {onSendInterest && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            {/* Contact unlocks only after acceptance. */}
            {onContact && unlocked && (
              <button
                onClick={e => { e.stopPropagation(); onContact() }}
                title="View Contact"
                style={{
                  flexShrink: 0, width: '42px', padding: '10px', borderRadius: '10px', cursor: 'pointer',
                  border: '1.5px solid #1B5E20', background: 'white', color: '#1B5E20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EAF3EA')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); if (status==='matched' || status==='accepted') { onClick() } else if (!status && !sending) onSendInterest() }}
              disabled={(!!status && status!=='matched') || sending}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                border: 'none', cursor: (status && status!=='matched') ? 'default' : 'pointer',
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontSize: '13.5px', fontWeight: 600, letterSpacing: '-0.01em',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
                background: status === 'matched' ? '#1B5E20' : status ? '#EFF1EC' : '#1B5E20',
                color: status === 'matched' ? '#FFFFFF' : status ? '#8A938A' : '#FFFFFF',
              }}
              onMouseEnter={e => { if (!status || status==='matched') (e.currentTarget.style.background = '#14532D') }}
              onMouseLeave={e => { if (!status || status==='matched') (e.currentTarget.style.background = '#1B5E20') }}>
              {status === 'matched' ? 'View Biodata'
                : status === 'accepted' ? 'View Biodata'
                : status === 'pending' ? 'Request Sent'
                : status === 'rejected' ? 'Declined'
                : sending ? 'Sending…'
                : 'Send Request'}
            </button>
            {unlocked && chatHref && (
              <Link
                href={chatHref}
                onClick={e => e.stopPropagation()}
                style={{
                  flexShrink: 0, padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #E7E3D8', color: '#5E6B62', background: 'white',
                  fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                Chat
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Sidebar Filters ────────────────────────────────────────── */
function Filters({
  region, state, district, ageRange, profCat, maritalFilter, heightRange,
  motherTongues, casteFilter, religionFilter, educationFilter, photoOnly, recentOnly,
  showViewed, ignorePrefs, activeFilterCount,
  setRegion, setState, setDistrict, setAgeRange, setProfCat, setMaritalFilter,
  setHeightRange, toggleMotherTongue, setCasteFilter, setReligionFilter,
  setEducationFilter, setPhotoOnly, setRecentOnly, setShowViewed, setIgnorePrefs, clearAll,
  availableStates, availableDistricts, handleMapRegion,
  activeWithin, setActiveWithin, verifiedOnly, setVerifiedOnly,
  profileByFilter, setProfileByFilter, incomeFilter, setIncomeFilter,
}: {
  region: string; state: string; district: string; ageRange: string; profCat: string
  maritalFilter: string; heightRange: string; motherTongues: string[]; casteFilter: string
  religionFilter: string; educationFilter: string; photoOnly: boolean; recentOnly: boolean
  showViewed: boolean; ignorePrefs: boolean; activeFilterCount: number
  setRegion: (v:string)=>void; setState: (v:string)=>void; setDistrict: (v:string)=>void
  setAgeRange: (v:string)=>void; setProfCat: (v:string)=>void; setMaritalFilter: (v:string)=>void
  setHeightRange: (v:string)=>void; toggleMotherTongue: (v:string)=>void; setCasteFilter: (v:string)=>void
  setReligionFilter: (v:string)=>void; setEducationFilter: (v:string)=>void
  setPhotoOnly: (v:boolean)=>void; setRecentOnly: (v:boolean)=>void
  setShowViewed: (v:boolean)=>void; setIgnorePrefs: (v:boolean)=>void; clearAll: ()=>void
  availableStates: string[]; availableDistricts: string[]
  handleMapRegion: (r:string)=>void
  activeWithin: string; setActiveWithin: (v:string)=>void
  verifiedOnly: boolean; setVerifiedOnly: (v:boolean)=>void
  profileByFilter: string; setProfileByFilter: (v:string)=>void
  incomeFilter: string; setIncomeFilter: (v:string)=>void
}) {
  const chip = (active: boolean, onClick: ()=>void, label: string) =>
    <Chip key={label} active={active} onClick={onClick} label={label} />

  return (
    <div className="space-y-4 text-sm">
      {/* Region map */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Region</p>
        <IndiaMap mode="filter" selectedRegion={region} onRegionClick={handleMapRegion} compact />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['All','Telangana','Coastal Andhra','Rayalaseema'].map(r => (
            <Chip key={r} active={r==='All'?!region:region===r}
              onClick={()=>handleMapRegion(r==='All'?'':(region===r?'':r))} label={r} />
          ))}
        </div>
      </div>

      {/* State / District cascades */}
      {region && (
        <div className="space-y-2">
          <select className="input text-xs py-1.5" value={state} onChange={e=>{setState(e.target.value);setDistrict('')}}>
            <option value="">All states</option>
            {availableStates.map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="input text-xs py-1.5" value={district} onChange={e=>setDistrict(e.target.value)} disabled={!state}>
            <option value="">All districts</option>
            {availableDistricts.map(d=><option key={d}>{d}</option>)}
          </select>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Age</p>
        <div className="flex flex-wrap gap-1">{AGE_RANGES.map(a=>chip(ageRange===a,()=>setAgeRange(ageRange===a?'':a),a))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Height</p>
        <div className="flex flex-wrap gap-1">{HEIGHT_RANGES.map(h=>chip(heightRange===h.label,()=>setHeightRange(heightRange===h.label?'':h.label),h.label))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Marital Status</p>
        <div className="flex flex-wrap gap-1">{MARITAL_OPTIONS.map(o=>chip(maritalFilter===o.value,()=>setMaritalFilter(maritalFilter===o.value?'':o.value),o.label))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Religion</p>
        <div className="flex flex-wrap gap-1">{RELIGIONS.map(r=>chip(religionFilter===r,()=>setReligionFilter(religionFilter===r?'':r),r))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Caste</p>
        <div className="flex flex-wrap gap-1">{CASTES.map(c=>chip(casteFilter===c,()=>setCasteFilter(casteFilter===c?'':c),c))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mother Tongue</p>
        <div className="flex flex-wrap gap-1">{MOTHER_TONGUES.map(m=>chip(motherTongues.includes(m),()=>toggleMotherTongue(m),m))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Profession</p>
        <div className="flex flex-wrap gap-1">{PROFESSIONS.map(pr=>chip(profCat===pr,()=>setProfCat(profCat===pr?'':pr),pr))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Education</p>
        <div className="flex flex-wrap gap-1">{EDUCATION_LEVELS.map(e=>chip(educationFilter===e,()=>setEducationFilter(educationFilter===e?'':e),e))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Annual Income</p>
        <div className="flex flex-wrap gap-1">{INCOME_RANGES.map(r=>chip(incomeFilter===r,()=>setIncomeFilter(incomeFilter===r?'':r),r))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Active within</p>
        <div className="flex flex-wrap gap-1">{ACTIVE_WITHIN_OPTS.map(o=>chip(activeWithin===o.label,()=>setActiveWithin(activeWithin===o.label?'':o.label),o.label))}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Profile by</p>
        <div className="flex flex-wrap gap-1">
          {chip(profileByFilter==='self',()=>setProfileByFilter(profileByFilter==='self'?'':'self'),'Self')}
          {chip(profileByFilter==='parent',()=>setProfileByFilter(profileByFilter==='parent'?'':'parent'),'Parent')}
        </div>
      </div>

      <div className="pt-1 space-y-2 border-t" style={{ borderColor: '#F3F4F6' }}>
        {[
          [photoOnly, setPhotoOnly, 'With photo only'],
          [verifiedOnly, setVerifiedOnly, 'Verified only'],
          [recentOnly, setRecentOnly, 'Joined last 30 days'],
          [showViewed, setShowViewed, 'Hide profiles I\'ve viewed'],
          [ignorePrefs, setIgnorePrefs, 'Ignore age/height prefs'],
        ].map(([val, set, label]) => (
          <label key={label as string} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={val as boolean}
              onChange={e => (set as (v:boolean)=>void)(e.target.checked)}
              className="accent-red-800 w-3.5 h-3.5" />
            <span className="text-xs text-gray-600 font-medium">{label as string}</span>
          </label>
        ))}
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="text-xs font-semibold text-red-700 hover:underline flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          Clear all filters ({activeFilterCount})
        </button>
      )}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function BrowsePage() {
  const searchParams = useSearchParams()
  const [sessionChecked, setSessionChecked] = useState(false)
  const [myGender, setMyGender]       = useState<string|null>(null)
  const [myProfileId, setMyProfileId] = useState<string|null>(null)
  const [aiPicks, setAiPicks]         = useState<{ id: string; full_name: string; photo_url: string | null; photo_visibility: string; profession: string; date_of_birth: string; native_district: string; score: number; reason: string }[]>([])
  const [profiles, setProfiles]       = useState<Profile[]>([])
  const [loading, setLoading]         = useState(false)
  const [stats, setStats]             = useState<Stats|null>(null)
  const [myName, setMyName]           = useState('')
  const [myMemberNum, setMyMemberNum] = useState<number|null>(null)

  // Filters
  const [region,          setRegion]          = useState('')
  const [state,           setState]           = useState('')
  const [district,        setDistrict]        = useState('')
  const [ageRange,        setAgeRange]        = useState('')
  const [profCat,         setProfCat]         = useState('')
  const [maritalFilter,   setMaritalFilter]   = useState('')
  const [heightRange,     setHeightRange]     = useState('')
  const [motherTongues,   setMotherTongues]   = useState<string[]>([])
  const [casteFilter,     setCasteFilter]     = useState('')
  const [religionFilter,  setReligionFilter]  = useState('')
  const [educationFilter, setEducationFilter] = useState('')
  const [photoOnly,       setPhotoOnly]       = useState(false)
  const [recentOnly,      setRecentOnly]      = useState(false)
  const [showViewed, setShowViewed] = useState(false)
  const [completenessPercent, setCompletenessPercent] = useState<number|null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [ignorePrefs,     setIgnorePrefs]     = useState(false)
  const [viewedIds,       setViewedIds]       = useState<Set<string>>(new Set())
  const [activeWithin,    setActiveWithin]    = useState('')
  const [verifiedOnly,    setVerifiedOnly]    = useState(false)
  const [profileByFilter, setProfileByFilter] = useState('')
  const [incomeFilter,    setIncomeFilter]    = useState('')
  const [nativePlace,     setNativePlace]     = useState('')
  const [currentLocation, setCurrentLocation] = useState('')
  const [sortBy,          setSortBy]          = useState<'newest'|'last_active'|'best_match'>('newest')
  const [page,            setPage]            = useState(1)

  const [showSidebar,     setShowSidebar]     = useState(false)
  const [alertSet,        setAlertSet]        = useState(false)
  const [browseToast,     setBrowseToast]     = useState<string|null>(null)
  const [interestMap,     setInterestMap]     = useState<Record<string,string>>({})
  const [matchIdMap,      setMatchIdMap]      = useState<Record<string,string>>({})
  const [contactProfile, setContactProfile] = useState<Profile | null>(null)
  const [contactInfo, setContactInfo] = useState<{ unlocked: boolean; phone?: string|null; email?: string|null } | null>(null)
  const [revealNumber, setRevealNumber] = useState(false)
  const [shortlists,      setShortlists]      = useState<Set<string>>(new Set())
  const [quickView,       setQuickView]       = useState<Profile|null>(null)
  const [quickViewIdx,    setQuickViewIdx]    = useState<number>(0)
  const [sendingInterest, setSendingInterest] = useState(false)
  const [interestSent,    setInterestSent]    = useState(false)
  const [newArrivals,     setNewArrivals]     = useState<Profile[]>([])
  const [sinceLastVisit,  setSinceLastVisit]  = useState<Profile[]>([])
  const [myNativeDistrict, setMyNativeDistrict] = useState<string>('')

  useEffect(() => {
    const place = searchParams.get('native_place') || ''
    const location = searchParams.get('current_location') || ''
    if (place) setNativePlace(place)
    if (location) setCurrentLocation(location)
  }, [searchParams])

  const availableStates    = region ? Object.keys(REGIONS[region]||{}) : []
  const availableDistricts = state  ? (REGIONS[region]?.[state] || []) : []
  const oppositeGender     = myGender === 'male' ? 'female' : myGender === 'female' ? 'male' : null

  useEffect(() => {
    const myId = localStorage.getItem('my_profile_id')
    setMyProfileId(myId)
    if (!myId) { setSessionChecked(true); return }
    supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', myId).then(()=>{})

    Promise.all([
      supabase.from('profiles').select('member_number, full_name, gender, date_of_birth, native_state, native_district, photo_url, about, profession, education, height_cm, religion, current_city, caste, annual_income, mother_tongue, family_type, company, diet, star, rashi').eq('id', myId).maybeSingle(),
      supabase.from('interests').select('from_user, to_user, status').or(`from_user.eq.${myId},to_user.eq.${myId}`),
      supabase.from('matches').select('id,user1,user2').or(`user1.eq.${myId},user2.eq.${myId}`),
      supabase.from('interests').select('id',{count:'exact',head:true}).eq('from_user',myId),
      supabase.from('interests').select('id',{count:'exact',head:true}).eq('to_user',myId).eq('status','pending'),
      supabase.from('matches').select('id',{count:'exact',head:true}).or(`user1.eq.${myId},user2.eq.${myId}`),
      supabase.from('profile_views').select('id',{count:'exact',head:true}).eq('viewed_id',myId),
      supabase.from('shortlists').select('profile_id').eq('by_profile_id',myId),
      supabase.from('ai_picks').select('score,reason,suggested_profile_id,profiles!ai_picks_suggested_profile_id_fkey(id,full_name,photo_url,photo_visibility,profession,date_of_birth,native_district)').eq('for_profile_id',myId).order('score',{ascending:false}).limit(6),
    ]).then(([{data:prof},{data:ints},{data:matchRows},sentRes,receivedRes,matchRes,viewsRes,{data:sls},{data:picksRaw}])=>{
      if (!prof) { localStorage.removeItem('my_profile_id'); setMyProfileId(null) }
      setMyGender(prof?.gender ?? null)
      setMyName(prof?.full_name ?? '')
      setMyMemberNum(prof?.member_number ?? null)
      setMyNativeDistrict(prof?.native_district ?? '')
      if (prof) {
        setCompletenessPercent(computeCompleteness(prof).percent)
        setBannerDismissed(sessionStorage.getItem('completeness_banner_dismissed') === '1')
      }

      // Status per profile: accepted interest = matched (chat); pending = request sent.
      // A match row alone (created when a request opens a thread) is NOT "matched"
      // unless the interest was accepted.
      const map: Record<string,string> = {}
      ints?.forEach(i => {
        const other = i.from_user === myId ? i.to_user : i.from_user
        map[other] = i.status === 'accepted' ? 'matched' : i.status
      })
      const mIdMap: Record<string,string> = {}
      matchRows?.forEach(m => { const o = m.user1===myId?m.user2:m.user1; if (m.id) mIdMap[o]=m.id })
      setInterestMap(map)
      setMatchIdMap(mIdMap)

      setStats({
        interestsSent:     sentRes.count     || 0,
        interestsReceived: receivedRes.count || 0,
        matches:           matchRes.count    || 0,
        profileViews:      viewsRes.count    || 0,
      })

      setShortlists(new Set((sls||[]).map(s=>s.profile_id)))
      // Parse ai_picks with joined profile data
      if (picksRaw) {
        const picks = picksRaw
          .filter((r: any) => r.profiles)
          .map((r: any) => ({ ...r.profiles, score: r.score, reason: r.reason }))
        setAiPicks(picks)
      }
      setSessionChecked(true)
    })
  }, [])

  useEffect(() => {
    if (!myProfileId) return
    supabase.from('profile_views').select('viewed_id').eq('viewer_id', myProfileId)
      .then(({data}) => setViewedIds(new Set((data||[]).map(v=>v.viewed_id))))
  }, [myProfileId])

  useEffect(() => {
    if (!myProfileId || !oppositeGender) return
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString()
    // New arrivals: 3 most recent profiles
    supabase.from('profiles').select('*').eq('status','approved').eq('gender',oppositeGender)
      .neq('id', myProfileId).gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false }).limit(3)
      .then(({data}) => setNewArrivals(data || []))
    // Since last visit: profiles from same district joined after last known visit
    const lastVisit = localStorage.getItem('last_visit_at')
    if (lastVisit && myNativeDistrict) {
      const lastVisitDate = new Date(lastVisit)
      const hoursSince = (Date.now() - lastVisitDate.getTime()) / (1000*60*60)
      if (hoursSince > 24) {
        supabase.from('profiles').select('*').eq('status','approved').eq('gender',oppositeGender)
          .neq('id', myProfileId).eq('native_district', myNativeDistrict)
          .gte('created_at', lastVisit)
          .order('created_at', { ascending: false }).limit(6)
          .then(({data}) => setSinceLastVisit(data || []))
      }
    }
    localStorage.setItem('last_visit_at', new Date().toISOString())
  }, [myProfileId, oppositeGender, myNativeDistrict])

  useEffect(() => {
    if (sessionChecked) { setPage(1); loadProfiles() }
  }, [sessionChecked, oppositeGender, region, state, district, ageRange, profCat, maritalFilter,
      heightRange, motherTongues, casteFilter, religionFilter, educationFilter, photoOnly,
      recentOnly, showViewed, ignorePrefs, myProfileId,
      activeWithin, verifiedOnly, profileByFilter, incomeFilter, sortBy, nativePlace, currentLocation])

  async function loadProfiles() {
    setLoading(true)
    const fourteenDaysAgo = new Date(Date.now() - 14*24*60*60*1000).toISOString()

    // Secure path: fetch via server API (service_role, sanitized columns — no phone/email).
    // Falls back to the legacy direct query if the API isn't configured yet.
    let data: Profile[] | null = null
    try {
      const res = await fetch('/api/profiles/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oppositeGender, region, state, district, casteFilter, nativePlace, currentLocation }),
      })
      if (res.ok) data = (await res.json()).profiles as Profile[]
    } catch { /* fall through to legacy query */ }

    if (data === null) {
      let q = supabase.from('profiles').select('*').eq('status','approved')
      if (oppositeGender) q = q.eq('gender', oppositeGender)
      if (region)         q = q.eq('native_region', region)
      if (state)          q = q.eq('native_state', state)
      if (district)       q = q.eq('native_district', district)
      if (nativePlace)    q = q.or(`native_district.ilike.%${nativePlace}%,native_state.ilike.%${nativePlace}%,current_city.ilike.%${nativePlace}%`)
      if (currentLocation) q = q.or(`current_city.ilike.%${currentLocation}%,current_state.ilike.%${currentLocation}%`)
      if (casteFilter)    q = q.ilike('caste', `%${casteFilter}%`)
      const resp = await q
        .or(`last_login_at.gt.${fourteenDaysAgo},last_login_at.is.null`)
        .order('created_at', { ascending: false })
      data = resp.data || []
    }

    let results = data || []
    if (myProfileId) results = results.filter(p => p.id !== myProfileId)
    if (showViewed && viewedIds.size > 0) results = results.filter(p => !viewedIds.has(p.id))

    if (ageRange) {
      const [minA,maxA] = ageRange==='40+'?[40,99]:ageRange.split('–').map(Number)
      results = results.filter(p=>{ const a=getAge(p.date_of_birth); return a!=null&&a>=minA&&a<=maxA })
    }
    if (profCat) {
      const kws = PROF_KW[profCat]||[]
      if (kws.length) results = results.filter(p=>kws.some(k=>p.profession?.toLowerCase().includes(k)))
    }
    if (maritalFilter) results = results.filter(p=>(p.marital_status||'never_married')===maritalFilter)
    if (heightRange) {
      const hr = HEIGHT_RANGES.find(h=>h.label===heightRange)
      if (hr) results = results.filter(p=>p.height_cm&&p.height_cm>=hr.min&&p.height_cm<hr.max)
    }
    if (motherTongues.length>0) results = results.filter(p=>p.mother_tongue&&motherTongues.includes(p.mother_tongue))
    if (religionFilter)  results = results.filter(p=>p.religion?.toLowerCase()===religionFilter.toLowerCase())
    if (educationFilter && educationFilter!=='Any') results = results.filter(p=>p.education?.toLowerCase().includes(educationFilter.toLowerCase()))
    if (photoOnly)  results = results.filter(p=>!!p.photo_url)
    if (recentOnly) { const t=new Date(Date.now()-30*24*60*60*1000); results=results.filter(p=>new Date(p.created_at)>=t) }
    if (verifiedOnly) results = results.filter(p=>isVerified(p))
    if (profileByFilter) results = results.filter(p=>(p.profile_created_by||'self')===profileByFilter)
    if (incomeFilter) results = results.filter(p=>p.annual_income===incomeFilter)
    if (activeWithin) {
      const opt = ACTIVE_WITHIN_OPTS.find(o=>o.label===activeWithin)
      if (opt) {
        const cutoff = new Date(Date.now() - opt.hours*60*60*1000)
        results = results.filter(p=>p.last_login_at && new Date(p.last_login_at) >= cutoff)
      }
    }

    // Sort
    if (sortBy === 'last_active') {
      results = results.sort((a,b) => {
        const ta = a.last_login_at ? new Date(a.last_login_at).getTime() : 0
        const tb = b.last_login_at ? new Date(b.last_login_at).getTime() : 0
        return tb - ta
      })
    } else if (sortBy === 'best_match') {
      // Score: same district +3, same state +2, same religion +1, same caste +1
      const myProf = { native_district: myNativeDistrict }
      results = results.sort((a,b) => {
        const score = (p: typeof results[0]) => {
          let s = 0
          if (p.native_district === myProf.native_district) s += 3
          return s
        }
        return score(b) - score(a)
      })
    }
    // newest is default (already ordered by created_at desc from DB)

    setProfiles(results)
    setLoading(false)
  }

  function handleMapRegion(r: string) { setRegion(r); setState(''); setDistrict('') }

  function clearAll() {
    setRegion(''); setState(''); setDistrict(''); setAgeRange(''); setProfCat('')
    setMaritalFilter(''); setHeightRange(''); setMotherTongues([]); setCasteFilter('')
    setReligionFilter(''); setEducationFilter(''); setPhotoOnly(false)
    setRecentOnly(false); setShowViewed(false); setIgnorePrefs(false); setAlertSet(false)
    setActiveWithin(''); setVerifiedOnly(false); setProfileByFilter(''); setIncomeFilter('')
    setNativePlace(''); setCurrentLocation('')
    setPage(1)
  }

  function toggleMotherTongue(mt: string) {
    setMotherTongues(prev => prev.includes(mt) ? prev.filter(x=>x!==mt) : [...prev, mt])
  }

  async function toggleShortlist(profileId: string) {
    if (!myProfileId) return
    const adding = !shortlists.has(profileId)
    // Optimistic UI; identity enforced server-side via session cookie.
    setShortlists(s => { const n=new Set(s); if(adding) n.add(profileId); else n.delete(profileId); return n })
    const res = await fetch('/api/shortlists/toggle', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, action: adding ? 'add' : 'remove' }),
    })
    if (!res.ok) { // revert on failure
      setShortlists(s => { const n=new Set(s); if(adding) n.delete(profileId); else n.add(profileId); return n })
    }
  }

  // Send an interest request. Stays PENDING until the recipient accepts
  // (acceptance is what creates a match) — no auto-match here.
  async function sendInterest(p: Profile, opts: { advance?: boolean } = {}) {
    if (!myProfileId || interestMap[p.id] || sendingInterest) return
    setSendingInterest(true)
    setInterestSent(false)

    try {
      // Secured: sender identity comes from the session cookie, not the client.
      const res = await fetch('/api/interests/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toProfileId: p.id }),
      })
      if (!res.ok) { setSendingInterest(false); return }
      setInterestMap(m => ({ ...m, [p.id]: 'pending' }))
      setInterestSent(true)
      // Modal flow only: auto-advance to the next profile so the user can keep going.
      if (opts.advance) {
        setTimeout(() => {
          const nextIdx = quickViewIdx + 1
          if (nextIdx < profiles.length) {
            setQuickView(profiles[nextIdx])
            setQuickViewIdx(nextIdx)
            setInterestSent(false)
          } else {
            setQuickView(null)
            setInterestSent(false)
          }
        }, 700)
      }
    } finally {
      setSendingInterest(false)
    }
  }

  // Modal keeps its swipe-through behaviour; cards do not.
  const handleInterestFromModal = (p: Profile) => sendInterest(p, { advance: true })

  // Contact: auto-sends a request, opens a popup that reveals WhatsApp/number
  // only once the other person has accepted (privacy-respecting).
  async function openContact(p: Profile) {
    if (!myProfileId) { window.location.href = '/login'; return }
    setContactProfile(p); setContactInfo(null); setRevealNumber(false)
    if (!interestMap[p.id]) sendInterest(p)
    try {
      const r = await fetch('/api/profiles/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: p.id }),
      })
      if (r.ok) setContactInfo(await r.json())
      else setContactInfo({ unlocked: false })
    } catch { setContactInfo({ unlocked: false }) }
  }

  const activeFilterCount = [region,state,district,ageRange,profCat,maritalFilter,heightRange,casteFilter,
    religionFilter,educationFilter,...motherTongues,
    photoOnly?'p':'',recentOnly?'r':'',showViewed?'h':'',ignorePrefs?'i':'',
    activeWithin,verifiedOnly?'v':'',profileByFilter,incomeFilter,nativePlace,currentLocation].filter(Boolean).length

  const genderLabel = oppositeGender === 'female' ? 'brides' : oppositeGender === 'male' ? 'grooms' : 'profiles'

  /* ── Not logged in ── */
  if (!sessionChecked) return (
    <div className="min-h-screen" style={{ background: '#FBFAF5' }}>
      <AppHeader />
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Loading…</div>
    </div>
  )

  if (!myProfileId) return <GuestBrowsePreview nativePlace={nativePlace} />

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: '#FBFAF5' }}>
      <AppHeader />

      <div className="max-w-6xl mx-auto px-4 py-4">

        {/* ── Profile completeness banner ─────────────────────── */}
        {completenessPercent !== null && completenessPercent < 50 && !bannerDismissed && (
          <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
            style={{ background: '#EAF3EA', border: '1px solid #7FB17F' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="flex-1 text-amber-800">
              Your profile is only <strong>{completenessPercent}% complete</strong>. Complete it to get more visibility.
            </span>
            <Link href="/profile/edit" className="font-semibold text-amber-900 underline shrink-0">Complete now</Link>
            <button onClick={() => { sessionStorage.setItem('completeness_banner_dismissed','1'); setBannerDismissed(true) }}
              className="text-amber-600 hover:text-amber-900 shrink-0 ml-1" aria-label="Dismiss">✕</button>
          </div>
        )}

        {/* ── Stats Dashboard ─────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Sent',     value: stats.interestsSent,     href: '/interests?tab=sent' },
              { label: 'Received', value: stats.interestsReceived, href: '/interests?tab=received' },
              { label: 'Accepted', value: stats.matches,           href: '/matches' },
              { label: 'Views',    value: stats.profileViews,      href: `/profile/${myProfileId}` },
            ].map(s => (
              <Link key={s.label} href={s.href}
                style={{ background: 'white', borderRadius: '10px', border: '1px solid #E7E3D8', padding: '10px 6px', textAlign: 'center', textDecoration: 'none', display: 'block', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#0F0F0F', lineHeight: 1, margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, fontWeight: 500 }}>{s.label}</p>
              </Link>
            ))}
          </div>
        )}

        {/* ── Greeting + filter toggle ─────────────────────────── */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0F0F0F', margin: 0, letterSpacing: 0, fontFamily: 'var(--font-space-grotesk), var(--font-inter), sans-serif' }}>
                Native-place registry
              </h1>
              {myMemberNum && (
                <span style={{ fontSize: '11px', color: '#5E6B62', fontWeight: 700 }}>{memberLabel(myMemberNum)}</span>
              )}
            </div>
            {/* Desktop filter button (hidden on mobile — chips below) */}
            <button
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold"
              style={activeFilterCount > 0
                ? { background: '#EDF3ED', color: '#14241C', borderColor: '#CADFCA' }
                : { borderColor: '#E7E3D8', color: '#5E6B62', background: 'white' }}
              onClick={() => setShowSidebar(s=>!s)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
          <form
            onSubmit={e => { e.preventDefault(); setPage(1); loadProfiles() }}
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '8px', padding: '8px', borderRadius: '10px', background: 'white', border: '1px solid #E2E8DD', marginBottom: '10px', boxShadow: '0 8px 24px rgba(7,21,39,0.045)' }}>
            <input
              value={nativePlace}
              onChange={e => setNativePlace(e.target.value)}
              placeholder="Native place"
              aria-label="Search Native Place"
              className="nm-input"
            />
            <input
              value={currentLocation}
              onChange={e => setCurrentLocation(e.target.value)}
              placeholder="Current location (optional)"
              aria-label="Current location"
              className="nm-input"
            />
            <button type="submit" className="nm-primary" style={{ minHeight: '46px', padding: '0 14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
              Search
            </button>
          </form>
          <div className="flex gap-1.5 overflow-x-auto mb-3" style={{ scrollbarWidth: 'none' }}>
            {POPULAR_NATIVE_PLACES.map(place => (
              <Chip key={place} active={nativePlace.toLowerCase() === place.toLowerCase()} onClick={() => { setNativePlace(nativePlace === place ? '' : place); setPage(1) }} label={place} />
            ))}
          </div>
          {/* Mobile filter row */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0"
              style={activeFilterCount > 0
                ? { background: '#EDF3ED', color: '#14241C', borderColor: '#CADFCA' }
                : { borderColor: '#E7E3D8', color: '#5E6B62', background: 'white' }}
              onClick={() => setShowSidebar(s=>!s)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {['All','Telangana','Coastal Andhra','Rayalaseema'].map(r => (
                <Chip key={r} active={r==='All'?!region:region===r}
                  onClick={()=>handleMapRegion(r==='All'?'':(region===r?'':r))} label={r} />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile filter drawer */}
        {showSidebar && (
          <div className="sm:hidden card p-4 mb-4">
            <Filters {...{ region,state,district,ageRange,profCat,maritalFilter,heightRange,motherTongues,casteFilter,religionFilter,educationFilter,photoOnly,recentOnly,showViewed,ignorePrefs,activeFilterCount,setRegion,setState,setDistrict,setAgeRange,setProfCat,setMaritalFilter,setHeightRange,toggleMotherTongue,setCasteFilter,setReligionFilter,setEducationFilter,setPhotoOnly,setRecentOnly,setShowViewed,setIgnorePrefs,clearAll,availableStates,availableDistricts,handleMapRegion,activeWithin,setActiveWithin,verifiedOnly,setVerifiedOnly,profileByFilter,setProfileByFilter,incomeFilter,setIncomeFilter }} />
          </div>
        )}

        <div className="flex gap-5">

          {/* ── Desktop sidebar ─── */}
          <aside className="hidden sm:block w-56 shrink-0">
            <div className="card p-4 sticky top-20">
              <Filters {...{ region,state,district,ageRange,profCat,maritalFilter,heightRange,motherTongues,casteFilter,religionFilter,educationFilter,photoOnly,recentOnly,showViewed,ignorePrefs,activeFilterCount,setRegion,setState,setDistrict,setAgeRange,setProfCat,setMaritalFilter,setHeightRange,toggleMotherTongue,setCasteFilter,setReligionFilter,setEducationFilter,setPhotoOnly,setRecentOnly,setShowViewed,setIgnorePrefs,clearAll,availableStates,availableDistricts,handleMapRegion,activeWithin,setActiveWithin,verifiedOnly,setVerifiedOnly,profileByFilter,setProfileByFilter,incomeFilter,setIncomeFilter }} />
            </div>
          </aside>

          {/* ── Main content ─── */}
          <div className="flex-1 min-w-0">

            {/* Results header */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <p className="flex-1" style={{ color: '#5E6B62', fontSize: '15px' }}>
                {loading ? 'Loading…' : (
                  <>
                    <span style={{ fontWeight: 800, color: '#14241C', fontSize: '18px', letterSpacing: 0 }}>
                      {profiles.length.toLocaleString('en-IN')}
                    </span> {genderLabel} found
                  </>
                )}
              </p>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'newest'|'last_active'|'best_match')}
                className="text-xs border rounded-lg px-2 py-1.5 text-gray-600"
                style={{ borderColor: '#E7E3D8', background: 'white', outline: 'none' }}>
                <option value="newest">Newest first</option>
                <option value="last_active">Last active</option>
                <option value="best_match">Best match</option>
              </select>
              <button
                onClick={() => {
                  const next = !alertSet
                  setAlertSet(next)
                  setBrowseToast(next ? 'Alert saved — we\'ll notify you when new matches appear' : 'Alert removed')
                  setTimeout(() => setBrowseToast(null), 3500)
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={alertSet
                  ? { background: '#EDF3ED', color: '#14241C', borderColor: '#CADFCA' }
                  : { borderColor: '#E7E3D8', color: '#5E6B62', background: 'white' }}>
                {alertSet ? 'Alert set' : '+ Save search'}
              </button>
            </div>
            {/* ── AI Top Picks ─────────────────────────────── */}
            {false && aiPicks.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1B5E20" stroke="none" style={{ flexShrink: 0 }}><path d="M12 2l2.4 6.9L21 11l-6.6 2.1L12 20l-2.4-6.9L3 11l6.6-2.1z"/></svg>
                  <span className="text-sm font-bold text-gray-900">Top Picks for You</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: '#EDF3ED', color: '#14241C', border: '1px solid #CADFCA' }}>
                    AI matched
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                  {aiPicks.map(pick => (
                    <Link key={pick.id} href={`/profile/${pick.id}`}
                      style={{ textDecoration: 'none', flexShrink: 0, width: '140px' }}>
                      <div style={{
                        borderRadius: '16px', overflow: 'hidden',
                        border: '1px solid #E7E3D8', background: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}>
                        {/* Photo */}
                        <div style={{ position: 'relative', height: '160px', background: '#EDF3ED' }}>
                          {pick.photo_url && pick.photo_visibility !== 'hidden' ? (
                            <img src={pick.photo_url} alt={pick.full_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                          )}
                          {/* Score badge */}
                          <div style={{
                            position: 'absolute', top: '8px', right: '8px',
                            background: 'rgba(20,36,28,0.90)', backdropFilter: 'blur(4px)',
                            color: 'white', fontSize: '10px', fontWeight: 800,
                            padding: '3px 7px', borderRadius: '99px',
                          }}>
                            {Math.min(pick.score, 99)}% match
                          </div>
                        </div>
                        {/* Info */}
                        <div style={{ padding: '10px 10px 12px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pick.full_name.split(' ')[0]}
                          </p>
                          <p style={{ fontSize: '11px', color: '#5E6B62', margin: 0 }}>
                            {pick.profession?.split(' ').slice(0,2).join(' ')}
                          </p>
                          <p style={{ fontSize: '10px', color: '#94A3B8', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {pick.native_district}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <hr className="mt-4 mb-1 border-gray-100" />
              </div>
            )}

            {/* New Arrivals */}
            {newArrivals.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm font-bold text-gray-900">New this week</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {newArrivals.map((p, idx) => (
                    <ProfileCard key={p.id} p={p} status={interestMap[p.id]}
                      shortlisted={shortlists.has(p.id)}
                      onToggleShortlist={() => toggleShortlist(p.id)}
                      onClick={() => { setQuickView(p); setQuickViewIdx(idx); setInterestSent(false) }}
                      onSendInterest={() => sendInterest(p)} onContact={() => openContact(p)} chatHref={matchIdMap[p.id] ? `/chat/${matchIdMap[p.id]}` : undefined} sending={sendingInterest} />
                  ))}
                </div>
                <hr className="my-4 border-gray-100" />
              </div>
            )}

            {/* Since last visit */}
            {sinceLastVisit.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm font-bold text-gray-900">New from {myNativeDistrict} since your last visit</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sinceLastVisit.map((p, idx) => (
                    <ProfileCard key={p.id} p={p} status={interestMap[p.id]}
                      shortlisted={shortlists.has(p.id)}
                      onToggleShortlist={() => toggleShortlist(p.id)}
                      onClick={() => { setQuickView(p); setQuickViewIdx(idx); setInterestSent(false) }}
                      onSendInterest={() => sendInterest(p)} onContact={() => openContact(p)} chatHref={matchIdMap[p.id] ? `/chat/${matchIdMap[p.id]}` : undefined} sending={sendingInterest} />
                  ))}
                </div>
                <hr className="my-4 border-gray-100" />
              </div>
            )}

            {/* Empty state */}
            {!loading && profiles.length === 0 && (
              <div className="card p-10 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#EDF3ED' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14241C" strokeWidth="1.75">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
                {(region||state||district) ? (
                  <>
                    <p className="font-semibold text-gray-800 mb-1">No {genderLabel} from {district||state||region} yet</p>
                    <p className="text-sm text-gray-500 mb-5">Be the first from your area, or invite friends.</p>
                    <button onClick={clearAll} className="btn-ghost px-5 py-2 text-sm">Show all {genderLabel}</button>
                  </>
                ) : nativePlace ? (
                  <>
                    <p className="font-semibold text-gray-800 mb-1">No profiles from {nativePlace} yet.</p>
                    <p className="text-sm text-gray-500 mb-5">Be the first person from {nativePlace} to join. We&apos;ll notify you when new members from {nativePlace} join.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/register" className="btn-primary px-5 py-2 text-sm">Create Profile</Link>
                      <button
                        onClick={() => {
                          setAlertSet(true)
                          setBrowseToast(`We'll notify you when profiles from ${nativePlace} join`)
                          setTimeout(() => setBrowseToast(null), 3500)
                        }}
                        className="btn-ghost px-5 py-2 text-sm">
                        Notify Me
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-700 mb-1">No profiles match these filters</p>
                    <p className="text-sm text-gray-400 mb-4">Try removing some filters.</p>
                    <button onClick={clearAll} className="btn-primary px-5 py-2 text-sm">Clear filters</button>
                  </>
                )}
              </div>
            )}

            {/* Skeleton loaders */}
            {loading && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {Array.from({length: 6}).map((_, i) => (
                  <div key={i} className="card overflow-hidden animate-pulse">
                    <div className="h-36 bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Profile grid — 2 cols on mobile, 3 on desktop */}
            {(() => {
              const paged = profiles.slice(0, page * PAGE_SIZE)
              return (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {paged.map((p, idx) => (
                      <ProfileCard
                        key={p.id}
                        p={p}
                        status={interestMap[p.id]}
                        shortlisted={shortlists.has(p.id)}
                        onToggleShortlist={() => toggleShortlist(p.id)}
                        onClick={() => { setQuickView(p); setQuickViewIdx(idx); setInterestSent(false) }}
                        onSendInterest={() => sendInterest(p)} onContact={() => openContact(p)} chatHref={matchIdMap[p.id] ? `/chat/${matchIdMap[p.id]}` : undefined} sending={sendingInterest}
                      />
                    ))}
                  </div>
                  {profiles.length > page * PAGE_SIZE && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-6 py-2.5 text-sm font-semibold rounded-xl border transition-all"
                        style={{ borderColor: '#14241C', color: '#14241C', background: 'white' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EDF3ED' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}>
                        Load more ({profiles.length - page * PAGE_SIZE} remaining)
                      </button>
                    </div>
                  )}
                </>
              )
            })()}

          </div>
        </div>
      </div>

      <AppFooter />
      <MobileNav />

      {/* ── Quick-view modal ─────────────────────────────────── */}
      {quickView && (() => {
        const p = quickView
        const status = interestMap[p.id]
        const unlocked = isAcceptedStatus(status)
        const showPhoto = unlocked && !!(p.photo_url && p.photo_visibility === 'public')
        const age = getAge(p.date_of_birth)
        const seenLabel = lastSeen(p.last_login_at)

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={e => e.target===e.currentTarget && setQuickView(null)}>

            <div className="w-full max-w-sm mx-0 sm:mx-4 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'white', maxHeight: '92vh', overflowY: 'auto' }}>

              {/* Photo header */}
              <div className="relative shrink-0" style={{ height: '220px' }}>
                {showPhoto ? (
                  <img loading="lazy" src={p.photo_url} alt={p.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${avatarBg(p.full_name)}33, ${avatarBg(p.full_name)}66)` }}>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-2"
                      style={{ background: avatarBg(p.full_name), filter: unlocked ? 'none' : 'blur(4px)' }}>{unlocked ? initials(p.full_name) : ''}</div>
                    {!unlocked && (
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(20,36,28,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                    )}
                  </div>
                )}
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' }} />

                {/* Close */}
                <button onClick={() => setQuickView(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>

                {/* Prev/Next arrows */}
                {quickViewIdx > 0 && (
                  <button onClick={() => { setQuickView(profiles[quickViewIdx-1]); setQuickViewIdx(i=>i-1) }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                )}
                {quickViewIdx < profiles.length - 1 && (
                  <button onClick={() => { setQuickView(profiles[quickViewIdx+1]); setQuickViewIdx(i=>i+1) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                )}

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-white font-bold text-lg leading-tight">{displayName(p, unlocked)}</h2>
                      <p className="text-white/80 text-sm">
                        {age?`${age} yrs`:''}
                        {p.gender?` • ${p.gender==='male'?'Groom':'Bride'}`:''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isVerified(p) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.95)', color: '#2E7D32' }}>✓ Verified</span>
                      )}
                      {status && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.95)', color: status==='matched'?'#2E7D32':'#14241C' }}>
                          {status==='matched'?'Accepted ✓':status==='pending'?'Request Sent':'Accepted'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Member ID */}
              {p.member_number && (
                <div className="px-5 py-2 border-b" style={{ borderColor: '#F3F4F6', background: '#FBFAF5' }}>
                  <span className="text-xs font-semibold text-gray-400">{memberLabel(p.member_number)}</span>
                </div>
              )}

              {/* Info rows */}
              <div className="px-5 py-1 divide-y divide-gray-100">
                {[
                  { svg: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>', text: `Native: ${p.native_district||'—'}${p.current_city?` • ${p.current_city}`:''}` },
                  { svg: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>', text: p.profession || '—' },
                  unlocked ? { svg: '<path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M10 21v-6h4v6"/>', text: [p.religion,p.caste].filter(Boolean).join(' · ')||'—' } : null,
                  unlocked ? { svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>', text: p.family_type ? p.family_type.charAt(0).toUpperCase()+p.family_type.slice(1)+' family' : '—' } : null,
                  seenLabel ? { dot: true, text: seenLabel } : null,
                  unlocked && p.about ? { svg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', text: p.about.slice(0,120)+(p.about.length>120?'…':'') } : null,
                ].filter(Boolean).map((row,i) => {
                  const r = row as { svg?: string; dot?: boolean; text: string }
                  return (
                  <div key={i} className="flex items-start gap-3 py-2.5">
                    {r.dot
                      ? <span style={{ width: 9, height: 9, borderRadius: 99, background: '#2E7D32', flexShrink: 0, marginTop: 6 }} />
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }} dangerouslySetInnerHTML={{ __html: r.svg || '' }} />}
                    <p className="text-sm text-gray-600 leading-snug">{r.text}</p>
                  </div>
                  )})}
              </div>

              {/* Action buttons */}
              <div className="px-5 pb-6 pt-3 space-y-2.5">

                {/* Interest sent success feedback */}
                {interestSent && (
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: '#ECFDF5', color: '#065F46' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Request sent! Moving to next…
                  </div>
                )}

                {myProfileId && myProfileId !== p.id && !interestSent && (
                  <button
                    onClick={() => { if (status==='matched' || status==='accepted') { window.location.href = `/profile/${p.id}` } else if (!status) { handleInterestFromModal(p) } }}
                    disabled={(!!status && status!=='matched') || sendingInterest}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                    style={status==='matched'
                      ? { background: '#1B5E20', color: '#FFFFFF', cursor: 'pointer' }
                      : status
                      ? { background: '#ECFDF5', color: '#2E7D32' }
                      : { background: '#1B5E20', color: '#FFFFFF', boxShadow: '0 4px 14px rgba(27,94,32,0.35)' }}>
                    {status==='matched'  ? 'View Biodata →' :
                     status==='accepted' ? 'Accepted' :
                     status==='pending'  ? 'Request Sent ✓' :
                     status==='rejected' ? 'Declined' :
                     sendingInterest ? 'Sending…' : 'Send Request'}
                  </button>
                )}

                {/* If matched, show chat button */}
                {status==='matched' && (() => {
                  return null // match_id lookup happens on full profile page
                })()}

                <div className="flex gap-2.5">
                  <Link href={`/profile/${p.id}`}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-center gap-1.5"
                    style={{ borderColor: '#E7E3D8', color: '#4B5563' }}
                    onClick={()=>setQuickView(null)}>
                    {unlocked ? 'View biodata' : 'View locked profile'}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                  <button
                    onClick={() => toggleShortlist(p.id)}
                    className="px-3.5 py-2.5 rounded-xl border flex items-center gap-1.5 text-sm font-semibold"
                    style={shortlists.has(p.id)
                      ? { background: '#EDF3ED', color: '#14241C', borderColor: '#CADFCA' }
                      : { borderColor: '#E7E3D8', color: '#5E6B62', background: 'white' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24"
                      fill={shortlists.has(p.id)?'#14241C':'none'} stroke="#14241C" strokeWidth="2.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {shortlists.has(p.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Save-search toast */}
      {browseToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ animation: 'fadeInUp 0.25s ease' }}>
          <div className="px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white whitespace-nowrap"
            style={{ background: '#14241C' }}>
            {browseToast}
          </div>
        </div>
      )}

      {/* ── Contact popup ─────────────────────────────────────── */}
      {contactProfile && (
        <div onClick={() => setContactProfile(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20,36,28,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'white', width: '100%', maxWidth: '440px', borderRadius: '20px 20px 0 0', padding: '22px 20px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <p style={{ fontWeight: 700, fontSize: '16px', color: '#14241C', margin: 0, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
                Contact profile
              </p>
              <button onClick={() => setContactProfile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A938A' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {!contactInfo ? (
              <p style={{ fontSize: '13px', color: '#5E6B62', padding: '16px 0' }}>Loading…</p>
            ) : contactInfo.unlocked ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <a href={`https://wa.me/${(contactInfo.phone||'').replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '12px', background: '#25D366', color: 'white', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607z"/></svg>
                  Message on WhatsApp
                </a>
                <button onClick={() => setRevealNumber(true)}
                  style={{ padding: '13px', borderRadius: '12px', background: 'white', border: '1.5px solid #1B5E20', color: '#1B5E20', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  {revealNumber ? (contactInfo.phone || 'No number on file') : 'View number'}
                </button>
                {contactInfo.email && revealNumber && (
                  <a href={`mailto:${contactInfo.email}`} style={{ textAlign: 'center', fontSize: '13px', color: '#1B5E20', textDecoration: 'none', fontWeight: 600 }}>{contactInfo.email}</a>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '12px', background: '#EDF3ED', marginBottom: '12px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <p style={{ fontSize: '13px', color: '#14241C', margin: 0, fontWeight: 600 }}>Request sent — contact unlocks once they accept</p>
                </div>
                <p style={{ fontSize: '12.5px', color: '#5E6B62', margin: 0, lineHeight: 1.5 }}>
                  Contact details are shared only after acceptance. We&apos;ve sent your request — you&apos;ll be notified when they accept.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
