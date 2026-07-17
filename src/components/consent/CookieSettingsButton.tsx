'use client'

import { openCookieSettings } from '@/lib/consent'

/** Opens the cookie settings dialog — used on the Datenschutz page to change or withdraw consent. */
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      style={{
        background: 'rgba(255,255,255,0.06)',
        color: 'rgba(245,245,244,0.75)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 999, padding: '9px 20px',
        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      Cookie-Einstellungen öffnen
    </button>
  )
}
