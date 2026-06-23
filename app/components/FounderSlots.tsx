'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const GOAL = 1000

/* Shows how many founder-member slots remain (first 1,000 verified profiles). */
export default function FounderSlots() {
  const [claimed, setClaimed] = useState<number | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('verified', true).eq('status', 'approved')
      .then(({ count }) => setClaimed(count ?? 0))
  }, [])

  const filled = Math.min(claimed ?? 0, GOAL)
  const left = Math.max(GOAL - filled, 0)
  const pct = Math.min(Math.round((filled / GOAL) * 100), 100)

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${claimed === null ? 0 : Math.max(pct, 3)}%`, background: '#FBD56A', borderRadius: '99px', transition: 'width 0.6s ease' }} />
      </div>
      <p style={{ margin: '7px 0 0', fontSize: '11.5px', fontWeight: 700, color: '#FBD56A' }}>
        {claimed === null
          ? 'Checking availability…'
          : `${left.toLocaleString('en-IN')} of ${GOAL.toLocaleString('en-IN')} founder slots left`}
      </p>
    </div>
  )
}
