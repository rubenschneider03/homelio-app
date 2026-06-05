const steps = [
  {
    number: 1,
    title: "Profil anlegen",
    text: "Registriere dich kostenlos und beschreibe deine aktuelle Situation und deine Wohnwünsche. Dauert unter 5 Minuten.",
  },
  {
    number: 2,
    title: "Matching läuft",
    text: "Homelio sucht laufend nach kompatiblen Wohnungswechseln in deiner Region – automatisch und datenschutzkonform.",
  },
  {
    number: 3,
    title: "Du wirst als Erster informiert",
    text: "Sobald ein möglicher Wechsel erkannt wird, bekommst du eine Benachrichtigung – bevor die Wohnung öffentlich wird.",
  },
];

export default function HowItWorks() {
  return (
    <section id="wie-es-funktioniert" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-14">
          <p className="text-teal text-sm font-semibold tracking-widest uppercase mb-4">
            So funktioniert Homelio
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-brand">
            Drei Schritte bis zum Match.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.number}>
              <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm mb-6">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-brand mb-3">{step.title}</h3>
              <p className="text-subtle leading-relaxed text-sm">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
