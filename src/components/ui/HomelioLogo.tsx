import Link from 'next/link'

interface HomelioLogoProps {
  height?: number
  href?: string
}

export function HomelioLogo({ height = 64, href = '/' }: HomelioLogoProps) {
  return (
    <Link href={href} style={{ display: 'inline-block', lineHeight: 0, flexShrink: 0 }}>
      <img
        src="/logo/homelio-logo-name.png"
        alt="Homelio"
        style={{ height, width: 'auto', objectFit: 'contain', display: 'block' }}
      />
    </Link>
  )
}
