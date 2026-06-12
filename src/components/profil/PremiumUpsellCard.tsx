const BENEFITS = [
  'Vollständige Suchfilter: Zimmer, Fläche, Einzug, Haushaltsgrösse',
  'Ausstattungsfilter: Haustiere, Balkon, Lift, Parkplatz, Waschsituation',
  'Präzisionsfilter: Mikrolage, Pendelzeit, Lärm, Besonnung, Stockwerk',
  'Höhere Priorität im Matching-Algorithmus',
  'Frühere Benachrichtigung und Zugang zu neuen Angeboten',
  'Bevorzugte & gesperrte Verwaltungen, bis zu 3 Suchprofile',
]

export function PremiumUpsellCard() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(212,168,83,0.08) 0%, rgba(123,174,200,0.06) 100%)',
      border: '1px solid rgba(212,168,83,0.28)',
      borderRadius: 14,
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <h3 style={{
            fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
            fontSize: 20, fontWeight: 400, color: '#f5f5f4', margin: 0,
          }}>
            Homelio Premium
          </h3>
          <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.45)', letterSpacing: '0.02em' }}>
            CHF 9.95 / Monat — jederzeit kündbar
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.45)', margin: 0, lineHeight: 1.6 }}>
          Erhöhen Sie Ihre Chancen mit präziseren Sucheinstellungen und höherer Sichtbarkeit.
        </p>
      </div>

      {/* Benefits */}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {BENEFITS.map(b => (
          <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: '#d4a853', fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 13, color: 'rgba(245,245,244,0.72)', lineHeight: 1.5 }}>{b}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        style={{
          background: '#d4a853',
          color: '#0C0A06',
          border: 'none',
          borderRadius: 999,
          padding: '13px 28px',
          fontSize: 14, fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          letterSpacing: '0.02em',
          alignSelf: 'flex-start',
        }}
      >
        Premium aktivieren →
      </button>

      <p style={{ fontSize: 11, color: 'rgba(245,245,244,0.28)', margin: 0, lineHeight: 1.6 }}>
        Keine versteckten Kosten. Kein automatischer Jahresvertrag. Sicher und datenschutzkonform.
      </p>
    </div>
  )
}
