import { ReactNode } from 'react'

interface FieldGroupProps {
  title: string
  description?: string
  premium?: boolean
  children: ReactNode
}

export function FieldGroup({ title, description, premium, children }: FieldGroupProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h3 style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.20em',
            textTransform: 'uppercase',
            color: 'rgba(212,168,83,0.75)',
            margin: 0,
          }}>
            {title}
          </h3>
          {premium && (
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              background: 'rgba(212,168,83,0.12)',
              color: '#d4a853',
              border: '1px solid rgba(212,168,83,0.28)',
              borderRadius: 4,
              padding: '2px 6px',
            }}>
              Premium
            </span>
          )}
        </div>
        {description && (
          <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.40)', margin: '0 0 10px', lineHeight: 1.55 }}>
            {description}
          </p>
        )}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}
