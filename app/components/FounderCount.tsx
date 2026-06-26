'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const GOAL = 1000

/* Live "X / 1,000 joined" for the Founding Member card. Uses the landing-page
   .founder-progress / .founder-count classes so the mockup styling is unchanged. */
export default function FounderCount() {
  const [joined, setJoined] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .then(({ count }) => setJoined(count ?? 0))
  }, [])

  const j = Math.min(joined ?? 0, GOAL)
  const pct = joined === null ? 0 : Math.min(Math.max(Math.round((j / GOAL) * 100), j > 0 ? 4 : 0), 100)

  return (
    <>
      <div className="founder-progress"><span style={{ width: `${pct}%` }} /></div>
      <div className="founder-count"><strong>{joined === null ? '—' : j.toLocaleString('en-IN')}</strong> / 1,000 joined</div>
    </>
  )
}
