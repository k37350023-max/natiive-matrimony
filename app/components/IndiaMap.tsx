'use client'
import { useState, useEffect } from 'react'

// ViewBox 0 0 300 380 — simplified illustrative India
const PATHS = {
  north:    'M22,5 L278,5 L290,28 L282,65 L258,82 L228,78 L195,88 L168,85 L120,92 L78,88 L50,102 L28,85 L12,50 Z',
  maha:     'M50,102 L120,92 L148,108 L158,140 L146,168 L104,175 L58,165 L44,142 Z',
  karnataka:'M44,142 L104,175 L146,168 L178,170 L168,200 L175,228 L158,252 L128,258 L100,242 L78,218 L62,185 Z',
  tn:       'M128,258 L158,252 L175,228 L195,248 L222,245 L218,295 L196,332 L170,338 L148,312 L128,285 Z',
  kerala:   'M62,185 L78,218 L100,242 L128,258 L128,285 L110,320 L86,308 L70,260 Z',
  telangana:'M120,92 L168,85 L195,88 L208,118 L212,148 L198,165 L178,170 L158,140 L148,108 Z',
  coastal:  'M195,88 L228,78 L258,82 L274,108 L280,155 L258,172 L238,178 L218,158 L212,148 L208,118 Z',
  rayala:   'M178,170 L198,165 L212,148 L218,158 L238,178 L244,215 L222,245 L195,248 L175,228 L168,200 Z',
}

const REGIONS = {
  telangana: {
    path: 'telangana', cx: 175, cy: 132, label: 'Telangana', region: 'Telangana',
    pins: [{ i: 'PR', dx: -16, dy: -10 }, { i: 'SK', dx: 12, dy: -14 }, { i: 'AK', dx: 4, dy: 10 }],
  },
  coastal: {
    path: 'coastal', cx: 242, cy: 132, label: 'Coastal Andhra', region: 'Coastal Andhra',
    pins: [{ i: 'RV', dx: -12, dy: -10 }, { i: 'MK', dx: 14, dy: -6 }, { i: 'SR', dx: 2, dy: 11 }],
  },
  rayala: {
    path: 'rayala', cx: 210, cy: 208, label: 'Rayalaseema', region: 'Rayalaseema',
    pins: [{ i: 'VR', dx: -13, dy: -8 }, { i: 'NK', dx: 13, dy: 4 }],
  },
}

const SEQ = ['telangana', 'coastal', 'rayala'] as const

type RegionKey = keyof typeof REGIONS

interface Props {
  mode: 'animated' | 'filter'
  selectedRegion?: string
  onRegionClick?: (region: string) => void
  compact?: boolean
}

export default function IndiaMap({ mode, selectedRegion, onRegionClick, compact }: Props) {
  const [active, setActive] = useState<string[]>([])
  const [pulsing, setPulsing] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== 'animated') return
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    function s(fn: () => void, ms: number) {
      const t = setTimeout(() => { if (!cancelled) fn() }, ms)
      timers.push(t)
    }

    function loop() {
      let t = 0
      setActive([]); setPulsing(null); t += 600

      SEQ.forEach((key, i) => {
        s(() => setPulsing(key), t); t += 1000
        s(() => { setActive(prev => [...prev, key]); setPulsing(null) }, t)
        t += i < SEQ.length - 1 ? 1800 : 2400
      })

      s(loop, t)
    }

    loop()
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [mode])

  function handleClick(key: RegionKey) {
    if (mode !== 'filter' || !onRegionClick) return
    const r = REGIONS[key]
    onRegionClick(selectedRegion === r.region ? '' : r.region)
  }

  function isActive(key: string) {
    return mode === 'filter'
      ? selectedRegion === REGIONS[key as RegionKey]?.region
      : active.includes(key)
  }

  const maxW = compact ? '210px' : mode === 'animated' ? '340px' : '250px'

  return (
    <>
      <style>{`
        @keyframes pinIn {
          0%   { opacity:0; transform: scale(0.3) translateY(-10px); }
          65%  { transform: scale(1.15) translateY(1px); }
          100% { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes pulseRing {
          0%   { opacity:.85; transform: scale(1); }
          100% { opacity:0;   transform: scale(3.5); }
        }
        .map-pin { animation: pinIn .42s ease-out both; }
        .map-pulse { animation: pulseRing .9s ease-out infinite; }
      `}</style>

      <svg viewBox="0 0 300 380" width="100%"
        style={{ display: 'block', maxWidth: maxW, margin: '0 auto' }}>

        {/* Non-interactive background states */}
        {(['north','maha','karnataka','tn','kerala'] as const).map(k => (
          <path key={k} d={PATHS[k]} fill="#E8E2D6" stroke="#D0C8BA" strokeWidth="1" />
        ))}

        {/* Interactive Telugu regions */}
        {(Object.keys(REGIONS) as RegionKey[]).map(key => {
          const r = REGIONS[key]
          const on = isActive(key)
          return (
            <path key={key}
              d={PATHS[r.path as keyof typeof PATHS]}
              fill={on ? '#FEF3C7' : '#DDD5C2'}
              stroke={on ? '#B45309' : '#B8AC98'}
              strokeWidth={on ? '2' : '1'}
              style={{ cursor: mode === 'filter' ? 'pointer' : 'default', transition: 'fill .3s,stroke .3s' }}
              onClick={() => handleClick(key)}
            />
          )
        })}

        {/* Region labels */}
        {(Object.keys(REGIONS) as RegionKey[]).map(key => {
          const r = REGIONS[key]
          const on = isActive(key)
          return (
            <text key={`lbl-${key}`}
              x={r.cx} y={r.cy + 1}
              textAnchor="middle" fontSize="6.5" fontWeight="700"
              fill={on ? '#92400E' : '#7A6F60'}
              style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .3s' }}>
              {r.label}
            </text>
          )
        })}

        {/* Pulsing ring on current animated region */}
        {pulsing && REGIONS[pulsing as RegionKey] && (() => {
          const r = REGIONS[pulsing as RegionKey]
          return (
            <circle key={pulsing}
              cx={r.cx} cy={r.cy} r="10"
              fill="none" stroke="#B45309" strokeWidth="2.5"
              className="map-pulse"
              style={{ transformOrigin: `${r.cx}px ${r.cy}px` }}
            />
          )
        })()}

        {/* Profile pins (animated mode) */}
        {mode === 'animated' && (Object.keys(REGIONS) as RegionKey[]).map(key => {
          const r = REGIONS[key]
          if (!active.includes(key)) return null
          return r.pins.map((pin, i) => (
            <g key={`${key}-${i}`}
              transform={`translate(${r.cx + pin.dx},${r.cy + pin.dy})`}>
              <g className="map-pin" style={{ animationDelay: `${i * 90}ms`,
                transformOrigin: '0 0' }}>
                <circle r="9" fill="#B45309" stroke="white" strokeWidth="1.5" />
                <text textAnchor="middle" y="3.5" fill="white" fontSize="5.5" fontWeight="bold">
                  {pin.i}
                </text>
              </g>
            </g>
          ))
        })}

      </svg>
    </>
  )
}
