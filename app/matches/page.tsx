'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Profile = {
  id: string
  full_name: string
  gender: string
  date_of_birth: string
  profession: string
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
  education: string
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

export default function MatchesPage() {
  const [myId, setMyId] = useState('')
  const [matches, setMatches] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem('my_profile_id') || ''
    setMyId(id)
    if (id) loadMatches(id)
  }, [])

  async function loadMatches(id: string) {
    setLoading(true)
    const { data: matchRows } = await supabase
      .from('matches')
      .select('*')
      .or(`user1.eq.${id},user2.eq.${id}`)

    if (!matchRows || matchRows.length === 0) { setLoading(false); return }

    const otherIds = matchRows.map(m => m.user1 === id ? m.user2 : m.user1)
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', otherIds)
    setMatches(profiles || [])
    setLoading(false)
  }

  async function downloadPDF(p: Profile) {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('NatiiveMatrimony — Biodata', 20, 20)
    doc.setFontSize(12)
    const lines = [
      `Name: ${p.full_name}`,
      `Age: ${getAge(p.date_of_birth)} years`,
      `Profession: ${p.profession}`,
      `Education: ${p.education || '—'}`,
      `Native Place: ${p.native_district}, ${p.native_state}`,
      `Current City: ${p.current_city}`,
      `Height: ${p.height_cm} cm`,
      `Religion: ${p.religion}`,
      `Caste: ${p.caste || '—'}`,
      `Mother Tongue: ${p.mother_tongue}`,
      `Family Type: ${p.family_type || '—'}`,
      `Phone: ${p.phone}`,
      `Email: ${p.email}`,
      `About: ${p.about || '—'}`,
    ]
    lines.forEach((line, i) => doc.text(line, 20, 40 + i * 10))
    doc.save(`${p.full_name.replace(/ /g, '_')}_biodata.pdf`)
  }

  const header = (
    <div className="bg-orange-700 text-white px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Link href="/browse" className="text-sm underline">← Browse</Link>
        <span className="text-xl font-bold">My Matches</span>
      </div>
      <Link href="/register" className="text-sm bg-white text-orange-700 px-4 py-1 rounded-full font-medium">Register</Link>
    </div>
  )

  if (!myId) {
    return (
      <div className="min-h-screen bg-orange-50">
        {header}
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <p className="text-4xl mb-3">🔐</p>
          <p className="text-gray-700 font-medium mb-2">You need a profile to view matches</p>
          <p className="text-gray-500 text-sm mb-6">Register your profile first, then come back here after mutual interest.</p>
          <div className="flex gap-3">
            <Link href="/register" className="bg-orange-600 text-white px-6 py-2 rounded-lg">Register</Link>
            <Link href="/browse" className="border border-orange-600 text-orange-600 px-6 py-2 rounded-lg">Browse Profiles</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {header}

      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading && <p className="text-center text-gray-400 py-10">Loading matches...</p>}

        {!loading && matches.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">💌</p>
            <p className="font-medium">No mutual matches yet</p>
            <p className="text-sm mt-1">Express interest on profiles and wait for them to accept</p>
            <Link href="/browse" className="mt-4 inline-block bg-orange-600 text-white px-6 py-2 rounded-lg">Browse Profiles</Link>
          </div>
        )}

        <div className="space-y-4">
          {matches.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{p.full_name}</h2>
                  <p className="text-gray-500 text-sm">{getAge(p.date_of_birth)} yrs · {p.profession}</p>
                </div>
                <span className="text-green-600 font-semibold text-sm bg-green-50 px-3 py-1 rounded-full">✓ Matched</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="text-gray-400">Native: </span><span className="font-medium">{p.native_district}, {p.native_state}</span></div>
                <div><span className="text-gray-400">City: </span><span className="font-medium">{p.current_city}</span></div>
                <div><span className="text-gray-400">Phone: </span><span className="font-medium">{p.phone}</span></div>
                <div><span className="text-gray-400">Email: </span><span className="font-medium">{p.email}</span></div>
                <div><span className="text-gray-400">Height: </span><span className="font-medium">{p.height_cm} cm</span></div>
                <div><span className="text-gray-400">Caste: </span><span className="font-medium">{p.caste || '—'}</span></div>
                <div><span className="text-gray-400">Education: </span><span className="font-medium">{p.education || '—'}</span></div>
                <div><span className="text-gray-400">Family: </span><span className="font-medium">{p.family_type || '—'}</span></div>
              </div>

              {p.about && <p className="text-sm text-gray-600 italic mb-4">"{p.about}"</p>}

              <button
                onClick={() => downloadPDF(p)}
                className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700"
              >
                📄 Download Biodata PDF — Share with Elders
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
