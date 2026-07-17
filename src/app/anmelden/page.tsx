import type { Metadata } from 'next'
import { AuthPageShell } from '@/components/ui/AuthPageShell'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata: Metadata = {
  title: 'Anmelden – Homelio',
}

export default function AnmeldenPage() {
  return (
    <AuthPageShell>
      <AuthForm />

      {/* Confidentiality reassurance — the main conversion objection at sign-up */}
      <div style={{
        width: '100%',
        background: 'rgba(18,14,8,0.55)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '18px 20px',
      }}>
        <p style={{
          fontSize: 13, fontWeight: 500, color: 'rgba(245,245,244,0.85)',
          margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden>
            <path d="M1.8 8c1.3-2.3 3.5-3.8 6.2-3.8 1 0 1.9.2 2.7.6M14.2 8c-1.3 2.3-3.5 3.8-6.2 3.8-1 0-1.9-.2-2.7-.6"
              stroke="#d4a853" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="8" cy="8" r="1.9" stroke="#d4a853" strokeWidth="1.1" />
            <path d="M3 13.2L13 2.8" stroke="#d4a853" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          Erfährt meine aktuelle Verwaltung davon?
        </p>
        <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.55)', lineHeight: 1.7, margin: 0 }}>
          Nein. Ihre aktuelle Verwaltung oder Ihr Vermieter wird nicht über Ihre Wechselabsicht
          informiert. Eine Kontaktaufnahme erfolgt nur mit Ihrer ausdrücklichen Zustimmung.
          Ihre Wohnung wird durch die Registrierung bei Homelio nicht automatisch gekündigt.
        </p>
      </div>
    </AuthPageShell>
  )
}
