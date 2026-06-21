'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import IndiaData from '../../public/india-map.json'

// Telangana = tg, Andhra Pradesh = ap (Coastal + Rayalaseema are both within AP)
// Background south Indian states shown lighter
const BG_STATES = ['ka', 'tn', 'kl', 'mh', 'or', 'ga', 'ct', 'mp']

type RKey = 'telangana' | 'coastal' | 'rayala'

const REGION_STATE_ID: Record<RKey, string> = {
  telangana: 'tg',
  coastal: 'ap',
  rayala: 'ap',
}

const REGION_LABEL: Record<RKey, string> = {
  telangana: 'Telangana',
  coastal: 'Coastal Andhra',
  rayala: 'Rayalaseema',
}

const SEQ: RKey[] = ['telangana', 'coastal', 'rayala']

// Approximate center of each region in the 612×696 viewBox
const PULSE_CENTER: Record<RKey, { cx: number; cy: number }> = {
  telangana: { cx: 240, cy: 475 },
  coastal:   { cx: 330, cy: 510 },
  rayala:    { cx: 270, cy: 545 },
}

const MOCK: Record<RKey, { initials: string; name: string; age: number; profession: string; district: string; color: string }[]> = {
  telangana: [
    { initials: 'PR', name: 'Priya R.', age: 27, profession: 'Software Engineer', district: 'Hyderabad', color: '#0B132B' },
    { initials: 'SK', name: 'Sai K.', age: 29, profession: 'Doctor', district: 'Warangal', color: '#0369A1' },
    { initials: 'AM', name: 'Anjali M.', age: 26, profession: 'Teacher', district: 'Karimnagar', color: '#047857' },
  ],
  coastal: [
    { initials: 'RV', name: 'Ravi V.', age: 31, profession: 'Business Owner', district: 'East Godavari', color: '#0B132B' },
    { initials: 'MK', name: 'Meena K.', age: 28, profession: 'Nurse', district: 'Visakhapatnam', color: '#6D28D9' },
    { initials: 'SP', name: 'Srini P.', age: 33, profession: 'Civil Engineer', district: 'Guntur', color: '#BE185D' },
  ],
  rayala: [
    { initials: 'VR', name: 'Vijay R.', age: 30, profession: 'Govt. Officer', district: 'Kurnool', color: '#047857' },
    { initials: 'NK', name: 'Nanda K.', age: 27, profession: 'Software Developer', district: 'Kadapa', color: '#0369A1' },
    { initials: 'KB', name: 'Kavya B.', age: 25, profession: 'MBA', district: 'Chittoor', color: '#0B132B' },
  ],
}

// South India zoom: center around (220, 560) in 612×696 → ~36%, ~80%
const ZOOM_ORIGIN = '36% 80%'
const ZOOM_SCALE = 2.2

