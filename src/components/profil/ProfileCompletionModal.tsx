'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const DISMISSED_KEY = 'homelio_profile_modal_dismissed'

export function ProfileCompletionModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISSED_KEY) === '1'
    if (!dismissed) setVisible(true)
  }, [])

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.60)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.11)',
        borderRadius: 18,
        padding: '40px 32px',
        maxWidth: 440,
        width: '100%',
        position: 'relative',
        boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
      }}>
        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Schließen"
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none',
            color: 'rgba(245,245,244,0.35)', fontSize: 16,
            cursor: 'pointer', padding: '4px 8px',
            lineHeight: 1, fontFamily: 'inherit',
            borderRadius: 4,
          }}
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 999,
          background: 'rgba(212,168,83,0.10)',
          border: '1px solid rgba(212,168,83,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, fontSize: 20, color: '#d4a853',
        }}>
          ◎
        </div>

        <h2 style={{
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          fontSize: 22, fontWeight: 400, color: '#f5f5f4',
          margin: '0 0 10px', lineHeight: 1.3,
        }}>
          Profil vervollständigen
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.50)', lineHeight: 1.72, margin: '0 0 28px' }}>
          Vervollständigen Sie Ihr Profil, um genauere Wohnungsangebote zu erhalten.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href="/profil/meine-wohnung"
            onClick={dismiss}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 999, background: '#d4a853', color: '#0C0A06',
              padding: '13px 28px', fontSize: 14, fontWeight: 500,
              textDecoration: 'none', letterSpacing: '0.02em',
            }}
          >
            Profil vervollständigen
          </Link>
          <button
            onClick={dismiss}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(245,245,244,0.32)', fontSize: 13,
              cursor: 'pointer', padding: '8px 0', fontFamily: 'inherit',
            }}
          >
            Später erledigen
          </button>
        </div>
      </div>
    </div>
  )
}
