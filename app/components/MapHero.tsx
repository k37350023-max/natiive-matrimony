'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// ViewBox 0 0 300 380 — simplified illustrative India
const PATHS = {
  north:     'M22,5 L278,5 L290,28 L282,65 L258,82 L228,78 L195,88 L168,85 L120,92 L78,88 L50,102 L28,85 L12,50 Z',
  maha:      'M50,102 L120,92 L148,108 L158,140 L146,168 L104,175 L58,165 L44,142 Z',
  karnataka: 'M44,142 L104,175 L146,168 L178,170 L168,200 L175,228 L158,252 L128,258 L100,242 L78,218 L62,185 Z',
  tn:        'M128,258 L158,252 L175,228 L195,248 L222,245 L218,295 L196,332 L170,338 L148,312 L128,285 Z',
  kerala:    'M62,185 L78,218 L100,242 L128,258 L128,285 L110,320 L86,308 L70,260 Z',
  telangana: 'M120,92 L168,85 L195,88 L208,118 L212,148 L198,165 L178,170 L158,140 L148,108 Z',
  coastal:   'M195,88 L228,78 L258,82 L274,108 L280,155 L258,172 L238,178 L218,158 L212,148 L208,118 Z',
  rayala:    'M178,170 L198,165 L212,148 L218,158 L238,178 L244,215 L222,245 L195,248 L175,228 L168,200 Z',
}

// Center coords in viewBox space
const REGIONS = {
  telangana: { cx: 175, cy: 132, label: 'Telangana' },
  coastal:   { cx: 242, cy: 132, label: 'Coastal Andhra' },
  rayala:    { cx: 210, cy: 208, label: 'Rayalaseema' },
} as const

type RKey = keyof typeof REGIONS

// South India center in viewBox ≈ (160, 235) → 53%, 62%
const ZOOM_ORIGIN = '53% 62%'
const ZOOM_SCALE = 1.85

const MOCK: Record<RKey, { initials: string; name: string; age: number; profession: string; district: string; color: string }[]> = {
  telangana: [
    { initials: 'PR', name: 'Priya R.', age: 27, profession: 'Software Engineer', district: 'Hyderabad', color: '#B45309' },
    { initials: 'SK', name: 'Sai K.', age: 29, profession: 'Doctor', district: 'Warangal', color: '#0369A1' },
    { initials: 'AM', name: 'Anjali M.', age: 26, profession: 'Teacher', district: 'Karimnagar', color: '#047857' },
  ],
  coastal: [
    { initials: 'RV', name: 'Ravi V.', age: 31, profession: 'Business Owner', district: 'East Godavari', color: '#B45309' },
    { initials: 'MK', name: 'Meena K.', age: 28, profession: 'Nurse', district: 'Visakhapatnam', color: '#6D28D9' },
    { initials: 'SP', name: 'Srini P.', age: 33, profession: 'Civil Engineer', district: 'Guntur', color: '#BE185D' },
  ],
  rayala: [
    { initials: 'VR', name: 'Vijay R.', age: 30, profession: 'Govt. Officer', district: 'Kurnool', color: '#047857' },
    { initials: 'NK', name: 'Nanda K.', age: 27, profession: 'Software Developer', district: 'Kadapa', color: '#0369A1' },
    { initials: 'KB', name: 'Kavya B.', age: 25, profession: 'MBA', district: 'Chittoor', color: '#B45309' },
  ],
}

const REGION_LABEL: Record<RKey, string> = {
  telangana: 'Telangana',
  coastal: 'Coastal Andhra',
  rayala: 'Rayalaseema',
}

const SEQ: RKey[] = ['telangana', 'coastal', 'rayala']

