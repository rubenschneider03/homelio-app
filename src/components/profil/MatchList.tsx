'use client'

import { useState } from 'react'
import { MatchCard, type MatchApartment } from './MatchCard'
import { AcceptModal } from './AcceptModal'

const isPremium = false

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_RECOMMENDATIONS: MatchApartment[] = [
  {
    id: 'match-001',
    title: 'Helle 3.5-Zi-Wohnung in Wiedikon',
    location: 'Zürich Wiedikon',
    managementCompany: 'Wincasa AG',
    available: '1. August 2026',
    rooms: 3.5, area: 82, floor: 3,
    rentGross: 2350, rentNet: 1980, additionalCosts: 370,
    estimatedRentNet: 1880, estimatedAdditionalCosts: 350, estimatedRentGross: 2230,
    matchScore: 94,
    features: ['Balkon', 'Lift', 'Keller', 'Ruhige Innenlage', 'Südausrichtung'],
    transport: 'Tram 2/3 Schmiede Wiedikon (4 min)',
    description: 'Helle, gepflegte Wohnung in ruhiger Innenlage mit grossem Balkon nach Süden. Frisch renovierte Küche, Parkettböden, hohe Decken. Zentrumsnah und trotzdem ruhig.',
    matchReasons: [
      'Lage und Quartier entsprechen Ihren Sucheinstellungen',
      'Miete liegt innerhalb Ihres Budgets',
      'Balkon und Lift vorhanden',
      'Sehr gute ÖV-Anbindung',
    ],
  },
  {
    id: 'match-002',
    title: 'Grosszügige 4.5-Zi in Oerlikon',
    location: 'Zürich Oerlikon',
    managementCompany: 'UBS Fondsverwaltung',
    available: '1. September 2026',
    rooms: 4.5, area: 112, floor: 2,
    rentGross: 2890, rentNet: 2480, additionalCosts: 410,
    estimatedRentNet: 2350, estimatedAdditionalCosts: 390, estimatedRentGross: 2740,
    matchScore: 81,
    features: ['Grosse Terrasse', 'Tiefgarage', 'Waschmaschine in Wohnung', 'Neubau 2019', 'Minergie-Standard'],
    transport: 'Bhf. Oerlikon (6 min zu Fuss)',
    description: 'Moderner Neubau im Minergie-Standard mit grosser Terrasse und eigenem Waschmaschinenanschluss. Ruhige Lage mit direktem Zugang zum Tiefgaragenplatz. Ideal für Familien oder Home-Office.',
    matchReasons: [
      'Grosszügige Fläche passt zu Ihrer Haushaltsgrösse',
      'Waschmaschine in der Wohnung vorhanden',
      'Sehr gute Anbindung an den Hauptbahnhof',
      'Neubaustandard entspricht Ihrer Qualitätspräferenz',
    ],
  },
  {
    id: 'match-003',
    title: 'Charmante 2.5-Zi in Höngg',
    location: 'Zürich Höngg',
    managementCompany: 'Privat',
    available: '1. Juli 2026',
    rooms: 2.5, area: 65, floor: 1,
    rentGross: 1780, rentNet: 1540, additionalCosts: 240,
    estimatedRentNet: 1460, estimatedAdditionalCosts: 225, estimatedRentGross: 1685,
    matchScore: 76,
    features: ['Balkon', 'Keller', 'Ruhige Wohnlage', 'Parkettboden', 'Altbaucharme'],
    transport: 'Bus 40 Regensdorferstrasse (3 min)',
    description: 'Charmante Altbauwohnung mit Parkettboden und hohen Decken. Ruhige Wohnlage am Stadtrand, kurze Busverbindung ins Zentrum. Privat vermietet — persönlicher Kontakt zum Eigentümer.',
    matchReasons: [
      'Frühester Einzugstermin entspricht Ihrem Wunschdatum',
      'Miete deutlich unter Ihrem Maximalbudget',
      'Ruhige Wohnlage mit ÖV-Anbindung',
      'Balkon vorhanden',
    ],
  },
]

