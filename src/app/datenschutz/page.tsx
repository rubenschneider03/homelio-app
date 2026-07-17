import type { Metadata } from 'next'
import Link from 'next/link'
import { CookieSettingsButton } from '@/components/consent/CookieSettingsButton'

export const metadata: Metadata = {
  title: 'Datenschutz – Homelio',
}

export default function DatenschutzPage() {
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
          Datenschutzerklärung
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(245,245,244,0.38)', marginBottom: 48 }}>
          Stand: Juni 2026 — MVP-Fassung. Diese Datenschutzerklärung wird vor einem kommerziellen Launch juristisch geprüft und aktualisiert. Homelio orientiert sich am Schweizer DSG und der europäischen DSGVO.
        </p>

        <Section title="1. Verantwortliche Stelle">
          <p>
            Verantwortlich für die Datenbearbeitung im Sinne des DSG (Schweizer Datenschutzgesetz) ist
            Homelio, erreichbar unter{' '}
            <a href="mailto:hallo@homelio.ch" style={{ color: '#d4a853', textDecoration: 'none' }}>hallo@homelio.ch</a>.
          </p>
        </Section>

        <Section title="2. Welche Daten werden erhoben?">
          <p>
            Homelio erhebt folgende Daten im Rahmen der Plattformnutzung:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Registrierungsdaten:</strong> E-Mail-Adresse und Passwort (verschlüsselt gespeichert)</li>
            <li><strong>Wohnungsdaten:</strong> Adresse (privat, nie weitergegeben ohne Zustimmung), Zimmeranzahl, Fläche, Miete, Ausstattungsmerkmale, Highlights</li>
            <li><strong>Fotos:</strong> Wohnungsbilder, die von Nutzern freiwillig hochgeladen werden</li>
            <li><strong>Suchwünsche:</strong> Gewünschte Stadt/Region, Maximalmiete, weitere optionale Filter</li>
            <li><strong>Bewerbungsangaben (optional):</strong> Name, Telefon, Motivation, Haushaltsgrösse, Einkommenshinweis</li>
          </ul>
        </Section>

        <Section title="3. Zweck der Datenbearbeitung">
          <p>
            Die erhobenen Daten dienen ausschliesslich dem Betrieb der Matching-Plattform:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Erstellung algorithmischer Übereinstimmungen (Matches) zwischen kompatiblen Haushalten</li>
            <li>Anzeige von Match-Karten mit anonymisierten Wohnungsangaben</li>
            <li>Weiterleitung von Bewerbungsunterlagen an Verwaltungen auf Anfrage</li>
          </ul>
        </Section>

        <Section title="4. Weitergabe von Daten">
          <p>
            Homelio gibt keine Daten an Dritte weiter, ausser in folgenden Fällen:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>
              <strong>Anonymisierte Wohnungsdaten</strong> (keine Adresse, kein Name) werden im Rahmen
              von Matches anderen registrierten Nutzern angezeigt.
            </li>
            <li>
              <strong>Fotos</strong> werden ausschliesslich Nutzern mit einem bestätigten Match angezeigt.
              Sie werden als zeitlich begrenzte, signierte URLs bereitgestellt — nicht als öffentliche Links.
            </li>
            <li>
              <strong>Bewerbungsunterlagen</strong> werden auf ausdrückliche Zustimmung hin und bei
              einem konkreten Match an die zuständige Wohnungsverwaltung weitergeleitet.
            </li>
          </ul>
          <p>
            Genaue Adressdaten (Strasse, Hausnummer, Wohnungsbezeichnung) sowie persönliche Kontaktdaten
            werden <strong>nie</strong> ohne ausdrückliche beidseitige Zustimmung weitergegeben.
          </p>
        </Section>

        <Section title="5. Zahlungsabwicklung">
          <p>
            Für das optionale Premium-Abonnement nutzt Homelio den Zahlungsdienstleister Stripe. Bei
            Abschluss eines Abonnements werden Ihre E-Mail-Adresse sowie die zur Zahlungsabwicklung
            notwendigen Daten an Stripe übermittelt. Kreditkarten- und sonstige Zahlungsdaten werden
            ausschliesslich von Stripe verarbeitet und gespeichert — Homelio hat darauf keinen Zugriff
            und speichert lediglich eine Stripe-interne Kunden- und Abonnement-Referenz zur Verwaltung
            des Premium-Status.
          </p>
        </Section>

        <Section title="6. Speicherort und Sicherheit">
          <p>
            Alle Daten werden in der Schweiz und in der EU auf Servern von Supabase (PostgreSQL-Datenbank)
            gespeichert. Die Datenbank ist durch Row-Level-Security (RLS) abgesichert: Jeder Nutzer kann
            ausschliesslich auf seine eigenen Daten zugreifen. Passwörter werden nicht im Klartext gespeichert.
          </p>
          <p>
            Bilder werden in einem privaten, nicht öffentlich zugänglichen Speicher (Supabase Storage)
            abgelegt. Der Zugriff erfolgt ausschliesslich über serverseitig generierte, temporäre URLs.
          </p>
        </Section>

        <Section title="7. Aufbewahrungsdauer">
          <p>
            Daten werden für die Dauer der aktiven Plattformnutzung gespeichert. Bei Kontolöschung werden
            alle personenbezogenen Daten und Fotos entfernt. Homelio behält sich vor, anonymisierte
            Aggregatdaten (z.B. für statistische Auswertungen) ohne Personenbezug zu behalten.
          </p>
        </Section>

        <Section title="8. Ihre Rechte">
          <p>
            Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Bearbeitung sowie Datenübertragbarkeit gemäss DSG/DSGVO. Für entsprechende Anfragen wenden
            Sie sich an:{' '}
            <a href="mailto:hallo@homelio.ch" style={{ color: '#d4a853', textDecoration: 'none' }}>hallo@homelio.ch</a>
          </p>
        </Section>

        <Section title="9. Cookies und Tracking">
          <p>
            Homelio verwendet technisch notwendige Cookies (Session-Cookie für die Authentifizierung).
            Diese sind für den Betrieb der Plattform erforderlich und können nicht deaktiviert werden.
          </p>
          <p>
            Zusätzlich setzt Homelio den Meta Pixel (Meta Platforms Ireland Limited) ein — jedoch nur,
            wenn Sie Marketing-Cookies über den Cookie-Hinweis ausdrücklich akzeptiert haben. Ohne Ihre
            Zustimmung wird kein Meta-Script geladen und kein Marketing-Tracking durchgeführt.
          </p>
          <p>
            Bei erteilter Zustimmung können dabei Informationen wie besuchte Seiten, Browser- und
            Gerätedaten, Ihre IP-Adresse sowie Interaktionen mit der Website verarbeitet werden. Meta
            kann diese Daten gegebenenfalls mit einem bestehenden Meta-Konto (z.B. Facebook oder
            Instagram) verknüpfen. Weitere Informationen finden Sie in den{' '}
            <a
              href="https://www.facebook.com/privacy/policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#d4a853', textDecoration: 'none' }}
            >
              Datenschutzhinweisen von Meta
            </a>.
          </p>
          <p>
            Sie können Ihre Einwilligung jederzeit über die Cookie-Einstellungen widerrufen. Nach einem
            Widerruf werden keine weiteren Meta-Events mehr ausgelöst.
          </p>
          <div style={{ marginTop: 4 }}>
            <CookieSettingsButton />
          </div>
        </Section>

        <Section title="10. Änderungen dieser Datenschutzerklärung">
          <p>
            Homelio behält sich vor, diese Datenschutzerklärung jederzeit anzupassen. Nutzerinnen und
            Nutzer werden über wesentliche Änderungen informiert.
          </p>
        </Section>

        <div style={{ marginTop: 56, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: 12, color: 'rgba(245,245,244,0.30)', lineHeight: 1.7 }}>
            Kontakt für Datenschutzanfragen:{' '}
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
