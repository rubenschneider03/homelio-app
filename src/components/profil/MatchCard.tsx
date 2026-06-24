'use client'

import { computeRentEstimate } from '@/lib/rent-estimate'

export interface MatchApartment {
  id: string
  title: string
  location: string
  managementCompany: string
  available: string
  rooms: number
  area: number
  floor: number
  rentGross: number
  rentNet: number
  additionalCosts: number
  matchScore: number
  features: string[]
  transport: string
  matchReasons: string[]
  description: string
  city?: string | null
  district?: string | null
  hasBalcony?: boolean
  hasElevator?: string | null
  parkingType?: string | null
  laundry?: string | null
  // undefined = not yet loaded (show placeholder), [] = no photos uploaded, [...] = gallery
  photoUrls?: string[]
}

interface MatchCardProps {
  apartment: MatchApartment
  accepted: boolean
  onAccept: () => void
  onDecline: () => void
  variant?: 'mutual' | 'waiting'
}

function ScoreBadge({ score }: { score: number }) {
  const gold = score >= 75
  return (
    <div style={{
      position: 'absolute', top: 16, right: 16,
      background: score >= 90 ? '#d4a853' : gold ? 'transparent' : 'rgba(115,115,115,0.30)',
      border: score >= 90 ? 'none' : gold ? '1.5px solid rgba(212,168,83,0.80)' : 'none',
      borderRadius: 999,
      padding: '5px 12px',
      display: 'flex', alignItems: 'center', gap: 5,
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: score >= 90 ? '#0C0A06' : gold ? '#d4a853' : 'rgba(245,245,244,0.50)' }}>
        {score}% Match
      </span>
    </div>
  )
}

