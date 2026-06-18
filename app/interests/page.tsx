'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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

export default function InterestsPage() {
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const myId = typeof window !== 'undefined' ? localStorage.getItem('my_profile_id') : null

  useEffect(() => { if (myId) { load() } else { setLoading(false) } }, [])

  async function load() {
    const { data: rows } = await supabase.from('interests').select('*').eq('to_user', myId).eq('status', 'pending').order('created_at', { ascending: false })
    if (!rows?.length) { setLoading(false); return }
    const ids = rows.map(r => r.from_user)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids)
    const merged = rows.map(r => ({ ...r, profile: profiles?.find(p => p.id === r.from_user) })).filter(r => r.profile)
    setInterests(merged as Interest[])
    setLoading(false)
  }

  async function respond(interestId: string, fromUser: string, accept: boolean) {
    await supabase.from('interests').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', interestId)
    if (accept) {
      const { data: reverse } = await supabase.from('interests').select('id').eq('from_user', myId).eq('to_user', fromUser).eq('status', 'accepted').maybeSingle()
      if (reverse) {
        await supabase.from('matches').insert({ user1: myId, user2: fromUser })
      }
      // Also create match if they expressed interest in each other
      const { data: theirInterest } = await supabase.from('interests').select('id').eq('from_user', myId).eq('to_user', fromUser).maybeSingle()
      if (!theirInterest) {
        // Check if we already have a match
        const { data: existingMatch } = await supabase.from('matches').select('id').or(`user1.eq.${myId},user2.eq.${myId}`).maybeSingle()
        if (!existingMatch) {
          await supabase.from('matches').insert({ user1: myId, user2: fromUser })
        }
      }
    }
    setInterests(i => i.filter(r => r.id !== interestId))
  }

  const header = (
    <header className="border-b bg-white px-5 h-14 flex items-center justify-between">
      <Link href="/" className="text-lg font-bold text-stone-900">Natiive<span className="text-orange-700">Matrimony</span></Link>
      <div className="flex gap-3">
        <Link href="/browse" className="text-sm text-stone-600 hover:text-orange-700">Browse</Link>
        <Link href="/matches" className="text-sm text-stone-600 hover:text-orange-700">Matches</Link>
      </div>
    </header>
  )

  if (!myId) return (
    <div className="min-h-screen bg-stone-50">{header}
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="font-semibold text-stone-700 mb-2">Login to see interests</p>
        <Link href="/login" className="bg-orange-700 text-white px-6 py-2.5 rounded-xl font-semibold mt-2">Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">{header}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Interests Received</h1>
        <p className="text-sm text-stone-500 mb-6">Accept to create a mutual match</p>
        {loading && <p className="text-stone-400 text-sm text-center py-12">Loading...</p>}
        {!loading && interests.length === 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center">
            <p className="font-semibold text-stone-700">No pending interests</p>
            <p className="text-sm text-stone-400 mt-1">When someone expresses interest, it appears here.</p>
          </div>
        )}
        <div className="space-y-3">
          {interests.map(i => (
            <div key={i.id} className="bg-white rounded-2xl border border-stone-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${i.profile.id}`} className="font-semibold text-stone-900 hover:text-orange-700">{i.profile.full_name}</Link>
                    {i.profile.verified && <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Verified</span>}
                  </div>
                  <p className="text-sm text-stone-500 mt-0.5">{getAge(i.profile.date_of_birth)} yrs · {i.profile.profession}</p>
                  <p className="text-xs text-stone-400 mt-1">{i.profile.native_district}, {i.profile.native_state} · {i.profile.current_city}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => respond(i.id, i.from_user, true)} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">Accept</button>
                  <button onClick={() => respond(i.id, i.from_user, false)} className="px-4 py-2 border border-stone-300 text-stone-600 text-sm font-semibold rounded-lg hover:bg-stone-50">Decline</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
