'use client'

import { useState } from 'react'

interface AcceptModalProps {
  apartmentTitle: string
  onClose: () => void
  onConfirmed: () => void
}

export function AcceptModal({ apartmentTitle, onClose, onConfirmed }: AcceptModalProps) {
  const [checked, setChecked] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function handleConfirm() {
    if (!checked) return
    onConfirmed()
    setConfirmed(true)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.68)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (!confirmed && e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 18,
        padding: '40px 32px',
        maxWidth: 480,
        width: '100%',
        position: 'relative',
        boxShadow: '0 28px 72px rgba(0,0,0,0.60)',
      }}>

        {confirmed ? (
          /* ── Success state ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 999,
              background: 'rgba(80,200,100,0.12)',
              border: '1px solid rgba(80,200,100,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: 'rgba(120,220,130,0.90)',
            }}>
              ✓
            </div>
            <h2 style={{
              fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
              fontSize: 22, fontWeight: 400, color: '#f5f5f4',
              margin: 0, lineHeight: 1.3,
            }}>
              Interesse bestätigt.
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.52)', lineHeight: 1.72, margin: 0 }}>
              Homelio bereitet den nächsten Schritt vor. Sie werden benachrichtigt, sobald der Vermieter reagiert.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 8,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 999, padding: '12px 32px',
                fontSize: 14, fontWeight: 500, color: '#f5f5f4',
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em',
              }}
            >
              Schliessen
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Abbrechen"
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none',
                color: 'rgba(245,245,244,0.35)', fontSize: 16,
                cursor: 'pointer', padding: '4px 8px',
                lineHeight: 1, fontFamily: 'inherit', borderRadius: 4,
              }}
            >
              ✕
            </button>

            {/* Apartment reference */}
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.10em',
              textTransform: 'uppercase', color: 'rgba(212,168,83,0.65)',
              margin: '0 0 14px',
            }}>
              {apartmentTitle}
            </p>

            <h2 style={{
              fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
              fontSize: 21, fontWeight: 400, color: '#f5f5f4',
              margin: '0 0 16px', lineHeight: 1.3,
            }}>
              Interesse verbindlich bestätigen
            </h2>

            <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.55)', lineHeight: 1.75, margin: '0 0 24px' }}>
              Ich bestätige, dass ich ernsthaftes Interesse an dieser Wohnung habe und möchte, dass Homelio den nächsten Schritt vorbereitet. Mir ist bewusst, dass diese Bestätigung noch keinen Mietvertrag darstellt, aber als verbindliche Interessenbekundung gilt.
            </p>

            {/* Consent checkbox */}
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              cursor: 'pointer', marginBottom: 28,
              padding: '16px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${checked ? 'rgba(212,168,83,0.35)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10,
              transition: 'border-color 0.15s',
            }}>
              <input
                type="checkbox"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0, accentColor: '#d4a853', width: 17, height: 17, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.78)', lineHeight: 1.65 }}>
                Ich habe die AGB gelesen und bestätige mein ernsthaftes Interesse an dieser Wohnung.
              </span>
            </label>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleConfirm}
                disabled={!checked}
                style={{
                  background: checked ? '#d4a853' : 'rgba(212,168,83,0.25)',
                  color: checked ? '#0C0A06' : 'rgba(212,168,83,0.45)',
                  border: 'none', borderRadius: 999,
                  padding: '13px 28px', fontSize: 14, fontWeight: 500,
                  cursor: checked ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', letterSpacing: '0.02em',
                  transition: 'background 0.2s, color 0.2s',
                  width: '100%',
                }}
              >
                Interesse bestätigen
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'rgba(245,245,244,0.35)', fontSize: 13,
                  cursor: 'pointer', padding: '8px 0', fontFamily: 'inherit',
                }}
              >
                Abbrechen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
