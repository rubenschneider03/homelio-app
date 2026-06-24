import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AGB – Homelio',
}

export default function AgbPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0a0a',
      color: '#f5f5f4',
      padding: 'clamp(48px, 8vw, 96px) clamp(20px, 6vw, 80px)',
      fontFamily: 'var(--font-inter, system-ui, sans-serif)',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        <Link href="/" style={{
          fontSize: 13, color: 'rgba(212,168,83,0.80)',
          textDecoration: 'none', display: 'inline-block', marginBottom: 40,
        }}>
          ← Zurück zur Startseite
        </Link>

        <p style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#d4a853', marginBottom: 14 }}>
          Homelio
        </p>
        <h1 style={{
          fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
          fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400,
          color: '#f5f5f4', margin: '0 0 12px', lineHeight: 1.15,
        }}>
          Allgemeine Geschäftsbedingungen
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.38)', marginBottom: 48 }}>
          Stand: Juni 2026 — MVP-Fassung. Diese AGB werden vor einem kommerziellen Launch juristisch geprüft und aktualisiert.
        </p>

        <Section title="1. Anbieter und Geltungsbereich">
          <p>
            Homelio (nachfolgend «Homelio», «wir») ist eine digitale Matching-Plattform, die wechselwillige
            Mieterinnen und Mieter in der Schweiz miteinander und mit Verwaltungen verbindet. Diese
            Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Plattform unter homelio.ch sowie
            aller damit verbundenen Dienste.
          </p>
          <p>
            Mit der Registrierung akzeptieren Sie diese AGB sowie die{' '}
            <Link href="/datenschutz" style={{ color: '#d4a853', textDecoration: 'none' }}>Datenschutzerklärung</Link>.
          </p>
        </Section>

        <Section title="2. Zweck der Plattform">
          <p>
            Homelio ermöglicht es registrierten Nutzerinnen und Nutzern, ihre aktuelle Wohnung sowie ihre
            Suchwünsche anonym zu erfassen. Auf dieser Basis erstellt Homelio algorithmische Vorschläge
            (Matches) zwischen Haushalten, deren Wohnungen und Suchwünsche kompatibel erscheinen.
          </p>
          <p>
            Homelio vermittelt keinen direkten Wohnungsabschluss und garantiert keine erfolgreiche Vermittlung.
            Die Plattform unterstützt Mieterinnen und Mieter lediglich dabei, potenzielle Wohnungswechselchancen
            frühzeitig zu erkennen.
          </p>
        </Section>

        <Section title="3. Vom Nutzer bereitgestellte Daten">
          <p>
            Nutzerinnen und Nutzer stellen auf eigene Verantwortung Angaben zu ihrer aktuellen Wohnung
            (Adresse, Zimmeranzahl, Miete, Ausstattung etc.) sowie zu ihren Suchwünschen bereit. Sie sind
            verantwortlich für die Richtigkeit, Vollständigkeit und Aktualität dieser Angaben.
          </p>
          <p>
            Homelio übernimmt keine Gewähr für die Korrektheit der durch Nutzerinnen und Nutzer eingegebenen
            Daten. Falsche Angaben, die Dritte schädigen, können zur Sperrung des Kontos führen.
          </p>
        </Section>

        <Section title="4. Fotos und Mediendaten">
          <p>
            Nutzerinnen und Nutzer können Fotos ihrer Wohnung hochladen. Mit dem Hochladen bestätigen Sie,
            dass Sie berechtigt sind, diese Bilder zu teilen, und räumen Homelio das nicht-exklusive Recht ein,
            diese Bilder im Rahmen des Matching-Prozesses und einer allfälligen Weiterleitung an Verwaltungen
            zu verwenden.
          </p>
          <p>
            Fotos werden ausschliesslich Nutzern mit einem Homelio-Match sowie — im Rahmen einer konkreten
            Anfrage — zuständigen Wohnungsverwaltungen zugänglich gemacht.
          </p>
        </Section>

        <Section title="5. Weitergabe von Daten an Verwaltungen">
          <p>
            Im Rahmen des Matching-Prozesses kann Homelio anonymisierte oder pseudonymisierte Wohnungs-
            und Suchdaten sowie auf ausdrückliche Anfrage hin auch Bewerbungsunterlagen (Dossier) an
            zuständige Wohnungsverwaltungen weiterleiten. Dies geschieht ausschliesslich, wenn ein konkreter
            Match vorliegt und der Nutzer der Weiterleitung — durch Akzeptieren dieser AGB — zugestimmt hat.
          </p>
          <p>
            Genaue Adressdaten (Strasse, Hausnummer, Wohnungsbezeichnung) und persönliche Kontaktdaten
            werden erst nach beidseitiger Interessensbekundung und ausdrücklicher Zustimmung beider Parteien
            weitergegeben.
          </p>
        </Section>

        <Section title="6. Erfolgsgebühr">
          <p>
            Bei erfolgreicher Vermittlung über Homelio wird eine einmalige Erfolgsgebühr von CHF 100 fällig.
            Erfolgreich bedeutet, dass über einen Homelio-Kontakt ein Mietvertrag abgeschlossen wird.
          </p>
          <p>
            Die Erfolgsgebühr wird unabhängig von einem allfälligen Premium-Abonnement erhoben und gilt
            für alle Nutzerinnen und Nutzer gleich. Im Bewerbungsdossier wird diese Gebühr vor der
            Markierung als «bereit zur Weiterleitung» separat zur Bestätigung vorgelegt.
          </p>
        </Section>

        <Section title="7. Premium-Funktionen">
          <p>
            Homelio bietet kostenfreie Basisfunktionen sowie ein optionales Abonnement
            («Homelio Premium») zu CHF 9.95 pro Monat. Premium schaltet erweiterte Suchfilter sowie eine
            höhere Priorität im Matching-Algorithmus frei.
          </p>
          <p>
            Das Abonnement wird über den Zahlungsdienstleister Stripe abgewickelt und verlängert sich
            automatisch monatlich, bis es gekündigt wird. Nutzerinnen und Nutzer können ihr Abonnement
            jederzeit selbständig über das Stripe-Kundenportal verwalten oder kündigen.
          </p>
          <p>
            Mit der Aktivierung eines Premium-Abonnements entstehen keine Garantien auf einen erfolgreichen
            Wohnungswechsel. Premium ist von der in Ziffer 6 genannten Erfolgsgebühr unabhängig und
            ersetzt diese nicht.
          </p>
        </Section>

        <Section title="8. Keine Erfolgsgarantie">
          <p>
            Homelio garantiert keinen erfolgreichen Wohnungstausch, keine Vermittlung und keine Reaktion
            seitens einer Verwaltung. Die Plattform ist ein Hilfsmittel zur frühzeitigen Erkennung von
            Wohnchancen, nicht ein Versprechen einer Vermittlung.
          </p>
        </Section>

        <Section title="9. Nutzerpflichten">
          <p>
            Nutzerinnen und Nutzer verpflichten sich, keine falschen Angaben zu machen, keine Inhalte
            hochzuladen, zu denen sie nicht berechtigt sind, und die Plattform nicht missbräuchlich zu
            verwenden. Verstösse können zur sofortigen Sperrung des Kontos führen.
          </p>
        </Section>

        <Section title="10. Haftungsbeschränkung">
          <p>
            Homelio haftet nicht für Schäden, die durch unrichtige Nutzerangaben, technische Fehler
            oder die Nichterfüllung eines erhofften Wohnungswechsels entstehen, soweit dies gesetzlich
            zulässig ist.
          </p>
        </Section>

        <Section title="11. Änderungen der AGB">
          <p>
            Homelio behält sich vor, diese AGB jederzeit anzupassen. Nutzerinnen und Nutzer werden über
            wesentliche Änderungen informiert. Die weitere Nutzung der Plattform nach Inkrafttreten
            geänderter AGB gilt als Zustimmung.
          </p>
        </Section>

        <Section title="12. Anwendbares Recht">
          <p>
            Es gilt Schweizer Recht. Gerichtsstand ist Zürich, soweit gesetzlich zulässig.
          </p>
        </Section>

        <div style={{ marginTop: 56, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.30)', lineHeight: 1.7 }}>
            Fragen zu diesen AGB richten Sie bitte an:{' '}
            <a href="mailto:hallo@homelio.ch" style={{ color: '#d4a853', textDecoration: 'none' }}>hallo@homelio.ch</a>
          </p>
          <Link href="/" style={{
            display: 'inline-block', marginTop: 16,
            fontSize: 13, color: 'rgba(212,168,83,0.75)', textDecoration: 'none',
          }}>
            ← Zurück zur Startseite
          </Link>
        </div>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{
        fontFamily: 'var(--font-instrument-serif, Georgia, serif)',
        fontSize: 18, fontWeight: 400, color: '#f5f5f4',
        margin: '0 0 12px', lineHeight: 1.3,
      }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: 'rgba(245,245,244,0.65)', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}
