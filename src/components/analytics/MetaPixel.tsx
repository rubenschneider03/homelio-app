'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { CONSENT_CHANGED_EVENT, hasMarketingConsent } from '@/lib/consent'
import { META_PIXEL_ID, deleteMetaCookies, trackMetaPageView, type FbqFunction } from '@/lib/metaPixel'

// Module-level guard: the base script is injected and initialised at most once
// per page load — also across React strict-mode double effects.
let pixelInitialised = false

// Official Meta base snippet, translated to TypeScript. Defines the fbq stub
// that queues calls until fbevents.js has loaded.
function injectBaseScript(): void {
  if (window.fbq) return
  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args)
    } else {
      fbq.queue.push(args)
    }
  }) as FbqFunction
  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.push = fbq
  window.fbq = fbq
  window._fbq = fbq

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
}

function initPixel(): void {
  if (pixelInitialised || !META_PIXEL_ID) return
  pixelInitialised = true
  injectBaseScript()
  window.fbq!('consent', 'grant')
  window.fbq!('init', META_PIXEL_ID)
  window.fbq!('track', 'PageView')
}

// Consent as an external store: re-renders on every CONSENT_CHANGED_EVENT,
// false during SSR (no localStorage on the server).
function subscribeToConsent(callback: () => void): () => void {
  window.addEventListener(CONSENT_CHANGED_EVENT, callback)
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, callback)
}
const getServerSnapshot = () => false

/**
 * Loads the Meta Pixel — but only when a pixel ID is configured AND the user
 * has accepted marketing cookies. Renders nothing. Tracks PageView on
 * client-side route changes; the initial PageView comes from initPixel().
 */
export function MetaPixel() {
  const pathname = usePathname()
  const marketingAllowed = useSyncExternalStore(subscribeToConsent, hasMarketingConsent, getServerSnapshot)
  // initPixel() already fires a PageView — the pathname effect below must
  // skip its first run to avoid a duplicate.
  const initialPageViewDone = useRef(false)

  useEffect(() => {
    if (!META_PIXEL_ID) return
    try {
      if (marketingAllowed) {
        if (!pixelInitialised) {
          initPixel()
        } else if (typeof window.fbq === 'function') {
          // Consent re-granted after a withdrawal in this page session.
          window.fbq('consent', 'grant')
        }
      } else if (pixelInitialised && typeof window.fbq === 'function') {
        // Withdrawal: no further events (all helpers re-check consent),
        // pixel paused, browser cookies removed. Data already sent to Meta
        // is not retroactively deleted by this.
        window.fbq('consent', 'revoke')
        deleteMetaCookies()
      }
    } catch {
      // Never let consent handling throw into the UI.
    }
  }, [marketingAllowed])

  useEffect(() => {
    if (!marketingAllowed) return
    if (!initialPageViewDone.current) {
      initialPageViewDone.current = true
      return
    }
    trackMetaPageView()
  }, [pathname, marketingAllowed])

  return null
}