export function MatchCard({ apartment, accepted, onAccept, onDecline, variant }: MatchCardProps) {
  const fmtCHF = (n: number) => `CHF ${n.toLocaleString('de-CH')}`
  const fmtRange = (lo: number, hi: number) =>
    `CHF ${lo.toLocaleString('de-CH')}–${hi.toLocaleString('de-CH')}`

  const estimate = computeRentEstimate({
    city: apartment.city,
    district: apartment.district,
    rooms: apartment.rooms || null,
    area_sqm: apartment.area || null,
    rent_net: apartment.rentNet || null,
    additional_costs: apartment.additionalCosts || null,
    rent_gross: apartment.rentGross || null,
    floor: apartment.floor || null,
    has_balcony: apartment.hasBalcony,
    has_elevator: apartment.hasElevator,
    parking_type: apartment.parkingType,
    laundry: apartment.laundry,
  })

  return (
    <div style={{
      background: 'rgba(18,14,8,0.65)',
      border: `1px solid ${variant === 'mutual' ? 'rgba(80,200,100,0.22)' : variant === 'waiting' ? 'rgba(212,168,83,0.18)' : accepted ? 'rgba(80,200,100,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.25s',
    }}>

      {/* Photo area */}
      <div style={{
        height: 200, position: 'relative',
        background: 'linear-gradient(160deg, #1a1410 0%, #0e0c0a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {apartment.photoUrls && apartment.photoUrls.length > 0 ? (
          /* Horizontally scrollable photo strip — CSS scroll snap, no package */
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
          }}>
            {apartment.photoUrls.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`Foto ${i + 1}`}
                draggable={false}
                loading="lazy"
                decoding="async"
                style={{
                  flex: '0 0 100%',
                  height: '100%',
                  objectFit: 'cover',
                  scrollSnapAlign: 'start',
                  display: 'block',
                }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ))}
          </div>
        ) : (
          <p style={{
            fontSize: 12, color: 'rgba(245,245,244,0.40)',
            margin: 0, textAlign: 'center', padding: '0 24px', lineHeight: 1.65,
          }}>
            {apartment.photoUrls === undefined
              ? 'Fotos werden geladen…'
              : 'Noch keine Fotos hochgeladen'}
          </p>
        )}
        <ScoreBadge score={apartment.matchScore} />
        {/* Photo count badge — visible when multiple photos are available */}
        {apartment.photoUrls && apartment.photoUrls.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 11, fontWeight: 500,
            color: 'rgba(245,245,244,0.85)',
            pointerEvents: 'none',
          }}>
            {apartment.photoUrls.length} Fotos
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Location + title */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(245,245,244,0.40)', margin: '0 0 6px' }}>
            {apartment.location}
          </p>
          <h3 style={{
            fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
            fontSize: 20, fontWeight: 400, color: '#f5f5f4',
            margin: '0 0 6px', lineHeight: 1.25,
          }}>
            {apartment.title}
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.38)', margin: 0 }}>
            Verfügbar ab {apartment.available}
          </p>
        </div>

        {/* Key stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Zimmer', value: apartment.rooms },
            { label: 'm²', value: apartment.area },
            { label: 'CHF/Mo.', value: apartment.rentGross.toLocaleString('de-CH') },
            { label: 'Etage', value: apartment.floor },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f4', lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(245,245,244,0.35)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <p style={{ fontSize: 14, color: 'rgba(245,245,244,0.52)', lineHeight: 1.72, margin: 0 }}>
          {apartment.description}
        </p>

        {/* Feature chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {apartment.features.map(f => (
            <span key={f} style={{
              fontSize: 12, color: 'rgba(245,245,244,0.60)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 999, padding: '4px 11px',
            }}>
              {f}
            </span>
          ))}
        </div>

        {/* Rent comparison */}
        <div>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{ padding: '9px 14px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(245,245,244,0.38)' }}>
                  Aktuelle Miete
                </span>
              </div>
              <div style={{ padding: '9px 14px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(212,168,83,0.65)' }}>
                  Homelio-Mietzinsvermutung
                </span>
              </div>
            </div>

            {/* Body: current rent rows | estimate block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* Left: current rent */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
                {([
                  { label: 'Nettomiete', val: fmtCHF(apartment.rentNet), bold: false },
                  { label: 'Nebenkosten', val: fmtCHF(apartment.additionalCosts), bold: false },
                  { label: 'Bruttomiete', val: fmtCHF(apartment.rentGross), bold: true },
                ] as const).map((row, i) => (
                  <div key={row.label} style={{
                    padding: '9px 14px',
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    background: row.bold ? 'rgba(212,168,83,0.03)' : 'transparent',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <span style={{ fontSize: 11, color: 'rgba(245,245,244,0.38)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 600 : 400, color: row.bold ? '#f5f5f4' : 'rgba(245,245,244,0.75)' }}>
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Right: Homelio estimate */}
              <div style={{
                padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 6,
                background: 'rgba(212,168,83,0.02)',
              }}>
                {estimate.available ? (
                  <>
                    <span style={{ fontSize: 10, color: 'rgba(212,168,83,0.55)', letterSpacing: '0.04em', lineHeight: 1.4 }}>
                      Realistische Neuvermietungsrange
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(212,168,83,0.95)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                      {fmtRange(estimate.grossLow!, estimate.grossHigh!)}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(212,168,83,0.55)', marginTop: -3 }}>
                      brutto / Monat
                    </span>
                    {estimate.netLow != null && estimate.netHigh != null && (
                      <span style={{ fontSize: 11, color: 'rgba(245,245,244,0.45)' }}>
                        {fmtRange(estimate.netLow, estimate.netHigh)} netto
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: estimate.confidence === 'Hoch'
                          ? 'rgba(80,200,100,0.80)'
                          : estimate.confidence === 'Mittel'
                          ? 'rgba(212,168,83,0.80)'
                          : 'rgba(245,245,244,0.35)',
                      }} />
                      <span style={{ fontSize: 10, color: 'rgba(245,245,244,0.38)' }}>
                        Konfidenz: {estimate.confidence}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(245,245,244,0.40)', lineHeight: 1.4 }}>
                      {estimate.referenceRateText}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(245,245,244,0.45)', lineHeight: 1.5 }}>
                      {estimate.comparison}
                    </span>
                    {estimate.marketConflictNote && (
                      <span style={{ fontSize: 10, color: 'rgba(212,168,83,0.60)', lineHeight: 1.4 }}>
                        {estimate.marketConflictNote}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 10, color: 'rgba(212,168,83,0.55)', letterSpacing: '0.04em', lineHeight: 1.4 }}>
                      Realistische Neuvermietungsrange
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(245,245,244,0.32)', lineHeight: 1.55 }}>
                      {estimate.missingFields && estimate.missingFields.length > 0
                        ? `Für eine Einschätzung fehlen: ${estimate.missingFields.join(', ')}.`
                        : 'Keine Einschätzung verfügbar.'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p style={{ fontSize: 11, color: 'rgba(245,245,244,0.40)', margin: '8px 0 0', lineHeight: 1.6, fontStyle: 'italic' }}>
            Unverbindliche Einschätzung auf Basis der verfügbaren Angaben.
          </p>
        </div>

        {/* Verwaltung + ÖV */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, overflow: 'hidden',
        }}>
          {[
            { key: 'Verwaltung', value: apartment.managementCompany },
            { key: 'ÖV', value: apartment.transport },
          ].map((row, i) => (
            <div key={row.key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '9px 14px',
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: 12, color: 'rgba(245,245,244,0.40)' }}>{row.key}</span>
              <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.72)' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Match reasons */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,244,0.35)', margin: '0 0 10px' }}>
            Warum dieser Match?
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {apartment.matchReasons.map(r => (
              <li key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <span style={{ color: '#d4a853', fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.62)', lineHeight: 1.55 }}>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Privacy note */}
        <p style={{
          fontSize: 12, color: 'rgba(245,245,244,0.40)', margin: 0, lineHeight: 1.65,
          paddingTop: 4,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          Ihre Kontaktdaten werden erst nach beidseitiger Interessensbekundung weitergegeben. Homelio koordiniert die Kontaktaufnahme diskret.
        </p>

        {/* Action area */}
        {variant === 'mutual' ? (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            background: 'rgba(80,200,100,0.07)',
            border: '1px solid rgba(80,200,100,0.22)',
            borderRadius: 10, padding: '18px 20px',
          }}>
            <span style={{ fontSize: 14, color: 'rgba(120,220,130,0.90)', fontWeight: 500 }}>
              ✓ Beidseitiges Interesse bestätigt
            </span>
            <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.45)', lineHeight: 1.6 }}>
              Beide Seiten haben Interesse signalisiert. Homelio bereitet den nächsten Schritt vor.
            </span>
          </div>
        ) : variant === 'waiting' ? (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            background: 'rgba(212,168,83,0.05)',
            border: '1px solid rgba(212,168,83,0.16)',
            borderRadius: 10, padding: '18px 20px',
          }}>
            <span style={{ fontSize: 14, color: 'rgba(212,168,83,0.85)', fontWeight: 500 }}>
              Interesse übermittelt — wartet auf Gegenseite
            </span>
            <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.45)', lineHeight: 1.6 }}>
              Sobald die andere Seite ebenfalls Interesse signalisiert, entsteht ein beidseitiger Match.
            </span>
            <button
              onClick={onDecline}
              style={{
                alignSelf: 'flex-start',
                background: 'none', border: 'none',
                fontSize: 12, color: 'rgba(245,245,244,0.30)',
                cursor: 'pointer', fontFamily: 'inherit',
                padding: '4px 0', marginTop: 2,
                textDecoration: 'underline', textUnderlineOffset: '3px',
              }}
            >
              Interesse zurückziehen
            </button>
          </div>
        ) : accepted ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'rgba(80,200,100,0.08)',
            border: '1px solid rgba(80,200,100,0.22)',
            borderRadius: 10, padding: '14px 20px',
          }}>
            <span style={{ fontSize: 14, color: 'rgba(120,220,130,0.90)', fontWeight: 500 }}>
              ✓ Interesse bestätigt — Homelio ist in Kontakt
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onAccept}
              style={{
                flex: 2,
                background: '#d4a853', color: '#0C0A06', border: 'none',
                borderRadius: 999, padding: '13px 20px',
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '0.02em',
              }}
            >
              Interesse bestätigen
            </button>
            <button
              onClick={onDecline}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 999, padding: '13px 16px',
                fontSize: 14, color: 'rgba(245,245,244,0.45)', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Kein Interesse
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
