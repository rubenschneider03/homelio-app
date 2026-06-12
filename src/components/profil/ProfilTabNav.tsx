'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Meine Wohnung', href: '/profil/meine-wohnung' },
  { label: 'Sucheinstellungen', href: '/profil/sucheinstellungen' },
  { label: 'Matches', href: '/profil/matches' },
]

export function ProfilTabNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      display: 'flex',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: 4,
      width: '100%',
    }}>
      {TABS.map(tab => {
        const active = pathname?.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px 12px',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              color: active ? '#f5f5f4' : 'rgba(245,245,244,0.40)',
              background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
