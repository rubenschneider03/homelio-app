'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

type SubTab = 'empfehlungen' | 'gegenseite' | 'beidseitig'

// ── Sub-tab bar ───────────────────────────────────────────────────────────────

function SubTabBar({
  active,
  onChange,
  counts,
}: {
  active: SubTab
  onChange: (t: SubTab) => void
  counts: { empfehlungen: number; gegenseite: number; beidseitig: number }
}) {
  const tabs: { id: SubTab; label: string; count: number }[] = [
    { id: 'empfehlungen', label: 'Homelio Empfehlungen', count: counts.empfehlungen },
    { id: 'gegenseite', label: 'Von Gegenseite angenommen', count: counts.gegenseite },
    { id: 'beidseitig', label: 'Beidseitige Matches', count: counts.beidseitig },
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
  acceptedIds: string[]
  declinedIds: string[]
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  variant?: 'mutual'
  emptyMessage?: string
}

function CardList({ apartments, acceptedIds, declinedIds, onAccept, onDecline, variant, emptyMessage }: CardListProps) {
  const visible = apartments.filter(a => !declinedIds.includes(a.id))

  if (visible.length === 0) {
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
      {visible.map(apt => (
        <MatchCard
          key={apt.id}
          apartment={apt}
          accepted={acceptedIds.includes(apt.id)}
          onAccept={() => onAccept(apt.id)}
          onDecline={() => onDecline(apt.id)}
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

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<SubTab>('empfehlungen')
  const [recAcceptedIds, setRecAcceptedIds] = useState<string[]>([])
  const [recDeclinedIds, setRecDeclinedIds] = useState<string[]>([])
  const [otherAcceptedIds, setOtherAcceptedIds] = useState<string[]>([])
  const [otherDeclinedIds, setOtherDeclinedIds] = useState<string[]>([])
  const [notifyRec, setNotifyRec] = useState(true)
  const [notifyGegenseite, setNotifyGegenseite] = useState(true)
  const [notifyBeidseitig, setNotifyBeidseitig] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [acceptingTab, setAcceptingTab] = useState<'empfehlungen' | 'gegenseite'>('empfehlungen')

  // ── Load data on mount ────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadMatches() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/anmelden')
        return
      }

      // Load is_premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()
      setIsPremium(profile?.is_premium ?? false)

      // Load match cards via SECURITY DEFINER RPC
      const { data, error } = await supabase.rpc('get_my_match_cards')
      if (error) {
        setLoadError('Beim Laden der Matches ist ein Fehler aufgetreten.')
        setLoadingData(false)
        return
      }

      setMatches((data as MatchCardRow[]) ?? [])
      setLoadingData(false)
    }
    loadMatches()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab categorisation ────────────────────────────────────────────────────────

  const empfehlungen = matches.filter(m => m.my_status === 'pending' && !m.is_mutual)
  const gegenseite   = matches.filter(m => m.other_status === 'interested' && m.my_status !== 'interested' && !m.is_mutual)
  const beidseitig   = matches.filter(m => m.is_mutual)

  const empfehlungenApts = empfehlungen.map(toMatchApartment)
  const gegenseiteApts   = gegenseite.map(toMatchApartment)
  const beidseitigApts   = beidseitig.map(toMatchApartment)

  // ── Accept / decline actions ──────────────────────────────────────────────────

  function openModal(id: string, tab: 'empfehlungen' | 'gegenseite') {
    setAcceptingId(id)
    setAcceptingTab(tab)
    setActionError('')
  }

  async function handleConfirmed() {
    const id = acceptingId // capture before async gap
    if (!id) return

    const supabase = createClient()
    const { error } = await supabase.rpc('express_interest', {
      p_match_id: id,
      p_decision: 'interested',
    })

    if (error) {
      setActionError('Beim Aktualisieren des Matches ist ein Fehler aufgetreten.')
      setAcceptingId(null)
      return
    }

    if (acceptingTab === 'empfehlungen') setRecAcceptedIds(prev => [...prev, id])
    else setOtherAcceptedIds(prev => [...prev, id])
    setAcceptingId(null)
  }

  async function handleDecline(matchId: string, tab: 'empfehlungen' | 'gegenseite') {
    setActionError('')

    // Optimistic: remove card immediately
    if (tab === 'empfehlungen') setRecDeclinedIds(prev => [...prev, matchId])
    else setOtherDeclinedIds(prev => [...prev, matchId])

    const supabase = createClient()
    const { error } = await supabase.rpc('express_interest', {
      p_match_id: matchId,
      p_decision: 'declined',
    })

    if (error) {
      // Revert optimistic update
      if (tab === 'empfehlungen') setRecDeclinedIds(prev => prev.filter(id => id !== matchId))
      else setOtherDeclinedIds(prev => prev.filter(id => id !== matchId))
      setActionError('Beim Aktualisieren des Matches ist ein Fehler aufgetreten.')
    }
  }

  // ── Modal apartment lookup ────────────────────────────────────────────────────

  const acceptingApt = acceptingId
    ? [...empfehlungenApts, ...gegenseiteApts].find(a => a.id === acceptingId) ?? null
    : null

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
              gegenseite: gegenseiteApts.length,
              beidseitig: beidseitigApts.length,
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
            <CardList
              apartments={empfehlungenApts}
              acceptedIds={recAcceptedIds}
              declinedIds={recDeclinedIds}
              onAccept={id => openModal(id, 'empfehlungen')}
              onDecline={id => handleDecline(id, 'empfehlungen')}
              emptyMessage="Noch keine Empfehlungen"
            />
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
                acceptedIds={otherAcceptedIds}
                declinedIds={otherDeclinedIds}
                onAccept={id => openModal(id, 'gegenseite')}
                onDecline={id => handleDecline(id, 'gegenseite')}
                emptyMessage="Noch keine Annahmen der Gegenseite"
              />
            ) : (
              <PremiumGate count={gegenseiteApts.length} />
            )}
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
              acceptedIds={[]}
              declinedIds={[]}
              onAccept={() => {}}
              onDecline={() => {}}
              variant="mutual"
              emptyMessage="Noch keine beidseitigen Matches"
            />
          </>
        )}

      </div>

      {/* Accept modal — shared */}
      {acceptingApt && (
        <AcceptModal
          apartmentTitle={acceptingApt.title}
          onClose={() => setAcceptingId(null)}
          onConfirmed={handleConfirmed}
        />
      )}
    </>
  )
}
