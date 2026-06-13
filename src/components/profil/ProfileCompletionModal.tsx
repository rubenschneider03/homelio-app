'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const DISMISSED_KEY = 'homelio_profile_modal_dismissed'

export function ProfileCompletionModal() {
  const [visible, setVisible] = useState(false)
  const [missing, setMissing] = useState<string[]>([])
  const [ctaHref, setCtaHref] = useState('/profil/meine-wohnung')
  const [ctaLabel, setCtaLabel] = useState('Profil vervollständigen')

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISSED_KEY) === '1'
    if (dismissed) return
    checkMatchability()
  }, [])

  async function checkMatchability() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [aptResult, prefsResult] = await Promise.all([
      supabase.from('apartments').select('city, rooms, rent_gross, status').eq('user_id', user.id).single(),
      supabase.from('search_preferences').select('city_region, max_rent_gross').eq('user_id', user.id).single(),
    ])

    const apt = aptResult.data
    const aptExists = !!apt
    const citySet = aptExists && !!apt.city
    const roomsSet = aptExists && apt.rooms != null
    const rentSet = aptExists && apt.rent_gross != null
    const statusActive = aptExists && apt.status === 'active'

    const prefs = prefsResult.data
    const prefsExists = !!prefs
    const prefsCriterionSet = prefsExists && prefs.city_region != null && prefs.max_rent_gross != null

    const isComplete = citySet && roomsSet && rentSet && statusActive && prefsCriterionSet
    if (isComplete) return

    const items: string[] = []
    if (!aptExists) {
      items.push('Wohnung noch nicht erfasst')
    } else {
      if (!citySet) items.push('Ort der Wohnung fehlt')
      if (!roomsSet) items.push('Zimmerzahl fehlt')
      if (!rentSet) items.push('Bruttomiete fehlt')
      if (!statusActive) items.push('Wohnung ist noch nicht für Matching aktiv')
    }
    if (!prefsExists) {
      items.push('Sucheinstellungen fehlen')
    } else if (!prefsCriterionSet) {
      items.push('Ort/Region oder maximale Miete fehlt')
    }

    setMissing(items)

    const hasAptIssue = !aptExists || !citySet || !roomsSet || !rentSet || !statusActive
    if (hasAptIssue) {
      setCtaHref('/profil/meine-wohnung')
      setCtaLabel('Wohnung vervollständigen')
    } else {
      setCtaHref('/profil/sucheinstellungen')
      setCtaLabel('Sucheinstellungen ergänzen')
    }

    setVisible(true)
  }

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
        <button onClick={dismiss} aria-label="Schließen" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(245,245,244,0.35)', fontSize: 16, cursor: 'pointer', padding: '4px 8px', lineHeight: 1, fontFamily: 'inherit', borderRadius: 4 }}>✕</button>
        <div style={{ width: 48, height: 48, borderRadius: 999, background: 'rgba(212,168,83,0.10)', border: '1px solid rgba(212,168,83,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 20, color: '#d4a853' }}>◎</div>
        <h2 style={{ fontFamily: 'var(--font-instrument-serif, Georgia, serif)', fontSize: 22, fontWeight: 400, color: '#f5f5f4', margin: '0 0 10px', lineHeight: 1.3 }}>
          Profil vervollständigen
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.50)', lineHeight: 1.72, margin: '0 0 16px' }}>
          Für präzise Matchvorschläge sind noch folgende Angaben erforderlich:
        </p>
        {missing.length > 0 && (
          <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {missing.map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: 'rgba(212,168,83,0.80)', fontSize: 12, flexShrink: 0, marginTop: 2 }}>○</span>
                <span style={{ fontSize: 14, color: 'rgba(245,245,244,0.62)', lineHeight: 1.55 }}>{item}</span>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href={ctaHref} onClick={dismiss} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, background: '#d4a853', color: '#0C0A06', padding: '13px 28px', fontSize: 14, fontWeight: 500, textDecoration: 'none', letterSpacing: '0.02em' }}>
            {ctaLabel}
          </Link>
          <button onClick={dismiss} style={{ background: 'transparent', border: 'none', color: 'rgba(245,245,244,0.32)', fontSize: 13, cursor: 'pointer', padding: '8px 0', fontFamily: 'inherit' }}>
            Später erledigen
          </button>
        </div>
      </div>
    </div>
  )
}
