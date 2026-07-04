import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  className?: string
  showTagline?: boolean
}

export default function BrandLogo({ href = '/', className = '', showTagline = true }: BrandLogoProps) {
  return (
    <Link href={href} className={`app-brand ${className}`.trim()} aria-label="NativeMatrimony home">
      <span className="app-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" role="img" focusable="false">
          <path className="app-brand-stem" d="M19.5 31.5C22.2 24.5 22 17.2 17.8 9.2" />
          <path className="app-brand-grain" d="M17.5 10.2C12.2 9.1 9 11.5 8.5 16.4C13.2 16.7 16.5 14.6 17.5 10.2Z" />
          <path className="app-brand-grain" d="M21.2 15.4C26.1 13.2 29.7 14.7 31.2 19.4C26.9 20.8 23.2 19.5 21.2 15.4Z" />
          <path className="app-brand-grain" d="M20.8 22.1C15.9 20.6 12.5 22.4 11.4 27.1C15.8 28 19.2 26.5 20.8 22.1Z" />
        </svg>
      </span>
      <span className="app-brand-copy">
        <span className="app-brand-native">NATIVE</span>
        <span className="app-brand-matrimony">Matrimony</span>
        {showTagline && <small>Native-place profiles</small>}
      </span>
    </Link>
  )
}
