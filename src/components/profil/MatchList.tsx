'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MatchCard, type MatchApartment } from './MatchCard'
import { AcceptModal } from './AcceptModal'
import { createClient } from '@/lib/supabase/client'

// ── RPC row shape returned by get_my_match_cards() ────────────────────────────

interface MatchCardRow {
  match_id: string
  my_side: 'a' | 'b'
  my_status: 'pending' | 'interested' | 'declined'
  other_status: 'pending' | 'interested' | 'declined'
  is_mutual: boolean
  score: number | null
  rooms: number | null
  area_sqm: number | null
  floor: number | null
  rent_gross: number | null
  rent_net: number | null
  additional_costs: number | null
  estimated_rent_net: number | null
  estimated_additional_costs: number | null
  estimated_rent_gross: number | null
  city: string | null
  zip: string | null
  district: string | null
  location_label: string | null
  approximate_location_text: string | null
  nearest_stop: string | null
  transport_minutes_center: number | null
  earliest_move_out: string | null
  move_out_flexibility: string | null
  has_balcony: boolean
  has_terrace: boolean
  has_garden: boolean
  has_cellar: boolean
  is_wheelchair_accessible: boolean
  has_elevator: string | null
  parking_type: string | null
  laundry: string | null
  noise_level: string | null
  orientation: string | null
  highlights: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMoveOut(dateStr: string | null): string {
  if (!dateStr) return 'Auf Anfrage'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function toMatchApartment(row: MatchCardRow): MatchApartment {
  const features: string[] = []
  if (row.has_balcony) features.push('Balkon')
  if (row.has_terrace) features.push('Terrasse')
  if (row.has_garden) features.push('Garten')
  if (row.has_cellar) features.push('Keller')
  if (row.is_wheelchair_accessible) features.push('Rollstuhlgängig')
  if (row.has_elevator === 'yes') features.push('Lift')
  if (row.parking_type && row.parking_type !== 'none') features.push('Parkplatz')
  if (row.laundry === 'private') features.push('Eigene Waschmaschine')

  return {
    id: row.match_id,
    title: `${row.rooms ?? '?'} Zi-Wohnung in ${row.district ?? row.city ?? 'Unbekannt'}`,
    location: row.district ?? row.city ?? row.zip ?? '',
    managementCompany: 'Verwaltung nicht öffentlich',
    available: formatMoveOut(row.earliest_move_out),
    rooms: row.rooms ?? 0,
    area: row.area_sqm ?? 0,
    floor: row.floor ?? 0,
    rentGross: row.rent_gross ?? 0,
    rentNet: row.rent_net ?? 0,
    additionalCosts: row.additional_costs ?? 0,
    estimatedRentNet: row.estimated_rent_net ?? undefined,
    estimatedAdditionalCosts: row.estimated_additional_costs ?? undefined,
    estimatedRentGross: row.estimated_rent_gross ?? undefined,
    matchScore: row.score ?? 0,
    features,
    transport: row.nearest_stop ?? '',
    description: row.approximate_location_text ?? row.location_label ?? row.highlights ?? '',
    matchReasons: [
      'Lage passt zu Ihren Suchkriterien',
      'Miete liegt im gewünschten Rahmen',
      'Wohnungsdaten passen zu Ihrem Profil',
    ],
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SubTab = 'empfehlungen' | 'gegenseite' | 'warten' | 'beidseitig'

// ── Sub-tab bar ───────────────────────────────────────────────────────────────

function SubTabBar({
  active,
  onChange,
  counts,
}: {
  active: SubTab
  onChange: (t: SubTab) => void
  counts: { empfehlungen: number; gegenseite: number; warten: number; beidseitig: number }
}) {
  const tabs: { id: SubTab; label: string; count: number }[] = [
    { id: 'empfehlungen', label: 'Homelio Empfehlungen', count: counts.empfehlungen },
    { id: 'gegenseite',   label: 'Von Gegenseite angenommen', count: counts.gegenseite },
    { id: 'warten',       label: 'Wartet auf Gegenseite', count: counts.warten },
    { id: 'beidseitig',   label: 'Beidseitige Matches', count: counts.beidseitig },
  ]

  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      gap: 0,
      overflowX: 'auto',
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              background: 'none', border: 'none',
              padding: '13px 16px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? '#f5f5f4' : 'rgba(245,245,244,0.38)',
              borderBottom: isActive ? '2px solid #d4a853' : '2px solid transparent',
              marginBottom: -1,
              display: 'flex', alignItems: 'center', gap: 7,
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: isActive ? 'rgba(212,168,83,0.18)' : 'rgba(255,255,255,0.07)',
              color: isActive ? '#d4a853' : 'rgba(245,245,244,0.35)',
              borderRadius: 999, padding: '2px 7px',
              transition: 'background 0.15s, color 0.15s',
            }}>
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Notification toggle ───────────────────────────────────────────────────────

function NotificationToggle({
  label,
  checked,
  onChange,
  locked = false,
  lockedNote,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  locked?: boolean
  lockedNote?: string
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '13px 16px',
      display: 'flex', flexDirection: 'column', gap: 7,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{
          fontSize: 13,
          color: locked ? 'rgba(245,245,244,0.28)' : 'rgba(245,245,244,0.68)',
          lineHeight: 1.4,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {locked ? '🔔' : (checked ? '🔔' : '🔕')}
          {label}
        </span>

        {/* Pill toggle */}
        <div
          onClick={() => !locked && onChange(!checked)}
          role="switch"
          aria-checked={!locked && checked}
          style={{
            position: 'relative',
            width: 44, height: 24,
            borderRadius: 999,
            background: (!locked && checked) ? 'rgba(212,168,83,0.45)' : 'rgba(255,255,255,0.12)',
            cursor: locked ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            opacity: locked ? 0.40 : 1,
            transition: 'background 0.2s, opacity 0.2s',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 3,
            left: (!locked && checked) ? 23 : 3,
            width: 18, height: 18,
            borderRadius: 999,
            background: (!locked && checked) ? '#d4a853' : 'rgba(255,255,255,0.65)',
            transition: 'left 0.2s, background 0.2s',
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {locked && lockedNote && (
        <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.32)', margin: 0, lineHeight: 1.55 }}>
          {lockedNote}
        </p>
      )}
    </div>
  )
}

// ── Premium gate ──────────────────────────────────────────────────────────────

function PremiumGate({ count }: { count: number }) {
  return (
    <div style={{
      background: 'rgba(18,14,8,0.55)',
      border: '1px solid rgba(212,168,83,0.22)',
      borderRadius: 14,
      padding: '36px 28px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 999,
        background: 'rgba(212,168,83,0.10)',
        border: '1px solid rgba(212,168,83,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        🔒
      </div>
      <p style={{
        fontSize: 16, fontWeight: 500, color: '#f5f5f4',
        margin: 0, lineHeight: 1.4,
        fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
      }}>
        {count} {count === 1 ? 'Wohnung wurde' : 'Wohnungen wurden'} bereits von der Gegenseite angenommen.
      </p>
      <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.48)', margin: 0, lineHeight: 1.7, maxWidth: 400 }}>
        Mit Homelio Premium sehen Sie Wohnungen, bei denen die Gegenseite bereits Interesse signalisiert hat.
      </p>
      <button style={{
        background: '#d4a853', color: '#0C0A06', border: 'none',
        borderRadius: 999, padding: '13px 28px',
        fontSize: 14, fontWeight: 500, cursor: 'pointer',
        fontFamily: 'inherit', letterSpacing: '0.02em',
        marginTop: 4,
      }}>
        Premium aktivieren — CHF 9.95 / Monat
      </button>
      <p style={{ fontSize: 11, color: 'rgba(245,245,244,0.25)', margin: 0 }}>
        Keine versteckten Kosten. Jederzeit kündbar.
      </p>
    </div>
  )
}

// ── Card list helper ──────────────────────────────────────────────────────────

interface CardListProps {
  apartments: MatchApartment[]
  onAccept?: (id: string, title: string) => void
  onDecline?: (id: string) => void
  variant?: 'mutual' | 'waiting'
  emptyMessage?: string
}

function CardList({ apartments, onAccept, onDecline, variant, emptyMessage }: CardListProps) {
  if (apartments.length === 0) {
    return (
      <div style={{
        background: 'rgba(18,14,8,0.55)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '56px 28px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 15, color: 'rgba(245,245,244,0.40)', margin: '0 0 8px' }}>
          {emptyMessage ?? 'Keine weiteren Matches'}
        </p>
        <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.25)', margin: 0 }}>
          Homelio sucht weiter und benachrichtigt Sie bei neuen Treffern.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {apartments.map(apt => (
        <MatchCard
          key={apt.id}
          apartment={apt}
          accepted={false}
          onAccept={() => onAccept?.(apt.id, apt.title)}
          onDecline={() => onDecline?.(apt.id)}
          variant={variant}
        />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MatchList() {
  const router = useRouter()

  // ── Data state ──
  const [matches, setMatches] = useState<MatchCardRow[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<SubTab>('empfehlungen')
  const [notifyRec, setNotifyRec] = useState(true)
  const [notifyGegenseite, setNotifyGegenseite] = useState(true)
  const [notifyBeidseitig, setNotifyBeidseitig] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [acceptingAptTitle, setAcceptingAptTitle] = useState<string | null>(null)
  const [aptMatchable, setAptMatchable] = useState(false)
  const [prefsReady, setPrefsReady] = useState(false)

  // ── Photo state ──
  // Keyed by match_id. undefined = not fetched yet; [] = fetched, no photos; [...] = photos.
  const [matchPhotos, setMatchPhotos] = useState<Record<string, string[]>>({})
  // Tracks which match IDs have been dispatched for fetching (avoids duplicate requests).
  const fetchedIds = useRef(new Set<string>())

  // ── Data fetching ─────────────────────────────────────────────────────────────

  async function loadMatches() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/anmelden')
      return
    }

    const [profileResult, matchResult, aptResult, prefsResult] = await Promise.all([
      supabase.from('profiles').select('is_premium').eq('id', user.id).single(),
      supabase.rpc('get_my_match_cards'),
      supabase.from('apartments').select('city, rooms, rent_gross, status').eq('user_id', user.id).single(),
      supabase.from('search_preferences').select('city_region, max_rent_gross').eq('user_id', user.id).single(),
    ])

    setIsPremium(profileResult.data?.is_premium ?? false)

    const apt = aptResult.data
    setAptMatchable(!!apt && !!apt.city && apt.rooms != null && apt.rent_gross != null && apt.status === 'active')

    const prefs = prefsResult.data
    setPrefsReady(!!prefs && prefs.city_region != null && prefs.max_rent_gross != null)

    if (matchResult.error) {
      setLoadError('Beim Laden der Matches ist ein Fehler aufgetreten.')
      setLoadingData(false)
      return
    }

    setMatches((matchResult.data as MatchCardRow[]) ?? [])
    setLoadingData(false)
  }

  // Lightweight refresh after actions — does not touch loadingData or loadError.
  async function refreshMatches() {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_my_match_cards')
    if (!error && data) {
      setMatches(data as MatchCardRow[])
    }
  }

  useEffect(() => {
    loadMatches()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch photos lazily for the currently visible tab.
  // Only dispatches requests for match IDs not yet in-flight (tracked by fetchedIds ref).
  // On error or non-OK response, stores [] so the card shows "no photos" rather than
  // staying on the loading placeholder indefinitely.
  useEffect(() => {
    if (loadingData || !matches.length) return

    // Mirror the same mutually-exclusive filter logic used in tab categorisation below.
    let visibleIds: string[]
    switch (activeTab) {
      case 'empfehlungen':
        visibleIds = matches
          .filter(m => m.my_status === 'pending' && m.other_status === 'pending' && !m.is_mutual)
          .map(m => m.match_id)
        break
      case 'gegenseite':
        visibleIds = matches
          .filter(m => m.other_status === 'interested' && m.my_status === 'pending' && !m.is_mutual)
          .map(m => m.match_id)
        break
      case 'warten':
        visibleIds = matches
          .filter(m => m.my_status === 'interested' && m.other_status === 'pending' && !m.is_mutual)
          .map(m => m.match_id)
        break
      case 'beidseitig':
        visibleIds = matches.filter(m => m.is_mutual).map(m => m.match_id)
        break
      default:
        return
    }

    const toFetch = visibleIds.filter(id => !fetchedIds.current.has(id))
    if (!toFetch.length) return

    // Mark all as in-flight before any async work to prevent duplicate dispatches.
    toFetch.forEach(id => fetchedIds.current.add(id))

    Promise.all(
      toFetch.map(async id => {
        try {
          const res = await fetch(`/api/matches/${id}/photos`)
          if (!res.ok) return [id, [] as string[]] as const
          const json = await res.json() as { urls: string[] }
          return [id, json.urls] as const
        } catch {
          return [id, [] as string[]] as const
        }
      })
    ).then(results => {
      setMatchPhotos(prev => ({ ...prev, ...Object.fromEntries(results) }))
    })
  }, [activeTab, matches, loadingData]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab categorisation (mutually exclusive) ───────────────────────────────────

  const empfehlungen = matches.filter(m => m.my_status === 'pending'    && m.other_status === 'pending'    && !m.is_mutual)
  const gegenseite   = matches.filter(m => m.other_status === 'interested' && m.my_status === 'pending'    && !m.is_mutual)
  const warten       = matches.filter(m => m.my_status === 'interested'  && m.other_status === 'pending'   && !m.is_mutual)
  const beidseitig   = matches.filter(m => m.is_mutual)

  // photoUrls injected from matchPhotos state:
  //   undefined  → fetch not yet complete (MatchCard shows loading placeholder)
  //   []         → fetch complete, other user has no photos
  //   [...]      → fetch complete, photos available
  const empfehlungenApts = empfehlungen.map(m => ({ ...toMatchApartment(m), photoUrls: matchPhotos[m.match_id] }))
  const gegenseiteApts   = gegenseite.map(m => ({ ...toMatchApartment(m), photoUrls: matchPhotos[m.match_id] }))
  const wartenApts       = warten.map(m => ({ ...toMatchApartment(m), photoUrls: matchPhotos[m.match_id] }))
  const beidseitigApts   = beidseitig.map(m => ({ ...toMatchApartment(m), photoUrls: matchPhotos[m.match_id] }))

  // ── Actions ───────────────────────────────────────────────────────────────────

  function openModal(id: string, title: string) {
    setAcceptingId(id)
    setAcceptingAptTitle(title)
    setActionError('')
  }

  async function handleConfirmed() {
    if (!acceptingId || actionLoading) return
    const id = acceptingId
    setActionLoading(true)
    setActionError('')

    const supabase = createClient()
    const { error } = await supabase.rpc('express_interest', {
      p_match_id: id,
      p_decision: 'interested',
    })

    setActionLoading(false)

    if (error) {
      setActionError('Beim Aktualisieren des Matches ist ein Fehler aufgetreten.')
      setAcceptingId(null)
      setAcceptingAptTitle(null)
      return
    }

    // Reload matches while AcceptModal shows its success state.
    // Modal stays visible until the user clicks "Schliessen" → onClose fires.
    await refreshMatches()
  }

  async function handleDecline(matchId: string) {
    if (actionLoading) return
    setActionError('')
    setActionLoading(true)

    const supabase = createClient()
    const { error } = await supabase.rpc('express_interest', {
      p_match_id: matchId,
      p_decision: 'declined',
    })

    setActionLoading(false)

    if (error) {
      setActionError('Beim Aktualisieren des Matches ist ein Fehler aufgetreten.')
    } else {
      await refreshMatches()
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (loadingData) {
    return (
      <div style={{
        background: 'rgba(18,14,8,0.55)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '72px 28px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.40)', margin: 0 }}>
          Matches werden geladen…
        </p>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div style={{
        background: 'rgba(18,14,8,0.55)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '72px 28px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, color: 'rgba(220,80,80,0.80)', margin: 0 }}>
          {loadError}
        </p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header + sub-tab bar */}
      <div style={{
        background: 'rgba(18,14,8,0.55)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
      }}>
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{
              fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
              fontSize: 22, fontWeight: 400, color: '#f5f5f4',
              margin: 0, lineHeight: 1.2,
            }}>
              Ihre Matches
            </h2>
          </div>
        </div>
        <div style={{ paddingLeft: 12, paddingRight: 12 }}>
          <SubTabBar
            active={activeTab}
            onChange={setActiveTab}
            counts={{
              empfehlungen: empfehlungenApts.length,
              gegenseite:   gegenseiteApts.length,
              warten:       wartenApts.length,
              beidseitig:   beidseitigApts.length,
            }}
          />
        </div>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div style={{
          background: 'rgba(220,80,80,0.10)',
          border: '1px solid rgba(220,80,80,0.25)',
          borderRadius: 10, padding: '12px 16px',
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, color: 'rgba(220,80,80,0.90)', margin: 0, lineHeight: 1.5 }}>
            {actionError}
          </p>
        </div>
      )}

      {/* Tab content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Homelio Empfehlungen ── */}
        {activeTab === 'empfehlungen' && (
          <>
            <NotificationToggle
              label="Benachrichtigung für neue Homelio Empfehlungen"
              checked={notifyRec}
              onChange={setNotifyRec}
            />
            <p style={{
              fontSize: 14, color: 'rgba(245,245,244,0.45)', lineHeight: 1.72,
              margin: 0, padding: '0 4px',
            }}>
              Diese Vorschläge entstehen automatisch aus den gegenseitigen Wohnungs- und Sucheinstellungen. Homelio priorisiert Wohnungen, bei denen beide Seiten besonders gut zueinander passen.
            </p>
            {empfehlungenApts.length === 0 && (!aptMatchable || !prefsReady) ? (
              <div style={{
                background: 'rgba(18,14,8,0.55)',
                border: '1px solid rgba(212,168,83,0.14)',
                borderRadius: 16, padding: '48px 28px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 999,
                  background: 'rgba(212,168,83,0.10)',
                  border: '1px solid rgba(212,168,83,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#d4a853',
                }}>◎</div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 500, color: '#f5f5f4', margin: '0 0 8px', fontFamily: 'var(--font-instrument-serif, Georgia, serif)' }}>
                    Profil noch nicht bereit für Matching
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.40)', margin: 0, lineHeight: 1.7 }}>
                    {!aptMatchable
                      ? 'Vervollständigen Sie Ihre Wohnungsangaben, damit Homelio passende Matches suchen kann.'
                      : 'Ergänzen Sie Ihre Sucheinstellungen, damit Homelio passende Matches suchen kann.'}
                  </p>
                </div>
                <Link
                  href={!aptMatchable ? '/profil/meine-wohnung' : '/profil/sucheinstellungen'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 999, background: '#d4a853', color: '#0C0A06',
                    padding: '11px 24px', fontSize: 13, fontWeight: 500,
                    textDecoration: 'none', letterSpacing: '0.02em',
                  }}
                >
                  {!aptMatchable ? 'Wohnung vervollständigen' : 'Sucheinstellungen ergänzen'}
                </Link>
              </div>
            ) : (
              <CardList
                apartments={empfehlungenApts}
                onAccept={openModal}
                onDecline={handleDecline}
                emptyMessage="Noch keine passenden Empfehlungen gefunden."
              />
            )}
          </>
        )}

        {/* ── Von Gegenseite angenommen ── */}
        {activeTab === 'gegenseite' && (
          <>
            {isPremium ? (
              <NotificationToggle
                label="Benachrichtigung, wenn die Gegenseite Interesse signalisiert"
                checked={notifyGegenseite}
                onChange={setNotifyGegenseite}
              />
            ) : (
              <NotificationToggle
                label="Benachrichtigung, wenn die Gegenseite Interesse signalisiert"
                checked={false}
                onChange={() => {}}
                locked
                lockedNote="Benachrichtigungen für bereits angenommene Wohnungen sind mit Homelio Premium verfügbar."
              />
            )}
            {isPremium ? (
              <CardList
                apartments={gegenseiteApts}
                onAccept={openModal}
                onDecline={handleDecline}
                emptyMessage="Noch keine Annahmen der Gegenseite"
              />
            ) : (
              <PremiumGate count={gegenseiteApts.length} />
            )}
          </>
        )}

        {/* ── Wartet auf Gegenseite ── */}
        {activeTab === 'warten' && (
          <>
            <p style={{
              fontSize: 14, color: 'rgba(245,245,244,0.45)', lineHeight: 1.72,
              margin: 0, padding: '0 4px',
            }}>
              Sie haben bei diesen Wohnungen Interesse signalisiert. Homelio benachrichtigt Sie, sobald die andere Seite ebenfalls Interesse bestätigt und ein beidseitiger Match entsteht.
            </p>
            <CardList
              apartments={wartenApts}
              onDecline={handleDecline}
              variant="waiting"
              emptyMessage="Keine ausstehenden Annahmen"
            />
          </>
        )}

        {/* ── Beidseitige Matches ── */}
        {activeTab === 'beidseitig' && (
          <>
            <NotificationToggle
              label="Benachrichtigung bei neuen beidseitigen Matches"
              checked={notifyBeidseitig}
              onChange={setNotifyBeidseitig}
            />
            <CardList
              apartments={beidseitigApts}
              variant="mutual"
              emptyMessage="Noch keine beidseitigen Matches"
            />
          </>
        )}

      </div>

      {/* Accept modal — stays mounted while acceptingId/Title are set, even after refreshMatches() */}
      {acceptingId && acceptingAptTitle && (
        <AcceptModal
          apartmentTitle={acceptingAptTitle}
          onClose={() => { setAcceptingId(null); setAcceptingAptTitle(null) }}
          onConfirmed={handleConfirmed}
        />
      )}
    </>
  )
}
