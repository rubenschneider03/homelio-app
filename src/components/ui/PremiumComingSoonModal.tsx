'use client'

import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function PremiumComingSoonModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  if (!isOpen) return null

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/checkout/premium', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(
          data.error === 'setup_incomplete'
            ? 'Premium-Zahlung ist noch nicht fertig eingerichtet.'
            : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
        )
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(5,4,2,0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#141414',
          border: '1px solid rgba(212,168,83,0.30)',
          borderRadius: 18,
          padding: 'clamp(28px, 5vw, 44px)',
          maxWidth: 440, width: '100%',
          display: 'flex', flexDirection: 'column', gap: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.48)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 999,
          background: 'rgba(212,168,83,0.10)',
          border: '1px solid rgba(212,168,83,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          ✦
        </div>

        <div>
          <h2 style={{
            fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
            fontSize: 22, fontWeight: 400, color: '#f5f5f4',
            margin: '0 0 10px', lineHeight: 1.2,
          }}>
            Homelio Premium
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.55)', margin: 0, lineHeight: 1.72 }}>
            Erweiterte Suchfilter, höhere Matching-Priorität und frühzeitiger Zugang
            zu neuen Angeboten — CHF 9.95 / Monat, jederzeit kündbar.
          </p>
        </div>

        {error ? (
          <div style={{
            background: 'rgba(220,80,80,0.07)',
            border: '1px solid rgba(220,80,80,0.20)',
            borderRadius: 10, padding: '14px 18px',
            fontSize: 13, color: 'rgba(245,245,244,0.60)',
            lineHeight: 1.55,
          }}>
            {error}
          </div>
        ) : (
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              background: loading ? 'rgba(212,168,83,0.45)' : '#d4a853',
              color: '#0C0A06', border: 'none',
              borderRadius: 999, padding: '13px 24px',
              fontSize: 14, fontWeight: 500,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.02em',
              alignSelf: 'flex-start',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Wird verarbeitet…' : 'Premium für CHF 9.95 / Monat freischalten'}
          </button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.30)', margin: 0, lineHeight: 1.6 }}>
            CHF 9.95 / Monat. Monatlich kündbar, keine versteckten Kosten.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.28)', margin: 0, lineHeight: 1.6 }}>
            Premium wird aktiviert, sobald die Zahlungsbestätigung eingegangen ist.
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none',
            fontSize: 13, color: 'rgba(245,245,244,0.35)',
            cursor: 'pointer', fontFamily: 'inherit',
            padding: '4px 0', alignSelf: 'flex-start',
            textDecoration: 'underline', textUnderlineOffset: '3px',
          }}
        >
          Schliessen
        </button>
      </div>
    </div>
  )
}
