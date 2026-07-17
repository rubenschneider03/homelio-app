// ── Meta Pixel helpers ───────────────────────────────────────────────────────
// Typed wrappers around window.fbq. Every function silently does nothing
// unless ALL of the following hold: running in the browser, a pixel ID is
// configured, the pixel script is loaded, and the user has given marketing
// consent. Tracking must never throw into the UI.
//
// PRIVACY: never pass names, e-mail addresses, phone numbers, addresses,
// free-text input or Supabase user IDs as event parameters.

import { hasMarketingConsent } from './consent'

export interface FbqFunction {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[][]
  push: FbqFunction
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    fbq?: FbqFunction
    _fbq?: FbqFunction
  }
}

// Statically referenced so Next.js inlines the value into the client bundle.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''

/** True only when tracking is allowed and technically possible right now. */
function canTrack(): boolean {
  return (
    typeof window !== 'undefined' &&
    META_PIXEL_ID !== '' &&
    typeof window.fbq === 'function' &&
    hasMarketingConsent()
  )
}

/** Standard Meta event (PageView, CompleteRegistration, …). */
export function trackMetaEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
): void {
  if (!canTrack()) return
  try {
    window.fbq!('track', eventName, parameters)
  } catch {
    // Tracking failures must never surface in the UI.
  }
}

/** Custom (non-standard) Meta event. */
export function trackMetaCustomEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean>
): void {
  if (!canTrack()) return
  try {
    window.fbq!('trackCustom', eventName, parameters)
  } catch {
    // Tracking failures must never surface in the UI.
  }
}

export function trackMetaPageView(): void {
  trackMetaEvent('PageView')
}

/** Fired once per user after the Homelio onboarding completed successfully. */
export function trackCompleteRegistration(): void {
  trackMetaEvent('CompleteRegistration')
}

/** Fired once per user when the profile first becomes complete for matching. */
export function trackProfileCompleted(): void {
  trackMetaCustomEvent('ProfileCompleted', { profile_type: 'tenant_matching' })
}

/**
 * Best-effort removal of Meta browser cookies for this domain after consent
 * withdrawal. Data already transmitted to Meta is NOT retroactively deleted
 * by this — it only stops the browser-side identifiers.
 */
export function deleteMetaCookies(): void {
  if (typeof document === 'undefined') return
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  const baseDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname
  const domains = ['', hostname, `.${hostname}`, baseDomain, `.${baseDomain}`]
  for (const name of ['_fbp', '_fbc']) {
    for (const domain of new Set(domains)) {
      document.cookie =
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` +
        (domain ? `; domain=${domain}` : '')
    }
  }
}
