const pillars = [
  {
    title: "Vorgelagerter Markt",
    text: "Homelio schafft Zugang zu Wohnungen, bevor sie offiziell ausgeschrieben werden – für beide Seiten.",
  },
  {
    title: "Freiwillig & ohne Druck",
    text: "Kein Inseratedruck, kein Abo. Du entscheidest, wann du weiter machst. Alle Wechsel sind freiwillig.",
  },
  {
    title: "Datenschutz von Anfang an",
    text: "Keine persönlichen Daten ohne deine Zustimmung. DSG- und DSGVO-konform, entwickelt in der Schweiz.",
  },
];

export default function SolutionSection() {
  return (
    <section className="py-20 md:py-28 bg-canvas">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-teal text-sm font-semibold tracking-widest uppercase mb-4">
            Die Lösung
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-brand mb-4">
            Homelio macht den unsichtbaren Markt sichtbar.
          </h2>
          <p className="text-subtle text-lg leading-relaxed">
            Wechselwillige Mieter registrieren sich frühzeitig. Das System erkennt kompatible
            Wohnungswechsel – bevor eine einzige Kündigung ausgesprochen ist.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p) => (
            <div key={p.title} className="bg-white rounded-xl p-8 border border-line">
              <div className="w-10 h-10 rounded-lg bg-teal/10 mb-6" />
              <h3 className="font-semibold text-brand mb-2">{p.title}</h3>
              <p className="text-subtle text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
