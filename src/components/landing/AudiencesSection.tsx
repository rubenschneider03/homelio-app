const mieterFeatures = [
  "Kostenlose Registrierung",
  "Zugang zu Wohnungen vor dem Markt",
  "Kündigen erst, wenn du sicher bist",
  "Vollständige Datenkontrolle",
];

const verwaltungsFeatures = [
  "Frühzeitige Wechselsignale",
  "Weniger Leerstand",
  "Bessere Portfolio-Planung",
  "SaaS-Dashboard (ab Phase 7)",
];

export default function AudiencesSection() {
  return (
    <section className="py-20 md:py-28 bg-canvas">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-brand">Für wen ist Homelio?</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Mieter */}
          <div id="mieter" className="bg-white rounded-xl p-8 border border-line">
            <p className="text-teal text-sm font-semibold tracking-widest uppercase mb-5">
              Für Mieter
            </p>
            <h3 className="text-2xl font-bold text-brand mb-4">
              Früher Zugang. Weniger Risiko.
            </h3>
            <p className="text-subtle leading-relaxed mb-8 text-sm">
              Du willst umziehen, aber das Risiko ist zu gross? Registriere dich jetzt –
              kostenlos. Du wirst informiert, wenn sich eine passende Wohnung abzeichnet.
              Kündigen erst, wenn du sicher bist.
            </p>
            <ul className="space-y-3">
              {mieterFeatures.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-ink">
                  <span className="w-5 h-5 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xs font-bold flex-shrink-0">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Verwaltungen */}
          <div id="verwaltungen" className="bg-brand rounded-xl p-8">
            <p className="text-teal text-sm font-semibold tracking-widest uppercase mb-5">
              Für Verwaltungen
            </p>
            <h3 className="text-2xl font-bold text-white mb-4">
              Wechsel früh erkennen. Leerstand reduzieren.
            </h3>
            <p className="text-white/70 leading-relaxed mb-8 text-sm">
              Erfahre frühzeitig, wenn Mieter in deinem Portfolio wechselbereit sind. Plane
              Nachmieter, bevor Wohnungen leer stehen. Kein Inserateaufwand, keine
              Überraschungen.
            </p>
            <ul className="space-y-3">
              {verwaltungsFeatures.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
