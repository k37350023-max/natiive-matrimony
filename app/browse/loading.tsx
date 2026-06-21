export default function BrowseLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ height: '56px', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.06)' }} />
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ height: '32px', width: '180px', background: '#E8EDF3', borderRadius: '8px', marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ paddingBottom: '118%', background: 'linear-gradient(90deg, #F8FAFC 25%, #EDEBE8 50%, #F8FAFC 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ padding: '12px' }}>
                <div style={{ height: '14px', background: '#F8FAFC', borderRadius: '6px', marginBottom: '8px', width: '70%' }} />
                <div style={{ height: '11px', background: '#F8FAFC', borderRadius: '6px', width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}
