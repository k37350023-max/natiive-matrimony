export default function HowItWorks() {
  const steps = [
    {
      n: '1',
      title: 'Create your profile',
      desc: 'Share your native place, education, and what you\'re looking for. Takes under 5 minutes.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      n: '2',
      title: 'Browse by native place',
      desc: 'Filter by district, profession, and preferences. Find profiles from your hometown or theirs.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
        </svg>
      ),
    },
    {
      n: '3',
      title: 'Send an interest',
      desc: 'Found someone you like? Send an interest. Their family reviews it and responds.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
    },
    {
      n: '4',
      title: 'Connect when both say yes',
      desc: 'When both families accept, contact details unlock and a chat opens. Take it from there.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7F1D1D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
  ]

  return (
    <section style={{ maxWidth: '900px', margin: '0 auto 80px', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <p style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7F1D1D', margin: '0 0 10px' }}>Simple process</p>
        <h2 className="font-serif-display" style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 700, color: '#0F0F0F', letterSpacing: '-0.02em', margin: 0 }}>
          How it works
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ position: 'relative', background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div style={{
                display: 'none',
                position: 'absolute', top: '36px', right: '-14px', width: '12px', height: '2px',
                background: '#FECACA', zIndex: 1,
              }} className="hiw-connector" />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#FECACA', letterSpacing: '0.04em' }}>STEP {s.n}</span>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F0F0F', margin: '0 0 8px', letterSpacing: '-0.01em' }}>{s.title}</p>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
