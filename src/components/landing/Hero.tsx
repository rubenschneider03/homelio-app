export default function Hero() {
  return (
    <section className="bg-canvas py-24 md:py-40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl">
          <p className="text-teal text-sm font-semibold tracking-widest uppercase mb-6">
            Der vorgelagerte Wohnungsmarkt
          </p>

          <h1 className="text-4xl md:text-6xl font-bold text-brand leading-[1.1] mb-6">
            Finde deine nächste Wohnung, bevor sie ausgeschrieben wird.
          </h1>

          <p className="text-lg text-subtle leading-relaxed mb-10 max-w-2xl">
            Homelio vernetzt wechselwillige Mieter frühzeitig – bevor Wohnungen offiziell auf
            den Markt kommen. Kostenlos registrieren, Profil anlegen, auf Matches warten.
          </p>

          <div className="flex flex-col sm:flex-row gap-4" id="registrieren">
            <a
              href="#"
              className="inline-flex items-center justify-center bg-teal text-white font-semibold px-8 py-4 rounded-md hover:bg-teal/90 transition-colors text-base"
            >
              Jetzt kostenlos registrieren
            </a>
            <a
              href="#wie-es-funktioniert"
              className="inline-flex items-center justify-center border border-line text-brand font-medium px-8 py-4 rounded-md hover:bg-white transition-colors text-base"
            >
              Wie funktioniert es?
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
