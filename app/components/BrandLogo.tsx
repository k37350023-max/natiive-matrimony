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
          {/* Cream location pin (native place) with a heart cut out (marriage) */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            fill="#FBFAF5"
            d="M24 4c-7.7 0-14 6.1-14 13.9 0 9.6 11.6 22.9 13.1 24.5.5.5 1.3.5 1.8 0C26.4 40.8 38 27.5 38 17.9 38 10.1 31.7 4 24 4Zm0 22.9s-7-4.4-7-9.4c0-2.4 1.9-4.2 4.2-4.2 1.5 0 2.8.8 3.5 2 .7-1.2 2-2 3.5-2 2.3 0 4.2 1.8 4.2 4.2 0 5-7 9.4-7 9.4Z"
          />
        </svg>
      </span>
      <span className="app-brand-copy">
        <span className="app-brand-native">Native</span>
        <span className="app-brand-matrimony">Matrimony</span>
        {showTagline && <small>By native place</small>}
      </span>
    </Link>
  )
}
