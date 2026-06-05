import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-brand border-t border-white/10 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-white font-semibold mb-1">Homelio</p>
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} – Entwickelt in der Schweiz
          </p>
        </div>

        <div className="flex gap-8">
          <Link
            href="/datenschutz"
            className="text-white/50 text-sm hover:text-white/90 transition-colors"
          >
            Datenschutz
          </Link>
          <Link
            href="/agb"
            className="text-white/50 text-sm hover:text-white/90 transition-colors"
          >
            AGB
          </Link>
          <a
            href="mailto:hallo@homelio.ch"
            className="text-white/50 text-sm hover:text-white/90 transition-colors"
          >
            Kontakt
          </a>
        </div>
      </div>
    </footer>
  );
}
