'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import MobileNav from '../components/MobileNav'
import LaunchBanner from '../components/LaunchBanner'
import AppHeader from '../components/AppHeader'

type Profile = {
  id: string
  full_name: string
  gender: string
  date_of_birth: string
  profession: string
  education: string
  native_district: string
  native_state: string
  current_city: string
  phone: string
  email: string
  about: string
  height_cm: number
  religion: string
  caste: string
  mother_tongue: string
  family_type: string
  photo_url: string
  photo_visibility: string | null
  last_login_at: string | null
}

type MatchWithProfile = Profile & { match_id: string }

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function cmToFeet(cm: number): string {
  const ft = Math.floor(cm / 30.48)
  const inches = Math.round((cm % 30.48) / 2.54)
  return `${ft}'${inches}" (${cm} cm)`
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function lastSeenLabel(ts: string | null): string | null {
  if (!ts) return null
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 5) return 'Online now'
  if (mins < 60) return `Active ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Active ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days <= 7) return `Active ${days}d ago`
  return null
}

type WhatsAppModal = { profile: MatchWithProfile } | null

export default function MatchesPage() {
  const [myId, setMyId] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [whatsappModal, setWhatsappModal] = useState<WhatsAppModal>(null)

  const router = useRouter()
  useEffect(() => {
    const id = localStorage.getItem('my_profile_id')
    if (!id) { router.replace('/login'); return }
    setMyId(id)
    loadMatches(id)
  }, [])

  async function loadMatches(id: string) {
    const { data: matchRows } = await supabase.from('matches').select('*').or(`user1.eq.${id},user2.eq.${id}`)
    if (!matchRows?.length) { setLoading(false); return }
    const otherIds = matchRows.map(m => m.user1 === id ? m.user2 : m.user1)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', otherIds)
    const enriched: MatchWithProfile[] = (profiles || []).map(p => {
      const matchRow = matchRows.find(m => m.user1 === p.id || m.user2 === p.id)
      return { ...p, match_id: matchRow?.id }
    }).filter(p => p.match_id)
    setMatches(enriched)
    setLoading(false)
  }

  if (!myId) return (
    <div className="min-h-screen" style={{background: '#FFF7ED'}}>
      <AppHeader />
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">You need a profile to view matches</h2>
        <p className="text-gray-500 text-sm mb-8">Register your profile first, express interest on others, and when they accept — your matches appear here.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="btn-primary px-6 py-2.5">Register Now</Link>
          <Link href="/browse" className="btn-outline px-6 py-2.5">Browse Profiles</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{background: '#FFF7ED'}}>
      <AppHeader />
      <LaunchBanner />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Matches</h1>
          <p className="text-gray-500 text-sm mt-1">Mutual connections — full biodata, contact, and chat unlocked</p>
        </div>

        {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading matches...</div>}

        {!loading && matches.length === 0 && (
          <div className="card p-12 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💌</div>
            <p className="font-semibold text-gray-700">No mutual matches yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Express interest on profiles — when they accept, you'll see them here.</p>
            <Link href="/browse" className="btn-primary px-6 py-2.5">Browse Profiles</Link>
          </div>
        )}

        <div className="space-y-4">
          {matches.map(p => {
            const seenLabel = lastSeenLabel(p.last_login_at)
            return (
              <div key={p.id} className="card p-6">
                <div className="flex items-start gap-4 mb-4">
                  {p.photo_url && p.photo_visibility !== 'hidden' ? (
                    <img src={p.photo_url} alt={p.full_name}
                      className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-gray-100" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-lg shrink-0">
                      {initials(p.full_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-gray-900">{p.full_name}</h2>
                      <span className="badge badge-approved">Matched ✓</span>
                      {seenLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: seenLabel === 'Online now' ? '#ECFDF5' : '#F5F5F4', color: seenLabel === 'Online now' ? '#065F46' : '#6B7280' }}>
                          {seenLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">{getAge(p.date_of_birth)} yrs · {p.profession}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#7F1D1D' }}>📍 {p.native_district}, {p.native_state}</p>
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="flex gap-2 mb-4">
                  <Link href={`/profile/${p.id}`}
                    className="flex-1 py-2 text-center text-sm font-semibold rounded-lg border transition-all"
                    style={{ borderColor: '#EDE8E0', color: '#4B5563' }}>
                    View Profile
                  </Link>
                  <Link href={`/chat/${p.match_id}`}
                    className="flex-1 py-2 text-center text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                    style={{ background: '#9B1C1C' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Message
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4 pt-4" style={{borderTop: '1px solid #F5F5F4'}}>
                  {[
                    ['Native', `${p.native_district}, ${p.native_state}`],
                    ['City', p.current_city],
                    ['Education', p.education || '—'],
                    ['Caste', p.caste || '—'],
                    ['Height', p.height_cm ? cmToFeet(p.height_cm) : '—'],
                    ['Family', p.family_type ? p.family_type.charAt(0).toUpperCase() + p.family_type.slice(1) : '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="section-label">{label}</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {revealedIds.has(p.id) ? (
                  <div className="mb-4 pt-3 space-y-3" style={{borderTop: '1px solid #F5F5F4'}}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {p.phone && (
                        <div>
                          <p className="section-label">Phone</p>
                          <p className="text-sm font-medium text-gray-700 mt-0.5">{p.phone}</p>
                        </div>
                      )}
                      <div className={p.phone ? '' : 'col-span-2'}>
                        <p className="section-label">Email</p>
                        <p className="text-sm font-medium text-gray-700 mt-0.5 break-all">{p.email}</p>
                      </div>
                    </div>
                    {p.phone && (
                      <div className="flex gap-2 pt-1">
                        <a
                          href={`tel:${p.phone.replace(/\s/g, '')}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg border transition-all"
                          style={{background: '#F0F9FF', color: '#0369A1', borderColor: '#BAE6FD'}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.32h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.72 16.92z"/>
                          </svg>
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg border transition-all"
                          style={{background: '#F0FDF4', color: '#166534', borderColor: '#BBF7D0'}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                          </svg>
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setWhatsappModal({ profile: p })}
                    className="w-full mb-4 py-2.5 text-sm font-semibold rounded-lg border transition-all"
                    style={{ background: '#F0FDF4', color: '#166534', borderColor: '#BBF7D0' }}>
                    View Contact Details
                  </button>
                )}

                {p.about && (
                  <p className="text-sm text-gray-500 italic pt-3" style={{borderTop: '1px solid #F5F5F4'}}>"{p.about}"</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <MobileNav />

      {/* WhatsApp Safety Modal */}
      {whatsappModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setWhatsappModal(null)}>
          <div className="w-full max-w-sm mx-4 mb-4 sm:mb-0 card p-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#FEF2F2' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 font-serif-display mb-0.5">Before you connect</h3>
            <p className="text-xs text-gray-400 mb-5">A quick community safety reminder</p>
            <div className="space-y-4 mb-6">
              {[
                'Always verify on a video call before meeting in person or sharing any sensitive information.',
                'Never share Aadhaar, PAN, or financial details over WhatsApp — even after a mutual match.',
                'Trust your instincts. Block and report anyone who makes you feel pressured or uncomfortable.',
              ].map((tip, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ background: '#FEF2F2', color: '#9B1C1C' }}>{i + 1}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setWhatsappModal(null)} className="flex-1 btn-ghost py-2.5 text-sm">
                Go back
              </button>
              <button
                onClick={() => {
                  setRevealedIds(prev => new Set([...prev, whatsappModal.profile.id]))
                  setWhatsappModal(null)
                }}
                className="flex-1 btn-primary py-2.5 text-sm">
                I understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
