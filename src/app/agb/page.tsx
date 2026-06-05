import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AGB – Homelio",
};

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <p className="text-teal text-sm font-semibold tracking-widest uppercase mb-4">
          Homelio
        </p>
        <h1 className="text-3xl font-bold text-brand mb-4">
          Allgemeine Geschäftsbedingungen
        </h1>
        <p className="text-subtle leading-relaxed mb-8">
          Die vollständigen AGB werden in einer der nächsten Versionen veröffentlicht.
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
