import { ReactNode, CSSProperties } from 'react'

interface GlassCardProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export function GlassCard({ children, style, className }: GlassCardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(20,16,8,0.52)',
        border: '1px solid rgba(255,255,255,0.11)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
