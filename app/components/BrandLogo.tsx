import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  className?: string
  showTagline?: boolean
}

export default function BrandLogo({ href = '/', className = '', showTagline = true }: BrandLogoProps) {
  return (
    <Link href={href} className={`app-brand ${className}`.trim()} aria-label="Native Matrimony home">
      <span className="app-brand-mark app-brand-emblem" aria-hidden="true">
        <svg viewBox="0 0 44 56" role="img" focusable="false">
          {/* Simple paddy grain: one green stalk with clear golden grains. */}
          <path d="M20 51C21 38 23 24 31 8" fill="none" stroke="#166534" strokeWidth="3.1" strokeLinecap="round" />
          <path d="M20 51C16 39 13 28 12 17" fill="none" stroke="#22A447" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="30" cy="13" rx="4.1" ry="7.4" fill="#F2B21C" stroke="#C98508" strokeWidth="0.7" transform="rotate(31 30 13)" />
          <ellipse cx="27" cy="20" rx="4.1" ry="7.4" fill="#F5C33A" stroke="#C98508" strokeWidth="0.7" transform="rotate(38 27 20)" />
          <ellipse cx="24" cy="27" rx="4.1" ry="7.4" fill="#F2B21C" stroke="#C98508" strokeWidth="0.7" transform="rotate(42 24 27)" />
          <ellipse cx="21" cy="34" rx="4.1" ry="7.4" fill="#F5C33A" stroke="#C98508" strokeWidth="0.7" transform="rotate(46 21 34)" />
          <ellipse cx="15" cy="21" rx="3.8" ry="6.8" fill="#F3B526" stroke="#C98508" strokeWidth="0.65" transform="rotate(-30 15 21)" />
          <ellipse cx="16" cy="29" rx="3.8" ry="6.8" fill="#F6C747" stroke="#C98508" strokeWidth="0.65" transform="rotate(-22 16 29)" />
          <path d="M18 47C14 45 10 46 7 50C12 52 16 51 20 47Z" fill="#2F7D32" />
        </svg>
      </span>
      <span className="app-brand-copy">
        <span className="app-brand-native">Native</span>
        <span className="app-brand-matrimony">Matrimony</span>
        {showTagline && <small>Rooted in tradition. United in love.</small>}
      </span>
    </Link>
  )
}
