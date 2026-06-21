'use client'
import { useState, useEffect } from 'react'
import IndiaData from '../../public/india-map.json'

const TELUGU_IDS = new Set(['tg', 'ap'])

interface Props {
  mode: 'animated' | 'filter'
  selectedRegion?: string
  onRegionClick?: (region: string) => void
  compact?: boolean
}

function regionToStateId(region: string): string | null {
  if (region === 'Telangana') return 'tg'
  if (region === 'Coastal Andhra' || region === 'Rayalaseema') return 'ap'
  return null
}

const TG_CX = 225, TG_CY = 468
const AP_CX = 305, AP_CY = 510
const ZOOM_ORIGIN = '36% 80%'
const ZOOM_SCALE = 2.2

export default function IndiaMap({ mode, selectedRegion = '', onRegionClick, compact }: Props) {
  const [animHighlight, setAnimHighlight] = useState<string | null>(null)
  const [zoomed, setZoomed] = useState(false)

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
      setAnimHighlight(null); setZoomed(false); t += 600
      s(() => setZoomed(true), t); t += 1000
      s(() => setAnimHighlight('tg'), t); t += 2200
      s(() => setAnimHighlight('ap'), t); t += 2200
      s(() => { setAnimHighlight(null); setZoomed(false) }, t); t += 800
      s(loop, t + 200)
    }
    loop()
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [mode])

  function handleClick(stateId: string) {
    if (mode !== 'filter' || !onRegionClick) return
    if (stateId === 'tg') {
      onRegionClick(selectedRegion === 'Telangana' ? '' : 'Telangana')
    } else if (stateId === 'ap') {
      if (selectedRegion === '' || selectedRegion === 'Telangana') onRegionClick('Coastal Andhra')
      else if (selectedRegion === 'Coastal Andhra') onRegionClick('Rayalaseema')
      else onRegionClick('')
    }
  }

  const highlightedId = mode === 'filter' ? regionToStateId(selectedRegion) : animHighlight
  const isZoomed = mode === 'animated' ? zoomed : false
  const size = compact ? '200px' : '260px'

  const apLabel =
    selectedRegion === 'Coastal Andhra' ? 'Coastal Andhra' :
    selectedRegion === 'Rayalaseema' ? 'Rayalaseema' :
    mode === 'animated' && animHighlight === 'ap' ? 'Andhra Pradesh' :
    'Andhra Pradesh'

  return (
    <>
      <style>{`
        @keyframes indiaMapPulse {
          0%   { opacity:.8; transform:scale(1); }
          100% { opacity:0;  transform:scale(3.5); }
        }
        .india-map-pulse { animation: indiaMapPulse .9s ease-out infinite; }
      `}</style>
      <div style={{
        width: '100%', maxWidth: size, aspectRatio: '612/696',
        overflow: 'hidden', borderRadius: '14px',
        margin: '0 auto', background: '#F8FAFC',
      }}>
        <svg
          viewBox={IndiaData.viewBox}
          width="100%" height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{
            display: 'block',
            transform: isZoomed ? `scale(${ZOOM_SCALE})` : 'scale(1)',
            transformOrigin: ZOOM_ORIGIN,
            transition: 'transform 1.1s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {IndiaData.locations.map(loc => {
            const isTelugu = TELUGU_IDS.has(loc.id)
            const isOn = highlightedId === loc.id
            let fill = '#EAE4D6'
            let stroke = '#D5CDB8'
            let sw = '0.5'
            if (isTelugu) {
              fill = isOn ? '#E0F7FC' : '#D6C9AA'
              stroke = isOn ? '#0B132B' : '#9E8E6A'
              sw = isOn ? '2.5' : '1'
            }
            return (
              <path key={loc.id} d={loc.path}
                fill={fill} stroke={stroke} strokeWidth={sw}
                style={{
                  cursor: (isTelugu && mode === 'filter') ? 'pointer' : 'default',
                  transition: 'fill .35s, stroke .35s, stroke-width .35s',
                }}
                onClick={() => handleClick(loc.id)}
              />
            )
          })}

          {/* State labels */}
          <text x={TG_CX} y={TG_CY} textAnchor="middle" fontSize={compact ? '7' : '9'} fontWeight="700"
            fill={highlightedId === 'tg' ? '#0B132B' : '#7A6F5A'}
            style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .3s' }}>
            Telangana
          </text>
          <text x={AP_CX} y={AP_CY} textAnchor="middle" fontSize={compact ? '6' : '8'} fontWeight="700"
            fill={highlightedId === 'ap' ? '#0B132B' : '#7A6F5A'}
            style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill .3s' }}>
            {apLabel}
          </text>
          {mode === 'filter' && highlightedId === 'ap' && (
            <text x={AP_CX} y={AP_CY + 10} textAnchor="middle" fontSize="5" fill="#0B132B"
              style={{ pointerEvents: 'none', userSelect: 'none' }}>
              tap again to switch
            </text>
          )}

          {/* Animated pulse ring */}
          {mode === 'animated' && animHighlight && (() => {
            const cx = animHighlight === 'tg' ? TG_CX : AP_CX
            const cy = animHighlight === 'tg' ? TG_CY : AP_CY
            return (
              <circle cx={cx} cy={cy} r="12"
                fill="none" stroke="#0B132B" strokeWidth="2.5"
                className="india-map-pulse"
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
            )
          })()}
        </svg>
      </div>
    </>
  )
}
