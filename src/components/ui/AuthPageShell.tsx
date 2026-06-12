import { ReactNode } from 'react'
import { HomelioLogo } from './HomelioLogo'

interface AuthPageShellProps {
  children: ReactNode
  maxWidth?: number
}

export function AuthPageShell({ children, maxWidth = 460 }: AuthPageShellProps) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
      }}>
        <HomelioLogo height={90} href="/" />
        {children}
      </div>
    </div>
  )
}