function getPath(stateId: string) {
  return IndiaData.locations.find(l => l.id === stateId)?.path ?? ''
}

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
      setZoomed(false); setHighlighted(null); setPulsing(null); setProfileKey(null)
      t += 700

      s(() => setZoomed(true), t); t += 1200

      SEQ.forEach((key, i) => {
        s(() => setPulsing(key), t); t += 900
        s(() => { setHighlighted(key); setPulsing(null); setProfileKey(key) }, t)
        t += i < SEQ.length - 1 ? 2400 : 2000
      })

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

  // Which state IDs are currently highlighted (active)
  function isHighlighted(stateId: string): boolean {
    if (!highlighted) return false
    return REGION_STATE_ID[highlighted] === stateId
  }

  return (
    <>
      <style>{`
        @keyframes mapPulse {
          0%   { opacity:.8; transform:scale(1); }
          100% { opacity:0; transform:scale(4); }
        }
        @keyframes profileIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .map-pulse-ring { animation: mapPulse 1s ease-out infinite; }
        .profile-card-in { animation: profileIn .3s ease-out both; }
      `}</style>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start w-full">

        {/* ── Map ── */}
        <div style={{
          width: '100%', maxWidth: '280px', flexShrink: 0,
          aspectRatio: '612 / 696', overflow: 'hidden',
          borderRadius: '16px', margin: '0 auto',
          background: '#F8FAFC',
        }}>
          <svg
            viewBox={IndiaData.viewBox}
            width="100%" height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{
              display: 'block',
              transform: zoomed ? `scale(${ZOOM_SCALE})` : 'scale(1)',
              transformOrigin: ZOOM_ORIGIN,
              transition: 'transform 1.2s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* All states — base layer */}
            {IndiaData.locations.map(loc => {
              const isTeluguAP = loc.id === 'ap'
              const isTeluguTG = loc.id === 'tg'
              const isBg = BG_STATES.includes(loc.id)
              const highlighted_ = isHighlighted(loc.id)

              let fill = '#EAE4D6'      // default: very light tan (most states)
              let stroke = '#D5CDB8'
              let strokeW = '0.5'

              if (isTeluguAP || isTeluguTG) {
                fill = highlighted_ ? '#E0F7FC' : '#D6C9AA'
                stroke = highlighted_ ? '#0B132B' : '#9E8E6A'
                strokeW = highlighted_ ? '2' : '1'
              } else if (isBg) {
                fill = '#E4DDD0'
                stroke = '#CFC8B5'
              }

              const isClickable = isTeluguAP || isTeluguTG

              return (
                <path
                  key={loc.id}
                  d={loc.path}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeW}
                  style={{
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'fill .4s, stroke .4s, stroke-width .4s',
                  }}
                  onClick={() => {
                    if (loc.id === 'tg') handleClick('telangana')
                    else if (loc.id === 'ap') handleClick('coastal')
                  }}
                />
              )
            })}

            {/* Telangana label */}
            <text x="230" y="472" textAnchor="middle" fontSize="8" fontWeight="700"
              fill={highlighted && REGION_STATE_ID[highlighted] === 'tg' ? '#0B132B' : '#7A6F5A'}
              style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .3s' }}>
              Telangana
            </text>

            {/* AP labels */}
            <text x="320" y="510" textAnchor="middle" fontSize="7" fontWeight="700"
              fill={highlighted && REGION_STATE_ID[highlighted] === 'ap' ? '#0B132B' : '#7A6F5A'}
              style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .3s' }}>
              Andhra Pradesh
            </text>

            {/* Pulsing ring */}
            {pulsing && (() => {
              const { cx, cy } = PULSE_CENTER[pulsing]
              return (
                <circle
                  key={`pulse-${pulsing}`}
                  cx={cx} cy={cy} r="12"
                  fill="none" stroke="#0B132B" strokeWidth="3"
                  className="map-pulse-ring"
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
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
              <p className="text-sm text-gray-400 font-medium">
                Click a region on the map<br />to see profiles from there
              </p>
            </div>
          )}

          {profileKey && (
            <div key={profileKey}>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Profiles from</span>
                <span className="text-sm font-bold px-3 py-0.5 rounded-full"
                  style={{ background: '#E0F7FC', color: '#0B132B' }}>
                  {REGION_LABEL[profileKey]}
                </span>
              </div>

              <div className="space-y-2">
                {MOCK[profileKey].map((p, i) => (
                  <div key={p.name} className="profile-card-in" style={{ animationDelay: `${i * 75}ms` }}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ background: 'white', borderColor: '#E8EDF3' }}>
                      {/* Geometric avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-sm">
                        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                          <rect width="40" height="40" fill={p.color + '33'}/>
                          <rect x="20" y="0" width="20" height="20" fill={p.color + '55'}/>
                          <rect x="0" y="20" width="20" height="20" fill={p.color + '44'}/>
                          <circle cx="20" cy="20" r="13" fill={p.color + '66'}/>
                          <circle cx="20" cy="20" r="7" fill={p.color + '44'}/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500 truncate">{p.age} yrs · {p.profession}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: '#E0F7FC', color: '#0B132B' }}>
                        {p.district}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/register"
                className="mt-4 flex items-center justify-center gap-1.5 font-semibold py-2.5 rounded-xl text-sm"
                style={{ background: '#0B132B', color: 'white' }}>
                See all {REGION_LABEL[profileKey]} profiles →
              </Link>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
