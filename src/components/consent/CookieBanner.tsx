'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  CONSENT_CHANGED_EVENT,
  OPEN_COOKIE_SETTINGS_EVENT,
  readConsent,
  saveConsent,
} from '@/lib/consent'

const acceptButton: React.CSSProperties = {
  background: '#d4a853', color: '#0C0A06', border: 'none',
  borderRadius: 999, padding: '10px 22px',
  fontSize: 13, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'inherit', letterSpacing: '0.02em',
}

const secondaryButton: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', color: 'rgba(245,245,244,0.75)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 999, padding: '10px 22px',
  fontSize: 13, fontWeight: 400, cursor: 'pointer', fontFamily: 'inherit',
}

// "Has the user decided?" as an external store. Server snapshot is true so
// SSR renders nothing; after hydration the real localStorage value applies.
function subscribeToConsent(callback: () => void): () => void {
  window.addEventListener(CONSENT_CHANGED_EVENT, callback)
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, callback)
}
const getDecided = () => readConsent() !== null
const getServerDecided = () => true

/**
 * Cookie banner + settings dialog. Shows the banner only while no decision is
 * stored. The settings view can be reopened any time via openCookieSettings()
 * (e.g. from the Datenschutz page) to change or withdraw the decision.
 */
export function CookieBanner() {
  const decided = useSyncExternalStore(subscribeToConsent, getDecided, getServerDecided)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)

  useEffect(() => {
    const onOpenSettings = () => {
      setMarketingChecked(readConsent()?.marketing === true)
      setSettingsOpen(true)
    }
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings)
  }, [])

  const mode = settingsOpen ? 'settings' : !decided ? 'banner' : 'hidden'
  if (mode === 'hidden') return null

  function decide(marketing: boolean) {
    saveConsent(marketing)
    setSettingsOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie-Einstellungen"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000,
        display: 'flex', justifyContent: 'center',
        padding: '0 16px 16px',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        pointerEvents: 'auto',
        maxWidth: 680, width: '100%',
        background: 'rgba(18,14,8,0.96)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 16,
        padding: '22px 24px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(12px)',
      }}>
        {mode === 'banner' ? (
          <>
            <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.70)', margin: '0 0 16px', lineHeight: 1.65 }}>
              Homelio verwendet technisch notwendige Cookies für den Betrieb der Plattform.
              Zusätzlich möchten wir — nur mit Ihrer Zustimmung — den Meta Pixel für
              Marketingzwecke einsetzen. Details finden Sie in der{' '}
              <a href="/datenschutz" style={{ color: '#d4a853', textDecoration: 'none' }}>Datenschutzerklärung</a>.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => decide(true)} style={acceptButton}>
                Alle akzeptieren
              </button>
              <button type="button" onClick={() => decide(false)} style={secondaryButton}>
                Nur notwendige
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{
              fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
              fontSize: 18, fontWeight: 400, color: '#f5f5f4',
              margin: '0 0 14px', lineHeight: 1.3,
            }}>
              Cookie-Einstellungen
            </h2>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <input type="checkbox" checked disabled style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.55)', lineHeight: 1.6 }}>
                <strong style={{ color: 'rgba(245,245,244,0.80)', fontWeight: 500 }}>Technisch notwendig</strong> — immer aktiv.
                Erforderlich für Anmeldung und Betrieb der Plattform.
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={marketingChecked}
                onChange={e => setMarketingChecked(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: '#d4a853', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.55)', lineHeight: 1.6 }}>
                <strong style={{ color: 'rgba(245,245,244,0.80)', fontWeight: 500 }}>Marketing (Meta Pixel)</strong> — hilft uns,
                die Reichweite von Homelio zu messen. Wird ohne Zustimmung nicht geladen.
              </span>
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => decide(marketingChecked)} style={acceptButton}>
                Auswahl speichern
              </button>
              <button type="button" onClick={() => decide(true)} style={secondaryButton}>
                Alle akzeptieren
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
