const trustItems = [
  {
    label: "DSGVO & DSG-konform",
    description: "Schweizer Datenschutzrecht als primäre Grundlage. EU-konform.",
  },
  {
    label: "Entwickelt in der Schweiz",
    description: "Homelio ist ein Schweizer Startup mit Schweizer Werten.",
  },
  {
    label: "Kostenlos bis zur Vermittlung",
    description: "Keine Vorabgebühren, kein Abo, keine versteckten Kosten.",
  },
  {
    label: "Kein Inseratedruck",
    description: "Du bestimmst, ob und wann du reagierst. Kein Spam.",
  },
];

export default function TrustSection() {
  return (
    <section className="py-20 bg-white border-t border-line">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-12">
          <h2 className="text-2xl font-bold text-brand">Deine Daten. Dein Vertrauen.</h2>
          <p className="text-subtle mt-3 leading-relaxed">
            Datenschutz ist bei Homelio kein nachgelagertes Feature – es ist das Fundament.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {trustItems.map((item) => (
            <div key={item.label} className="p-6 rounded-xl bg-canvas border border-line">
              <div className="w-8 h-8 rounded-md bg-teal/10 mb-4" />
              <p className="font-semibold text-brand text-sm mb-1">{item.label}</p>
              <p className="text-subtle text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
