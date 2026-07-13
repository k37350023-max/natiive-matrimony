import { ImageResponse } from 'next/og'
import { findPlaceBySlug } from '@/lib/nativePlaces'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'NativeMatrimony native place'

/* Branded share card shown when a native-place page is shared on WhatsApp,
   Facebook, X, etc. A good preview image is the single biggest lever on
   share click-through — the core of the WhatsApp growth loop. */
export default async function Image({ params }: { params: Promise<{ place: string }> }) {
  const { place: slug } = await params
  const place = findPlaceBySlug(slug)
  const name = place?.name ?? 'Native place'
  const state = place?.state ?? 'India'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', background: '#14241C', padding: '72px 80px',
          fontFamily: 'sans-serif', color: '#FBFAF5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#1B5E20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800 }}>N</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>NativeMatrimony</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#9FD4A8', textTransform: 'uppercase', letterSpacing: 2 }}>
            {`${state} · Native place`}
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.02, marginTop: 12 }}>
            {`${name} Matrimony`}
          </div>
          <div style={{ fontSize: 34, color: '#C6D3C9', marginTop: 20, maxWidth: 900 }}>
            Marriage profiles by native place. Search, set a free alert, and let matches find you.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {['Free to start', 'Native-place first', 'Place alerts'].map(t => (
            <div key={t} style={{ fontSize: 26, fontWeight: 700, background: '#1B5E20', color: '#EAF3EA', padding: '12px 24px', borderRadius: 999 }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
