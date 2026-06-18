'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import MobileNav from '../components/MobileNav'

type Interest = {
  id: string
  from_user: string
  status: string
  created_at: string
  profile: {
    id: string
    full_name: string
    date_of_birth: string
    profession: string
    native_district: string
    native_state: string
    current_city: string
    verified: boolean
  }
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const COLORS = ['#B45309', '#0369A1', '#047857', '#6D28D9', '#BE185D']
function avatarBg(name: string) { return COLORS[name.charCodeAt(0) % COLORS.length] }

export default function InterestsPage() {
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const myId = typeof window !== 'undefined' ? localStorage.getItem('my_profile_id') : null

  useEffect(() => {
    if (myId) { load() } else { setLoading(false) }
  }, [])

  async function load() {
    const { data: rows } = await supabase
      .from('interests').select('*')
      .eq('to_user', myId).eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (!rows?.length) { setLoading(false); return }
    const ids = rows.map(r => r.from_user)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
    const merged = rows
      .map(r => ({ ...r, profile: profiles?.find(p => p.id === r.from_user) }))
      .filter(r => r.profile)
    setInterests(merged as Interest[])
    setLoading(false)
  }

  async function respond(interestId: string, fromUser: string, accept: boolean) {
    await supabase.from('interests').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', interestId)
    if (accept) {
      const { data: existing } = await supabase.from('matches').select('id')
        .or(`and(user1.eq.${myId},user2.eq.${fromUser}),and(user1.eq.${fromUser},user2.eq.${myId})`)
        .maybeSingle()
      if (!existing) {
        await supabase.from('matches').insert({ user1: fromUser, user2: myId })
      }
    }
    setInterests(i => i.filter(r => r.id !== interestId))
  }

  if (!myId) return (
    <div className="min-h-screen" style={{background: '#FFFBF5'}}>
      <header className="bg-white border-b px-5 h-14 flex items-center justify-between" style={{borderColor: '#EDE8E0'}}>
        <Link href="/" className="text-lg font-bold text-stone-900 font-serif-display">Natiive<span style={{color: '#B45309'}}>Matrimony</span></Link>
      </header>
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="font-semibold text-stone-700 mb-2">Login to see interests received</p>
        <Link href="/login" className="btn-primary px-6 py-2.5 mt-2">Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{background: '#FFFBF5'}}>
      <header className="bg-white border-b sticky top-0 z-40" style={{borderColor: '#EDE8E0'}}>
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-stone-900 font-serif-display">Natiive<span style={{color: '#B45309'}}>Matrimony</span></Link>
          <div className="flex gap-4">
            <Link href="/browse" className="text-sm text-stone-500 hover:text-amber-700">Browse</Link>
            <Link href="/matches" className="text-sm text-stone-500 hover:text-amber-700">Matches</Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-900 font-serif-display mb-1">Interests Received</h1>
        <p className="text-sm text-stone-500 mb-6">Accept to create a mutual match — they can then see your full biodata</p>

        {loading && <p className="text-stone-400 text-sm text-center py-12">Loading...</p>}

        {!loading && interests.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-3xl mb-3">💌</p>
            <p className="font-semibold text-stone-700">No pending interests</p>
            <p className="text-sm text-stone-400 mt-1">When someone expresses interest in you, it appears here.</p>
          </div>
        )}

        <div className="space-y-3">
          {interests.map(i => (
            <div key={i.id} className="card p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{background: avatarBg(i.profile.full_name)}}>
                    {initials(i.profile.full_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${i.profile.id}`} className="font-bold text-stone-900 hover:text-amber-700">{i.profile.full_name}</Link>
                      {i.profile.verified && <span className="badge badge-verified">✓ Verified</span>}
                    </div>
                    <p className="text-sm text-stone-500 mt-0.5">{getAge(i.profile.date_of_birth)} yrs · {i.profile.profession}</p>
                    <p className="text-xs mt-0.5" style={{color: '#92400E'}}>📍 {i.profile.native_district}, {i.profile.native_state}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => respond(i.id, i.from_user, true)}
                    className="px-4 py-2 text-white text-sm font-semibold rounded-lg"
                    style={{background: '#059669'}}>
                    Accept
                  </button>
                  <button onClick={() => respond(i.id, i.from_user, false)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border"
                    style={{borderColor: '#EDE8E0', color: '#78716C'}}>
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