const MOCK_ACCEPTED_BY_OTHER: MatchApartment[] = [
  {
    id: 'match-004',
    title: 'Sonnige 3-Zi-Wohnung in Aussersihl',
    location: 'Zürich Aussersihl',
    managementCompany: 'Livit AG',
    available: '1. August 2026',
    rooms: 3, area: 74, floor: 4,
    rentGross: 2180, rentNet: 1870, additionalCosts: 310,
    estimatedRentNet: 1780, estimatedAdditionalCosts: 295, estimatedRentGross: 2075,
    matchScore: 88,
    features: ['Südbalkon', 'Lift', 'Keller', 'Frisch renoviert', 'Hellholz-Böden'],
    transport: 'Tram 3/14 Helvetiaplatz (3 min)',
    description: 'Lichtdurchflutete Wohnung mit grossem Südbalkon, frisch renoviert. Ruhige Lage trotz zentraler Adresse. Neue Einbauküche, Parkett, modernes Bad. Verwaltung reagiert schnell.',
    matchReasons: [
      'Eigentümer hat Ihr Profil aktiv bevorzugt',
      'Lage passt zu Ihren Sucheinstellungen',
      'Miete liegt innerhalb Ihres Budgets',
      'Balkon und Lift entsprechen Ihren Ausstattungswünschen',
    ],
  },
  {
    id: 'match-005',
    title: 'Ruhige 3.5-Zi in Wipkingen',
    location: 'Zürich Wipkingen',
    managementCompany: 'REME Verwaltung AG',
    available: '1. Oktober 2026',
    rooms: 3.5, area: 88, floor: 2,
    rentGross: 2470, rentNet: 2120, additionalCosts: 350,
    estimatedRentNet: 2010, estimatedAdditionalCosts: 330, estimatedRentGross: 2340,
    matchScore: 83,
    features: ['Loggia', 'Keller', 'Waschküche im Haus', 'Ruhige Seitengasse', 'Altbaucharme'],
    transport: 'S-Bahn Wipkingen (5 min zu Fuss)',
    description: 'Grosszügige Altbauwohnung in ruhiger Seitengasse mit schöner Loggia. Hohe Decken, Parkettboden, Stuck. Sehr gut angebundenes Quartier mit lokaler Infrastruktur.',
    matchReasons: [
      'Verwaltung hat Ihr Profil aktiv als passend markiert',
      'Haushaltsgrösse entspricht der Wohnungsgrösse',
      'S-Bahn-Anbindung entspricht Ihrer ÖV-Präferenz',
      'Ruhige Lage entspricht Ihrer Lärmsensibilität',
    ],
  },
  {
    id: 'match-006-other',
    title: 'Moderne 2.5-Zi in Altstetten',
    location: 'Zürich Altstetten',
    managementCompany: 'Swiss Life Asset Managers',
    available: '1. September 2026',
    rooms: 2.5, area: 68, floor: 5,
    rentGross: 2050, rentNet: 1780, additionalCosts: 270,
    estimatedRentNet: 1690, estimatedAdditionalCosts: 255, estimatedRentGross: 1945,
    matchScore: 79,
    features: ['Terrasse', 'Tiefgarage', 'Neubau 2022', 'Minergie-P', 'Lift'],
    transport: 'Tram 2 Lindenplatz (4 min)',
    description: 'Helle Neubauwohnung im obersten Stockwerk mit eigener Terrasse. Minergie-P zertifiziert, sehr niedriger Energieverbrauch. Ruhige Lage nahe Grünflächen.',
    matchReasons: [
      'Eigentümer hat aktives Interesse an Ihrem Profil signalisiert',
      'Terrasse und Lift vorhanden',
      'Neubaustandard mit niedrigen Nebenkosten',
      'Miete innerhalb Ihres Budgets',
    ],
  },
]

