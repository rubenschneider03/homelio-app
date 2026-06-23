'use client'

import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function PremiumComingSoonModal({ isOpen, onClose }: Props) {
  const [noted, setNoted] = useState(false)

  if (!isOpen) return null

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
        {/* Gold icon */}
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
            Premium ist bald verfügbar
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.55)', margin: 0, lineHeight: 1.72 }}>
            Homelio Premium mit erweiterten Suchfiltern, höherer Matching-Priorität und frühzeitigem Zugang
            zu neuen Angeboten befindet sich in Entwicklung.
          </p>
        </div>

        {noted ? (
          <div style={{
            background: 'rgba(80,200,100,0.07)',
            border: '1px solid rgba(80,200,100,0.20)',
            borderRadius: 10, padding: '14px 18px',
            fontSize: 14, color: 'rgba(120,220,130,0.90)',
            lineHeight: 1.55,
          }}>
            ✓ Ihr Interesse wurde vorgemerkt. Wir informieren Sie, sobald Premium verfügbar ist.
          </div>
        ) : (
          <button
            onClick={() => setNoted(true)}
            style={{
              background: '#d4a853', color: '#0C0A06', border: 'none',
              borderRadius: 999, padding: '13px 24px',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.02em',
              alignSelf: 'flex-start',
            }}
          >
            Interesse vormerken
          </button>
        )}

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
