// ── Cookie-Consent ───────────────────────────────────────────────────────────
// Single source of truth for the user's cookie decision. Stored in
// localStorage under a versioned key; components react to changes via the
// CONSENT_CHANGED_EVENT dispatched on window. Necessary cookies are always
// active — only the marketing flag is a real choice.

export interface CookieConsent {
  necessary: true
  marketing: boolean
  decidedAt: string
  version: 1
}

const STORAGE_KEY = 'homelio_cookie_consent_v1'

/** Dispatched on window whenever the stored consent changes. detail: CookieConsent */
export const CONSENT_CHANGED_EVENT = 'homelio-consent-changed'

/** Dispatched on window to ask the cookie banner to open its settings view. */
export const OPEN_COOKIE_SETTINGS_EVENT = 'homelio-open-cookie-settings'

export function readConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookieConsent
    if (
      !parsed || typeof parsed !== 'object' ||
      parsed.version !== 1 ||
      typeof parsed.marketing !== 'boolean'
    ) return null
    return parsed
  } catch {
    return null
  }
}

export function hasMarketingConsent(): boolean {
  return readConsent()?.marketing === true
}

export function saveConsent(marketing: boolean): void {
  if (typeof window === 'undefined') return
  const consent: CookieConsent = {
    necessary: true,
    marketing,
    decidedAt: new Date().toISOString(),
    version: 1,
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
  } catch {
    // localStorage unavailable (private mode / quota) — the decision then only
    // lives for this page load via the event below.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: consent }))
}

export function openCookieSettings(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT))
}
