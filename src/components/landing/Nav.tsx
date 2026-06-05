import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-line">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="text-brand font-bold text-xl tracking-tight">
          Homelio
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#mieter" className="text-sm text-subtle hover:text-brand transition-colors">
            Für Mieter
          </a>
          <a href="#verwaltungen" className="text-sm text-subtle hover:text-brand transition-colors">
            Für Verwaltungen
          </a>
        </div>

        <a
          href="#registrieren"
          className="bg-teal text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-teal/90 transition-colors"
        >
          Jetzt registrieren
        </a>
      </div>
    </nav>
  );
}
