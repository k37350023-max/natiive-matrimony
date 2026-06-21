const Shimmer = () => (
  <div style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '1px solid rgba(0,0,0,0.06)' }}>
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FBFAF5', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: '14px', background: '#FBFAF5', borderRadius: '6px', width: '55%', marginBottom: '8px' }} />
        <div style={{ height: '11px', background: '#FBFAF5', borderRadius: '6px', width: '35%' }} />
      </div>
    </div>
  </div>
)

export default function MatchesLoading() {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', background: '#FBFAF5' }}>
      <div style={{ height: '56px', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.06)' }} />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ height: '24px', width: '120px', background: '#FBFAF5', borderRadius: '6px', marginBottom: '8px' }} />
        {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} />)}
      </div>
    </div>
  )
}
