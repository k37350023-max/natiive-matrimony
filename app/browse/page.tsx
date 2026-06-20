'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
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
const AVATAR_COLORS = ['#9B1C1C','#0369A1','#047857','#6D28D9','#BE185D']
function avatarBg(name: string) { return AVATAR_COLORS[(name?.charCodeAt(0)||0) % AVATAR_COLORS.length] }
function isVerified(p: Pick<Profile,'verified'|'phone_verified'>) { return p.verified || p.phone_verified }
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
function GuestBrowsePreview() {
  const [previews, setPreviews] = React.useState<{ full_name: string; profession: string; native_district: string; date_of_birth: string }[]>([])
  React.useEffect(() => {
    supabase.from('profiles').select('full_name, profession, native_district, date_of_birth').eq('status', 'approved').limit(6)
      .then(({ data }) => { if (data) setPreviews(data) })
  }, [])

  function maskName(name: string) {
    const parts = name.trim().split(' ')
    return parts.map(p => p[0] + '***').join(' ')
  }

  return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold font-serif-display tracking-tight">
            Native<span style={{ color: '#9B1C1C' }}>Matrimony</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">Login</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-1.5">Register Free</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 font-serif-display mb-2">Browse Telugu Profiles</h2>
          <p className="text-gray-500 text-sm">Create a free profile to see full details and connect</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {previews.map((p, i) => {
            const age = p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth + 'T00:00:00').getTime()) / (365.25*24*60*60*1000)) : null
            return (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: '#F0EDE8' }}>
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

        <div className="text-center bg-white rounded-2xl p-8 shadow-sm border" style={{ borderColor: '#F0EDE8' }}>
          <p className="font-bold text-gray-900 text-lg mb-2">See full profiles & connect</p>
          <p className="text-sm text-gray-500 mb-6">Free until September 2026 · No credit card needed</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-primary px-8 py-3 text-sm">Create Free Profile</Link>
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
        ? { background: '#9B1C1C', color: 'white', borderColor: '#9B1C1C' }
        : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
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
  p, status, shortlisted, onToggleShortlist, onClick
}: {
  p: Profile; status?: string; shortlisted: boolean
  onToggleShortlist: ()=>void; onClick: ()=>void
}) {
  const age = getAge(p.date_of_birth)
  const showPhoto = !!(p.photo_url && p.photo_visibility === 'public')
  const seenLabel = lastSeen(p.last_login_at)
  const isNew = p.created_at && (Date.now() - new Date(p.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', borderRadius: '12px', overflow: 'hidden',
        background: 'white', cursor: 'pointer',
        border: '1px solid #E8E8E8',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
    >
      {/* Photo / placeholder */}
      <div style={{ position: 'relative', paddingBottom: '118%', overflow: 'hidden' }}>
        {showPhoto ? (
          <img loading="lazy"
            src={p.photo_url} alt={p.full_name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transition: 'transform 0.5s' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0 }}>
            <GeometricPlaceholder name={p.full_name} />
          </div>
        )}

        {showPhoto && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 45%, transparent 70%)', pointerEvents: 'none' }} />
        )}

        {/* Verified */}
        {isVerified(p) && (
          <div style={{ position: 'absolute', zIndex: 10, ...(showPhoto ? { bottom: '68px', left: '10px' } : { top: '10px', left: '10px' }) }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '99px', background: '#16A34A', color: 'white' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
              Verified
            </span>
          </div>
        )}

        {/* Status / New badge */}
        {(status || isNew) && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
            {status ? (
              <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', background: 'rgba(255,255,255,0.95)', color: status === 'matched' ? '#059669' : status === 'rejected' ? '#DC2626' : '#7F1D1D', backdropFilter: 'blur(4px)' }}>
                {status === 'matched' ? 'Matched ✓' : status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Declined' : 'Sent ✓'}
              </span>
            ) : (
              <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', background: '#16A34A', color: 'white' }}>New</span>
            )}
          </div>
        )}

        {/* Shortlist heart */}
        {!status && !isNew && (
          <button
            onClick={e => { e.stopPropagation(); onToggleShortlist() }}
            style={{
              position: 'absolute', top: '10px', right: '10px', zIndex: 10,
              width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: shortlisted ? '#7F1D1D' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.15s',
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24"
              fill={shortlisted ? 'white' : 'none'} stroke={shortlisted ? 'white' : '#7F1D1D'} strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}

        {/* Name overlay on photo */}
        {showPhoto && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 12px 12px', zIndex: 10 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '14.5px', lineHeight: 1.3, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {p.full_name.split(' ').slice(0,2).join(' ')}, <span style={{ fontWeight: 400 }}>{age} yrs{p.height_cm ? ` · ${cmToFeet(p.height_cm)}` : ''}</span>
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 13px 14px' }}>
        {!showPhoto && (
          <p style={{ fontWeight: 700, color: '#0F0F0F', fontSize: '14px', lineHeight: 1.3, margin: '0 0 3px' }}>
            {p.full_name.split(' ').slice(0,2).join(' ')}
            <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '12px', marginLeft: '5px' }}>
              {age ? `${age} yrs` : ''}{p.height_cm ? ` · ${cmToFeet(p.height_cm)}` : ''}
            </span>
          </p>
        )}
        <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#374151', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.profession || '—'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#C4C4C4" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[p.native_district, p.current_city].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          {seenLabel && (
            <p style={{ fontSize: '10.5px', fontWeight: 600, color: '#7F1D1D', margin: 0 }}>{seenLabel}</p>
          )}
          {p.profile_created_by === 'parent' && (
            <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '99px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', marginLeft: 'auto' }}>
              By Parent
            </span>
          )}
        </div>
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
  const [sessionChecked, setSessionChecked] = useState(false)
  const [myGender, setMyGender]       = useState<string|null>(null)
  const [myProfileId, setMyProfileId] = useState<string|null>(null)
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
  const [sortBy,          setSortBy]          = useState<'newest'|'last_active'|'best_match'>('newest')
  const [page,            setPage]            = useState(1)

  const [showSidebar,     setShowSidebar]     = useState(false)
  const [alertSet,        setAlertSet]        = useState(false)
  const [interestMap,     setInterestMap]     = useState<Record<string,string>>({})
  const [shortlists,      setShortlists]      = useState<Set<string>>(new Set())
  const [quickView,       setQuickView]       = useState<Profile|null>(null)
  const [quickViewIdx,    setQuickViewIdx]    = useState<number>(0)
  const [sendingInterest, setSendingInterest] = useState(false)
  const [interestSent,    setInterestSent]    = useState(false)
  const [newArrivals,     setNewArrivals]     = useState<Profile[]>([])
  const [sinceLastVisit,  setSinceLastVisit]  = useState<Profile[]>([])
  const [myNativeDistrict, setMyNativeDistrict] = useState<string>('')

  const availableStates    = region ? Object.keys(REGIONS[region]||{}) : []
  const availableDistricts = state  ? (REGIONS[region]?.[state] || []) : []
  const oppositeGender     = myGender === 'male' ? 'female' : myGender === 'female' ? 'male' : null

  useEffect(() => {
    const myId = localStorage.getItem('my_profile_id')
    setMyProfileId(myId)
    if (!myId) { setSessionChecked(true); return }
    supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', myId).then(()=>{})

    Promise.all([
      supabase.from('profiles').select('gender, full_name, member_number, native_district, date_of_birth, religion, caste, profession, education, about, height_cm, photo_url, current_city').eq('id', myId).maybeSingle(),
      supabase.from('interests').select('to_user, status').eq('from_user', myId),
      supabase.from('matches').select('user1,user2').or(`user1.eq.${myId},user2.eq.${myId}`),
      supabase.from('interests').select('id',{count:'exact',head:true}).eq('from_user',myId),
      supabase.from('interests').select('id',{count:'exact',head:true}).eq('to_user',myId).eq('status','pending'),
      supabase.from('matches').select('id',{count:'exact',head:true}).or(`user1.eq.${myId},user2.eq.${myId}`),
      supabase.from('profile_views').select('id',{count:'exact',head:true}).eq('viewed_id',myId),
      supabase.from('shortlists').select('profile_id').eq('by_profile_id',myId),
    ]).then(([{data:prof},{data:ints},{data:matchRows},sentRes,receivedRes,matchRes,viewsRes,{data:sls}])=>{
      if (!prof) { localStorage.removeItem('my_profile_id'); setMyProfileId(null) }
      setMyGender(prof?.gender ?? null)
      setMyName(prof?.full_name ?? '')
      setMyMemberNum(prof?.member_number ?? null)
      setMyNativeDistrict(prof?.native_district ?? '')
      if (prof) {
        const coreFields = [prof.full_name, prof.date_of_birth, prof.gender, prof.religion, prof.caste, prof.profession, prof.education, prof.about, prof.height_cm, prof.photo_url, prof.native_district, prof.current_city]
        const filled = coreFields.filter(Boolean).length
        setCompletenessPercent(Math.round((filled / coreFields.length) * 100))
        setBannerDismissed(sessionStorage.getItem('completeness_banner_dismissed') === '1')
      }

      const map: Record<string,string> = {}
      ints?.forEach(i => { map[i.to_user] = i.status })
      matchRows?.forEach(m => { const o = m.user1===myId?m.user2:m.user1; map[o]='matched' })
      setInterestMap(map)

      setStats({
        interestsSent:     sentRes.count     || 0,
        interestsReceived: receivedRes.count || 0,
        matches:           matchRes.count    || 0,
        profileViews:      viewsRes.count    || 0,
      })

      setShortlists(new Set((sls||[]).map(s=>s.profile_id)))
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
      activeWithin, verifiedOnly, profileByFilter, incomeFilter, sortBy])

  async function loadProfiles() {
    setLoading(true)
    const fourteenDaysAgo = new Date(Date.now() - 14*24*60*60*1000).toISOString()
    let q = supabase.from('profiles').select('*').eq('status','approved')
    if (oppositeGender) q = q.eq('gender', oppositeGender)
    if (region)         q = q.eq('native_region', region)
    if (state)          q = q.eq('native_state', state)
    if (district)       q = q.eq('native_district', district)
    if (casteFilter)    q = q.ilike('caste', `%${casteFilter}%`)

    let { data } = await q
      .or(`last_login_at.gt.${fourteenDaysAgo},last_login_at.is.null`)
      .order('created_at', { ascending: false })
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
    setPage(1)
  }

  function toggleMotherTongue(mt: string) {
    setMotherTongues(prev => prev.includes(mt) ? prev.filter(x=>x!==mt) : [...prev, mt])
  }

  async function toggleShortlist(profileId: string) {
    if (!myProfileId) return
    if (shortlists.has(profileId)) {
      await supabase.from('shortlists').delete().eq('by_profile_id', myProfileId).eq('profile_id', profileId)
      setShortlists(s => { const n=new Set(s); n.delete(profileId); return n })
    } else {
      await supabase.from('shortlists').insert({ by_profile_id: myProfileId, profile_id: profileId })
      setShortlists(s => new Set([...s, profileId]))
    }
  }

  async function handleInterestFromModal(p: Profile) {
    if (!myProfileId || interestMap[p.id] || sendingInterest) return
    setSendingInterest(true)
    setInterestSent(false)

    try {
      await supabase.from('interests').insert({ from_user: myProfileId, to_user: p.id, status: 'pending' })
      setInterestMap(m => ({ ...m, [p.id]: 'pending' }))

      // Auto create match + send auto-message
      const { data: match } = await supabase.from('matches')
        .insert({ user1: myProfileId, user2: p.id }).select('id').single()
      if (match) {
        const { data: me } = await supabase.from('profiles').select('full_name').eq('id', myProfileId).single()
        await supabase.from('messages').insert({
          match_id: match.id, from_profile_id: myProfileId,
          content: `Hi, I came across your profile and I'm interested in connecting. Looking forward to hearing from you!`
        })
        // Notify recipient
        if (p.user_id) {
          supabase.from('notifications').insert({
            user_id: p.user_id, type: 'interest_received',
            message: `${me?.full_name||'Someone'} sent you an interest request`,
            from_profile_id: myProfileId, read: false,
            link: `/interests`,
          }).then(()=>{})
        }
      }

      setInterestSent(true)
      // Auto-advance to next profile after 700ms
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
    } finally {
      setSendingInterest(false)
    }
  }

  const activeFilterCount = [region,state,district,ageRange,profCat,maritalFilter,heightRange,casteFilter,
    religionFilter,educationFilter,...motherTongues,
    photoOnly?'p':'',recentOnly?'r':'',showViewed?'h':'',ignorePrefs?'i':'',
    activeWithin,verifiedOnly?'v':'',profileByFilter,incomeFilter].filter(Boolean).length

  const genderLabel = oppositeGender === 'female' ? 'brides' : oppositeGender === 'male' ? 'grooms' : 'profiles'

  /* ── Not logged in ── */
  if (!sessionChecked) return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
      <AppHeader />
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Loading…</div>
    </div>
  )

  if (!myProfileId) return <GuestBrowsePreview />

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{ background: '#F5F3F0' }}>
      <AppHeader />

      <div className="max-w-6xl mx-auto px-4 py-4">

        {/* ── Profile completeness banner ─────────────────────── */}
        {completenessPercent !== null && completenessPercent < 50 && !bannerDismissed && (
          <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
            style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
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
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Sent',     value: stats.interestsSent,     href: '/interests?tab=sent' },
              { label: 'Received', value: stats.interestsReceived, href: '/interests?tab=received' },
              { label: 'Matches',  value: stats.matches,           href: '/matches' },
              { label: 'Views',    value: stats.profileViews,      href: `/profile/${myProfileId}` },
            ].map(s => (
              <Link key={s.label} href={s.href}
                style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', padding: '14px 8px', textAlign: 'center', textDecoration: 'none', display: 'block', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <p style={{ fontSize: '26px', fontWeight: 700, color: '#0F0F0F', lineHeight: 1, margin: '0 0 5px' }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, fontWeight: 500 }}>{s.label}</p>
              </Link>
            ))}
          </div>
        )}

        {/* ── Greeting + filter toggle ─────────────────────────── */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F0F0F', margin: 0, letterSpacing: '-0.01em', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                {myName ? `Browse ${genderLabel}` : 'Browse profiles'}
              </h1>
              {myMemberNum && (
                <span style={{ fontSize: '11px', color: '#B0B7C3', fontWeight: 500 }}>{memberLabel(myMemberNum)}</span>
              )}
            </div>
            {/* Desktop filter button (hidden on mobile — chips below) */}
            <button
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold"
              style={activeFilterCount > 0
                ? { background: '#FEF2F2', color: '#9B1C1C', borderColor: '#FECACA' }
                : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}
              onClick={() => setShowSidebar(s=>!s)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
          {/* Mobile filter row */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0"
              style={activeFilterCount > 0
                ? { background: '#FEF2F2', color: '#9B1C1C', borderColor: '#FECACA' }
                : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}
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
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <p className="text-sm text-gray-500 flex-1">
                {loading ? 'Loading…' : (
                  <>
                    <span className="font-semibold text-gray-800">
                      {Math.min(page * PAGE_SIZE, profiles.length)} of {profiles.length}
                    </span> {genderLabel}
                  </>
                )}
              </p>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'newest'|'last_active'|'best_match')}
                className="text-xs border rounded-lg px-2 py-1.5 text-gray-600"
                style={{ borderColor: '#E5E7EB', background: 'white', outline: 'none' }}>
                <option value="newest">Newest first</option>
                <option value="last_active">Last active</option>
                <option value="best_match">Best match</option>
              </select>
              <button
                onClick={() => setAlertSet(a => !a)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={alertSet
                  ? { background: '#FEF2F2', color: '#7F1D1D', borderColor: '#FECACA' }
                  : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
                {alertSet ? '🔔 Alert set' : '+ Save search'}
              </button>
            </div>
            {/* New Arrivals */}
            {newArrivals.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm font-bold text-gray-900">New this week</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {newArrivals.map((p, idx) => (
                    <ProfileCard key={p.id} p={p} status={interestMap[p.id]}
                      shortlisted={shortlists.has(p.id)}
                      onToggleShortlist={() => toggleShortlist(p.id)}
                      onClick={() => { setQuickView(p); setQuickViewIdx(idx); setInterestSent(false) }} />
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {sinceLastVisit.map((p, idx) => (
                    <ProfileCard key={p.id} p={p} status={interestMap[p.id]}
                      shortlisted={shortlists.has(p.id)}
                      onToggleShortlist={() => toggleShortlist(p.id)}
                      onClick={() => { setQuickView(p); setQuickViewIdx(idx); setInterestSent(false) }} />
                  ))}
                </div>
                <hr className="my-4 border-gray-100" />
              </div>
            )}

            {/* Empty state */}
            {!loading && profiles.length === 0 && (
              <div className="card p-10 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF2F2' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="1.75">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
                {(region||state||district) ? (
                  <>
                    <p className="font-semibold text-gray-800 mb-1">No {genderLabel} from {district||state||region} yet</p>
                    <p className="text-sm text-gray-500 mb-5">Be the first from your area, or invite friends.</p>
                    <button onClick={clearAll} className="btn-ghost px-5 py-2 text-sm">Show all {genderLabel}</button>
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
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
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
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                    {paged.map((p, idx) => (
                      <ProfileCard
                        key={p.id}
                        p={p}
                        status={interestMap[p.id]}
                        shortlisted={shortlists.has(p.id)}
                        onToggleShortlist={() => toggleShortlist(p.id)}
                        onClick={() => { setQuickView(p); setQuickViewIdx(idx); setInterestSent(false) }}
                      />
                    ))}
                  </div>
                  {profiles.length > page * PAGE_SIZE && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-6 py-2.5 text-sm font-semibold rounded-xl border transition-all"
                        style={{ borderColor: '#7F1D1D', color: '#7F1D1D', background: 'white' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2' }}
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
        const showPhoto = !!(p.photo_url && p.photo_visibility === 'public')
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
                      style={{ background: avatarBg(p.full_name) }}>{initials(p.full_name)}</div>
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
                      <h2 className="text-white font-bold text-lg leading-tight">{p.full_name}</h2>
                      <p className="text-white/80 text-sm">
                        {age?`${age} yrs`:''}
                        {p.height_cm?` • ${cmToFeet(p.height_cm)}`:''}
                        {p.gender?` • ${p.gender==='male'?'Groom':'Bride'}`:''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isVerified(p) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.95)', color: '#059669' }}>✓ Verified</span>
                      )}
                      {status && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.95)', color: status==='matched'?'#059669':'#9B1C1C' }}>
                          {status==='matched'?'Matched ✓':status==='pending'?'Interest Sent':'Accepted'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Member ID */}
              {p.member_number && (
                <div className="px-5 py-2 border-b" style={{ borderColor: '#F3F4F6', background: '#FAFAFA' }}>
                  <span className="text-xs font-semibold text-gray-400">{memberLabel(p.member_number)}</span>
                </div>
              )}

              {/* Info rows */}
              <div className="px-5 py-1 divide-y divide-gray-100">
                {[
                  { icon: '📍', text: `Native: ${p.native_district||'—'}${p.current_city?` • ${p.current_city}`:''}` },
                  { icon: '💼', text: [p.profession,p.education].filter(Boolean).join(' · ')||'—' },
                  { icon: '🛕', text: [p.religion,p.caste].filter(Boolean).join(' · ')||'—' },
                  { icon: '👨‍👩‍👧', text: p.family_type ? p.family_type.charAt(0).toUpperCase()+p.family_type.slice(1)+' family' : '—' },
                  seenLabel ? { icon: '🟢', text: seenLabel } : null,
                  p.about ? { icon: '💬', text: p.about.slice(0,120)+(p.about.length>120?'…':'') } : null,
                ].filter(Boolean).map((row,i) => (
                  <div key={i} className="flex items-start gap-3 py-2.5">
                    <span className="text-base shrink-0 mt-0.5">{(row as {icon:string;text:string}).icon}</span>
                    <p className="text-sm text-gray-600 leading-snug">{(row as {icon:string;text:string}).text}</p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="px-5 pb-6 pt-3 space-y-2.5">

                {/* Interest sent success feedback */}
                {interestSent && (
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: '#ECFDF5', color: '#065F46' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Interest sent! Moving to next…
                  </div>
                )}

                {myProfileId && myProfileId !== p.id && !interestSent && (
                  <button
                    onClick={() => handleInterestFromModal(p)}
                    disabled={!!status || sendingInterest}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                    style={status
                      ? { background: '#ECFDF5', color: '#065F46' }
                      : { background: '#9B1C1C', color: 'white', boxShadow: '0 4px 14px rgba(155,28,28,0.3)' }}>
                    {status==='matched'  ? '✓ Matched — Go to Chat' :
                     status==='accepted' ? '✓ Accepted' :
                     status==='pending'  ? '✓ Interest Sent' :
                     status==='rejected' ? 'Declined' :
                     sendingInterest ? 'Sending…' : '+ Send Interest'}
                  </button>
                )}

                {/* If matched, show chat button */}
                {status==='matched' && (() => {
                  return null // match_id lookup happens on full profile page
                })()}

                <div className="flex gap-2.5">
                  <Link href={`/profile/${p.id}`}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border flex items-center justify-center gap-1.5"
                    style={{ borderColor: '#E5E7EB', color: '#4B5563' }}
                    onClick={()=>setQuickView(null)}>
                    View full profile
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                  <button
                    onClick={() => toggleShortlist(p.id)}
                    className="px-3.5 py-2.5 rounded-xl border flex items-center gap-1.5 text-sm font-semibold"
                    style={shortlists.has(p.id)
                      ? { background: '#FEF2F2', color: '#9B1C1C', borderColor: '#FECACA' }
                      : { borderColor: '#E5E7EB', color: '#6B7280', background: 'white' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24"
                      fill={shortlists.has(p.id)?'#9B1C1C':'none'} stroke="#9B1C1C" strokeWidth="2.5">
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
    </div>
  )
}
