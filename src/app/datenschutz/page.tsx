import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz – Homelio",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <p className="text-teal text-sm font-semibold tracking-widest uppercase mb-4">
          Homelio
        </p>
        <h1 className="text-3xl font-bold text-brand mb-4">Datenschutzerklärung</h1>
        <p className="text-subtle leading-relaxed mb-8">
          Die vollständige Datenschutzerklärung wird in einer der nächsten Versionen
          veröffentlicht. Homelio nimmt Datenschutz sehr ernst – DSG- und DSGVO-konform.
        </p>
        <Link
          href="/"
          className="text-teal hover:text-teal/80 text-sm font-medium transition-colors"
        >
          ← Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