export default function MapHero() {
  const [zoomed, setZoomed] = useState(false)
  const [highlighted, setHighlighted] = useState<RKey | null>(null)
  const [pulsing, setPulsing] = useState<RKey | null>(null)
  const [profileKey, setProfileKey] = useState<RKey | null>(null)

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    function s(fn: () => void, ms: number) {
      const t = setTimeout(() => { if (!cancelled) fn() }, ms)
      timers.push(t)
    }

    function loop() {
      let t = 0
      // Reset
      setZoomed(false); setHighlighted(null); setPulsing(null); setProfileKey(null)
      t += 700

      // Zoom into South India
      s(() => setZoomed(true), t); t += 1100

      // Step through each region
      SEQ.forEach((key, i) => {
        s(() => setPulsing(key), t); t += 850
        s(() => { setHighlighted(key); setPulsing(null); setProfileKey(key) }, t)
        t += i < SEQ.length - 1 ? 2300 : 2000
      })

      // Zoom back out and reset
      s(() => { setZoomed(false); setHighlighted(null); setProfileKey(null) }, t); t += 1200
      s(loop, t + 400)
    }

    loop()
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [])

  function handleClick(key: RKey) {
    setHighlighted(key)
    setProfileKey(key)
  }

  return (
    <>
      <style>{`
        @keyframes mapPulse {
          0%   { opacity:.85; transform:scale(1); }
          100% { opacity:0;   transform:scale(3.8); }
        }
        @keyframes profileIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .map-pulse-ring { animation: mapPulse .9s ease-out infinite; }
        .profile-card-in { animation: profileIn .3s ease-out both; }
      `}</style>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start w-full">

        {/* ── Map ── */}
        <div style={{
          width: '100%', maxWidth: '260px', flexShrink: 0,
          aspectRatio: '300 / 380', overflow: 'hidden',
          borderRadius: '20px', margin: '0 auto',
        }}>
          <svg viewBox="0 0 300 380" width="100%" height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{
              display: 'block',
              transform: zoomed ? `scale(${ZOOM_SCALE})` : 'scale(1)',
              transformOrigin: ZOOM_ORIGIN,
              transition: 'transform 1.15s cubic-bezier(0.4,0,0.2,1)',
            }}>

            {/* Non-interactive background states */}
            {(['north','maha','karnataka','tn','kerala'] as const).map(k => (
              <path key={k} d={PATHS[k]} fill="#E4DDD0" stroke="#CCC4B4" strokeWidth="1" />
            ))}

            {/* Clickable Telugu regions */}
            {(Object.keys(REGIONS) as RKey[]).map(key => {
              const on = highlighted === key
              return (
                <path key={key}
                  d={PATHS[key]}
                  fill={on ? '#FEF3C7' : '#D6CEBC'}
                  stroke={on ? '#B45309' : '#AEA590'}
                  strokeWidth={on ? '2.5' : '1'}
                  style={{ cursor: 'pointer', transition: 'fill .35s, stroke .35s, stroke-width .35s' }}
                  onClick={() => handleClick(key)}
                />
              )
            })}

            {/* Region labels */}
            {(Object.keys(REGIONS) as RKey[]).map(key => {
              const m = REGIONS[key]
              const on = highlighted === key
              return (
                <text key={`l-${key}`} x={m.cx} y={m.cy + 1}
                  textAnchor="middle" fontSize="6.5" fontWeight="700"
                  fill={on ? '#92400E' : '#7A6F60'}
                  style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .3s' }}>
                  {m.label}
                </text>
              )
            })}

            {/* Pulsing click indicator */}
            {pulsing && (() => {
              const m = REGIONS[pulsing]
              return (
                <circle key={`pulse-${pulsing}`}
                  cx={m.cx} cy={m.cy} r="10"
                  fill="none" stroke="#B45309" strokeWidth="2.5"
                  className="map-pulse-ring"
                  style={{ transformOrigin: `${m.cx}px ${m.cy}px` }}
                />
              )
            })()}
          </svg>
        </div>

        {/* ── Profiles panel ── */}
        <div className="flex-1 w-full min-w-0">
          {!profileKey && (
            <div className="text-center sm:text-left py-6">
              <p className="text-2xl mb-2">🗺️</p>
              <p className="text-sm text-stone-400 font-medium">
                Click a region on the map<br />to see profiles from there
              </p>
            </div>
          )}

          {profileKey && (
            <div key={profileKey}>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Profiles from</span>
                <span className="text-sm font-bold px-3 py-0.5 rounded-full"
                  style={{ background: '#FEF3C7', color: '#92400E' }}>
                  {REGION_LABEL[profileKey]}
                </span>
              </div>

              <div className="space-y-2">
                {MOCK[profileKey].map((p, i) => (
                  <div key={p.name} className="profile-card-in"
                    style={{ animationDelay: `${i * 75}ms` }}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ background: 'white', borderColor: '#EDE8E0' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: p.color }}>
                        {p.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 text-sm">{p.name}</p>
                        <p className="text-xs text-stone-500 truncate">{p.age} yrs · {p.profession}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: '#FEF3C7', color: '#92400E' }}>
                        {p.district}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/register"
                className="mt-4 flex items-center justify-center gap-1.5 font-semibold py-2.5 rounded-xl text-sm"
                style={{ background: '#B45309', color: 'white' }}>
                See all {REGION_LABEL[profileKey]} profiles →
              </Link>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
