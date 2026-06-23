'use client'

import { useSearchParams } from 'next/navigation'

export function PremiumPaymentBanner() {
  const params = useSearchParams()
  const status = params.get('premium')

  if (!status) return null

  if (status === 'success') {
    return (
      <div style={{
        background: 'rgba(80,200,100,0.07)',
        border: '1px solid rgba(80,200,100,0.22)',
        borderRadius: 12, padding: '16px 20px',
        fontSize: 14, color: 'rgba(120,220,130,0.90)',
        lineHeight: 1.6, marginBottom: 24,
      }}>
        ✓ Zahlung erfolgreich. Premium wird aktiviert, sobald die Zahlungsbestätigung verarbeitet wurde.
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 12, padding: '16px 20px',
        fontSize: 14, color: 'rgba(245,245,244,0.55)',
        lineHeight: 1.6, marginBottom: 24,
      }}>
        Zahlung abgebrochen. Sie können Premium jederzeit erneut freischalten.
      </div>
    )
  }

  return null
}
