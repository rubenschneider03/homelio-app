import { GlassCard } from '@/components/ui/GlassCard'

interface EmailConfirmScreenProps {
  email: string
  onResend: () => void
}

export function EmailConfirmScreen({ email, onResend }: EmailConfirmScreenProps) {
  return (
    <GlassCard style={{ width: '100%', padding: '44px 32px', textAlign: 'center' }}>
      {/* Icon */}
      <div style={{
        width: 56, height: 56, borderRadius: 999,
        background: 'rgba(212,168,83,0.10)',
        border: '1px solid rgba(212,168,83,0.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: 22,
        color: '#d4a853',
      }}>
        ✉
      </div>

      <h2 style={{
        fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
        fontSize: 22,
        fontWeight: 400,
        color: '#f5f5f4',
        margin: '0 0 12px',
        lineHeight: 1.3,
      }}>
        Bitte bestätigen Sie Ihre E-Mail
      </h2>

      <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.50)', lineHeight: 1.75, margin: '0 0 8px' }}>
        Wir haben eine Bestätigungs-E-Mail an
      </p>
      <p style={{ fontSize: 14, color: '#d4a853', fontWeight: 500, margin: '0 0 20px', wordBreak: 'break-all' }}>
        {email}
      </p>
      <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.50)', lineHeight: 1.75, margin: '0 0 32px' }}>
        gesendet. Klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{
          fontSize: 13, color: 'rgba(245,245,244,0.40)',
          margin: 0, lineHeight: 1.6,
        }}>
          Nach der Bestätigung werden Sie automatisch weitergeleitet.
        </p>
        <button
          onClick={onResend}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(245,245,244,0.38)', fontSize: 13,
            cursor: 'pointer', padding: '8px 0',
            fontFamily: 'inherit',
          }}
        >
          E-Mail erneut senden
        </button>
      </div>
    </GlassCard>
  )
}
