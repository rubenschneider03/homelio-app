import type { Metadata } from 'next'
import { ReactNode } from 'react'
import Link from 'next/link'
import { HomelioLogo } from '@/components/ui/HomelioLogo'
import { ProfilTabNav } from '@/components/profil/ProfilTabNav'
import { ProfileCompletionModal } from '@/components/profil/ProfileCompletionModal'

export const metadata: Metadata = {
  title: 'Profil – Homelio',
}

export default function ProfilLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'clamp(28px, 5vw, 52px) 20px clamp(60px, 8vw, 100px)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 800,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}>

        {/* Top bar: logo + logout */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <HomelioLogo height={84} href="/" />
          <Link
            href="/"
            style={{
              position: 'absolute', right: 0,
              fontSize: 12, color: 'rgba(245,245,244,0.35)',
              textDecoration: 'none', letterSpacing: '0.04em',
              padding: '6px 0',
            }}
          >
            Abmelden
          </Link>
        </div>

        {/* Tab nav */}
        <ProfilTabNav />

        {/* Content */}
        <div style={{ width: '100%' }}>
          {children}
        </div>

      </div>

      {/* Profile completion modal overlay */}
      <ProfileCompletionModal />
    </div>
  )
}
