'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  const started = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (target === 0) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const elapsed = Date.now() - start
          const progress = Math.min(elapsed / duration, 1)
          const ease = 1 - Math.pow(1 - progress, 3)
          setVal(Math.round(ease * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, duration])

  return { val, ref }
}

function Counter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { val, ref } = useCountUp(value)
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '20px 12px' }}>
      <p style={{ fontSize: '30px', fontWeight: 800, color: '#0F0F0F', margin: '0 0 4px', lineHeight: 1, letterSpacing: '-0.03em' }}>
        {val.toLocaleString('en-IN')}{suffix}
      </p>
      <p style={{ fontSize: '12.5px', color: '#9CA3AF', margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  )
}

export default function LiveCounters() {
  const [counts, setCounts] = useState({ profiles: 0, interests: 0, matches: 0 })

  useEffect(() => {
    async function load() {
      const [{ count: profiles }, { count: interests }, { count: matches }] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('interests').select('id', { count: 'exact', head: true }),
        supabase.from('matches').select('id', { count: 'exact', head: true }),
      ])
      setCounts({ profiles: profiles || 0, interests: interests || 0, matches: matches || 0 })
    }
    load()
  }, [])

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
      background: 'white', borderRadius: '16px',
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {[
        { value: counts.profiles, label: 'Profiles registered' },
        { value: counts.interests, label: 'Interests exchanged' },
        { value: counts.matches, label: 'Couples matched' },
      ].map(({ value, label }, i) => (
        <div key={label} style={{ borderRight: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
          <Counter value={value} label={label} />
        </div>
      ))}
    </div>
  )
}