const MOCK_MUTUAL: MatchApartment[] = [
  {
    id: 'match-007-mutual',
    title: 'Stilvolle 3.5-Zi an der Rämistrasse',
    location: 'Zürich Hochschulen',
    managementCompany: 'Pelichet & Cie AG',
    available: '1. Juli 2026',
    rooms: 3.5, area: 91, floor: 3,
    rentGross: 2680, rentNet: 2280, additionalCosts: 400,
    estimatedRentNet: 2160, estimatedAdditionalCosts: 380, estimatedRentGross: 2540,
    matchScore: 97,
    features: ['Balkon', 'Lift', 'Keller', 'Bibliothekszimmer', 'Gründerzeitbau'],
    transport: 'Tram 6/9 ETH/Universitätsspital (2 min)',
    description: 'Aussergewöhnliche Gründerzeitwohnung mit hohen Stuckdecken, breiten Parkett-Dielen und kleinem Bibliothekszimmer. Ideale Anbindung an ETH und Innenstadt. Sehr gepflegtes Haus.',
    matchReasons: [
      'Beidseitiges Interesse bereits bestätigt',
      'Höchster Matchscore aller Ihrer Empfehlungen',
      'Lage, Grösse und Ausstattung passen exzellent',
      'Homelio koordiniert die nächsten Schritte',
    ],
  },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type SubTab = 'empfehlungen' | 'gegenseite' | 'beidseitig'

// ── Sub-tab bar ───────────────────────────────────────────────────────────────

function SubTabBar({ active, onChange }: { active: SubTab; onChange: (t: SubTab) => void }) {
  const tabs: { id: SubTab; label: string; count?: number }[] = [
    { id: 'empfehlungen', label: 'Homelio Empfehlungen', count: MOCK_RECOMMENDATIONS.length },
    { id: 'gegenseite', label: 'Von Gegenseite angenommen', count: MOCK_ACCEPTED_BY_OTHER.length },
    { id: 'beidseitig', label: 'Beidseitige Matches', count: MOCK_MUTUAL.length },
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
            {tab.count !== undefined && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: isActive ? 'rgba(212,168,83,0.18)' : 'rgba(255,255,255,0.07)',
                color: isActive ? '#d4a853' : 'rgba(245,245,244,0.35)',
                borderRadius: 999, padding: '2px 7px',
                transition: 'background 0.15s, color 0.15s',
              }}>
                {tab.count}
              </span>
            )}
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
  const [activeTab, setActiveTab] = useState<SubTab>('empfehlungen')

  // Empfehlungen accept/decline state
  const [recAcceptedIds, setRecAcceptedIds] = useState<string[]>([])
  const [recDeclinedIds, setRecDeclinedIds] = useState<string[]>([])

  // Gegenseite accept/decline state (only active when isPremium)
  const [otherAcceptedIds, setOtherAcceptedIds] = useState<string[]>([])
  const [otherDeclinedIds, setOtherDeclinedIds] = useState<string[]>([])

  // Notification toggle state
  const [notifyRec, setNotifyRec] = useState(true)
  const [notifyGegenseite, setNotifyGegenseite] = useState(true)
  const [notifyBeidseitig, setNotifyBeidseitig] = useState(true)

  // Modal state — shared across tabs
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [acceptingTab, setAcceptingTab] = useState<'empfehlungen' | 'gegenseite'>('empfehlungen')

  const allMock = [...MOCK_RECOMMENDATIONS, ...MOCK_ACCEPTED_BY_OTHER]
  const acceptingApt = acceptingId ? allMock.find(m => m.id === acceptingId) ?? null : null

  function openModal(id: string, tab: 'empfehlungen' | 'gegenseite') {
    setAcceptingId(id)
    setAcceptingTab(tab)
  }

  function handleConfirmed() {
    if (!acceptingId) return
    if (acceptingTab === 'empfehlungen') setRecAcceptedIds(prev => [...prev, acceptingId])
    else setOtherAcceptedIds(prev => [...prev, acceptingId])
    setAcceptingId(null)
  }

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
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <h2 style={{
              fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
              fontSize: 22, fontWeight: 400, color: '#f5f5f4',
              margin: 0, lineHeight: 1.2,
            }}>
              Ihre Matches
            </h2>
            <span style={{ fontSize: 12, color: 'rgba(245,245,244,0.28)' }}>
              Phase 1 Vorschau — Beispieldaten
            </span>
          </div>
        </div>
        <div style={{ paddingLeft: 12, paddingRight: 12 }}>
          <SubTabBar active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

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
              apartments={MOCK_RECOMMENDATIONS}
              acceptedIds={recAcceptedIds}
              declinedIds={recDeclinedIds}
              onAccept={id => openModal(id, 'empfehlungen')}
              onDecline={id => setRecDeclinedIds(prev => [...prev, id])}
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
                apartments={MOCK_ACCEPTED_BY_OTHER}
                acceptedIds={otherAcceptedIds}
                declinedIds={otherDeclinedIds}
                onAccept={id => openModal(id, 'gegenseite')}
                onDecline={id => setOtherDeclinedIds(prev => [...prev, id])}
              />
            ) : (
              <PremiumGate count={MOCK_ACCEPTED_BY_OTHER.length} />
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
              apartments={MOCK_MUTUAL}
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
