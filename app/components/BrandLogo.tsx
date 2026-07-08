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
        <svg viewBox="0 0 44 54" role="img" focusable="false">
          {/* Paddy / rice stalk — native roots: cream grains fanning up from a green stalk */}
          <path d="M22 48C26 35 31 22 37 13 35 26 31 41 23 49Z" fill="#1B4D2E" />
          <path d="M22 47C22 43 22 42 22 40" stroke="#2E7D46" strokeWidth="1.7" strokeLinecap="round" fill="none" />
          <path d="M22 46C17.5 44 12 46 8.5 50 13.5 51.5 19 49.5 22 45Z" fill="#5FA03C" />
          <path d="M22 45.5C24.5 44 29.5 44.5 32.5 47 29 48.5 24.5 48 22 45Z" fill="#5FA03C" />
          <path d="M22 44C19.6 36 19.6 24 22 16 24.4 24 24.4 36 22 44Z" fill="#ECE4D0" />
          <path d="M22 44C17.8 37.5 14.6 27.5 14 20.5 18.2 24.5 21.4 35 22 44Z" fill="#ECE4D0" />
          <path d="M22 44C26.2 37.5 29.4 27.5 30 20.5 25.8 24.5 22.6 35 22 44Z" fill="#ECE4D0" />
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
