import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'NativeMatrimony — marriage profiles by native place'

/* Default branded share card for the homepage and any page without its own. */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', background: '#14241C', padding: '76px 84px',
          fontFamily: 'sans-serif', color: '#FBFAF5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>N</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>NativeMatrimony</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>
            {'Create your profile in 30 seconds.'}
          </div>
          <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.05, color: '#9FD4A8' }}>
            {'Let native matches find you.'}
          </div>
          <div style={{ fontSize: 34, color: '#C6D3C9', marginTop: 22, maxWidth: 940 }}>
            {'Search by native place, save alerts, and get notified when matching profiles join.'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {['Native-place first', 'Free to start', 'Place alerts', 'Mutual interest only'].map(t => (
            <div key={t} style={{ fontSize: 24, fontWeight: 700, background: '#1B5E20', color: '#EAF3EA', padding: '11px 22px', borderRadius: 999 }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
