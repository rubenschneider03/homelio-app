export default function CtaSection() {
  return (
    <section className="py-20 md:py-32 bg-brand">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Bereit, den Wohnungsmarkt neu zu erleben?
        </h2>
        <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Registriere dich jetzt – kostenlos, unverbindlich und in unter 2 Minuten. Du wirst
          als einer der Ersten informiert, wenn sich eine passende Wohnung abzeichnet.
        </p>
        <a
          href="#registrieren"
          className="inline-flex items-center bg-teal text-white font-semibold px-10 py-4 rounded-md hover:bg-teal/90 transition-colors text-base"
        >
          Jetzt kostenlos registrieren
        </a>
        <p className="text-white/40 text-sm mt-6">
          Keine Kreditkarte. Kein Abo. Kein Spam.
        </p>
      </div>
    </section>
  );
}
