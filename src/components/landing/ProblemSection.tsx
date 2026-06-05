const problems = [
  {
    number: "01",
    title: "Das Risiko der Kündigung",
    text: "Mieter kündigen ihre Wohnung, bevor sie eine neue gefunden haben – ein enormes persönliches Risiko, das viele davon abhält, überhaupt zu wechseln.",
  },
  {
    number: "02",
    title: "Leerstand und Inserateaufwand",
    text: "Wohnungen werden erst ausgeschrieben, wenn sie bereits leer stehen. Das bedeutet unnötigen Leerstand für Verwaltungen und verpasste Chancen für Suchende.",
  },
  {
    number: "03",
    title: "Der unsichtbare Markt",
    text: "Ein riesiger Teil des Marktes ist unsichtbar: Personen, die gerne wechseln würden, aber nicht aktiv suchen – weil das Risiko zu gross ist.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-brand mb-4">
            Der Wohnungsmarkt ist reaktiv – und das schadet allen.
          </h2>
          <p className="text-subtle text-lg leading-relaxed">
            Mieter, Verwaltungen und Wohnungssuchende leiden unter demselben System.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((p) => (
            <div key={p.number} className="border border-line rounded-xl p-8">
              <span className="text-5xl font-bold text-line mb-6 block select-none">{p.number}</span>
              <h3 className="text-lg font-semibold text-brand mb-3">{p.title}</h3>
              <p className="text-subtle leading-relaxed text-sm">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
