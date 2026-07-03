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
        <span>n</span>
      </span>
      <span className="app-brand-copy">
        <span className="app-brand-native">NATIVE</span>
        <span className="app-brand-matrimony">Matrimony</span>
        {showTagline && <small>Independent native-place registry</small>}
      </span>
    </Link>
  )
}
