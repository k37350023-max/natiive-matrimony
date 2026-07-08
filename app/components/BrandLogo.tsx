import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  className?: string
  showTagline?: boolean
}

export default function BrandLogo({ href = '/', className = '', showTagline = true }: BrandLogoProps) {
  return (
    <Link href={href} className={`app-brand ${className}`.trim()} aria-label="NativeMatrimony home">
      <span className="app-brand-mark app-brand-pin-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img" focusable="false">
          {/* Location pin (native place) with a heart (marriage) inside */}
          <path d="M24 3.5c-8.4 0-15 6.4-15 15 0 10.2 12.6 24.4 14.1 26 .5.55 1.3.55 1.8 0C26.4 42.9 39 28.7 39 18.5c0-8.6-6.6-15-15-15z" fill="#1B5E20" />
          <path d="M24 30.6s-8.1-5-8.1-10.6c0-2.7 2.1-4.7 4.7-4.7 1.7 0 3.1 1 3.9 2.2.8-1.2 2.2-2.2 3.9-2.2 2.6 0 4.7 2 4.7 4.7 0 5.6-8.1 10.6-8.1 10.6z" fill="#FBFAF5" />
        </svg>
      </span>
      <span className="app-brand-copy">
        <span className="app-brand-native">NATIVE</span>
        <span className="app-brand-matrimony">Matrimony</span>
        {showTagline && <small>Native profiles</small>}
      </span>
    </Link>
  )
}
