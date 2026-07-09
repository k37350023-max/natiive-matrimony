'use client'
import Link from 'next/link'

/* A promo card that flows inside the browse grid, interspersed among profiles.
   - Guests: convert — "create your profile in 30 seconds".
   - Members (already have a profile): the alert angle — "get notified". */
export default function JoinPromoTile({
  member = false,
  onCreateAlert,
  registerHref = '/register',
}: {
  member?: boolean
  onCreateAlert?: () => void
  registerHref?: string
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col justify-center items-center text-center px-4 py-5"
      style={{ background: 'linear-gradient(160deg, #1B5E20 0%, #14351C 100%)', color: '#EAF3EA', minHeight: 200 }}>
      <span className="w-11 h-11 rounded-xl flex items-center justify-center mb-2.5" style={{ background: 'rgba(255,255,255,0.14)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EAF3EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </span>
      <p className="font-extrabold text-[15px] leading-snug">New profiles join every day</p>
      <p className="text-[12.5px] mt-1.5 leading-relaxed" style={{ color: '#CFE3D2' }}>
        {member
          ? 'Turn on an alert and get notified the moment a new match from your native place joins.'
          : 'Create your profile in 30 seconds and get notified when new matches join.'}
      </p>
      {member ? (
        <button
          onClick={onCreateAlert}
          className="mt-3.5 text-sm font-bold rounded-xl px-5"
          style={{ background: '#EAF3EA', color: '#14351C', minHeight: 42 }}>
          Create Alert
        </button>
      ) : (
        <Link
          href={registerHref}
          className="mt-3.5 text-sm font-bold rounded-xl px-5 inline-flex items-center"
          style={{ background: '#EAF3EA', color: '#14351C', minHeight: 42, textDecoration: 'none' }}>
          Create Free Profile
        </Link>
      )}
    </div>
  )
}
