'use client'

import { useState } from 'react'

interface Props {
  isPremium: boolean
  hasStripeCustomer: boolean
}

export function PremiumStatusCard({ isPremium, hasStripeCustomer }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isPremium && !hasStripeCustomer) return null

  async function handleManage() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/stripe/customer-portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
        setLoading(false)
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es später erneut.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: isPremium
        ? 'linear-gradient(135deg, rgba(80,200,100,0.08) 0%, rgba(212,168,83,0.06) 100%)'
        : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isPremium ? 'rgba(80,200,100,0.25)' : 'rgba(255,255,255,0.10)'}`,
      borderRadius: 14,
      padding: '24px 24px',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <h3 style={{
            fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
            fontSize: 20, fontWeight: 400, color: '#f5f5f4', margin: 0,
          }}>
            {isPremium ? 'Premium aktiv' : 'Premium nicht aktiv'}
          </h3>
          {isPremium && (
            <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.50)', letterSpacing: '0.02em' }}>
              CHF 9.95 / Monat
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.50)', margin: 0, lineHeight: 1.6 }}>
          Sie können Ihr Abo jederzeit über Stripe verwalten oder kündigen.
        </p>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: 'rgba(220,80,80,0.85)', margin: 0, lineHeight: 1.5 }}>{error}</p>
      )}

      <button
        type="button"
        onClick={handleManage}
        disabled={loading}
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 999, padding: '12px 26px',
          fontSize: 14, fontWeight: 500, color: '#f5f5f4',
          cursor: loading ? 'default' : 'pointer',
          fontFamily: 'inherit', letterSpacing: '0.02em',
          alignSelf: 'flex-start',
        }}
      >
        {loading ? 'Wird geöffnet…' : 'Abo verwalten'}
      </button>
    </div>
  )
}
