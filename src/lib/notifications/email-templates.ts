// Server-side only — German copy for the five real Homelio notification emails.
// No secrets, no user-controlled HTML injection (all dynamic values are URLs we construct).

export type NotificationType =
  | 'new_recommendation'
  | 'other_interested'
  | 'mutual_match'
  | 'dossier_reminder'
  | 'premium_success'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

function wrap(siteUrl: string, heading: string, body: string, ctaPath: string, ctaLabel: string): string {
  const cta = `${siteUrl}${ctaPath}`
  return `
    <div style="background:#0a0a0a;padding:40px 20px;font-family:Helvetica,Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
        <p style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#d4a853;margin:0 0 18px;">Homelio</p>
        <h1 style="font-size:20px;font-weight:400;color:#f5f5f4;margin:0 0 14px;line-height:1.3;">${heading}</h1>
        <p style="font-size:14px;color:rgba(245,245,244,0.70);line-height:1.7;margin:0 0 26px;">${body}</p>
        <a href="${cta}" style="display:inline-block;background:#d4a853;color:#0C0A06;text-decoration:none;border-radius:999px;padding:12px 24px;font-size:14px;font-weight:500;">${ctaLabel}</a>
        <p style="font-size:11px;color:rgba(245,245,244,0.30);margin:28px 0 0;line-height:1.6;">
          Sie erhalten diese E-Mail, weil Sie bei Homelio für diese Benachrichtigung angemeldet sind.
          Sie können das jederzeit in Ihren Sucheinstellungen anpassen.
        </p>
      </div>
    </div>
  `.trim()
}

export function getEmailTemplate(type: NotificationType, siteUrl: string): EmailTemplate {
  switch (type) {
    case 'new_recommendation':
      return {
        subject: 'Neue Homelio-Empfehlung verfügbar',
        html: wrap(
          siteUrl,
          'Neue Empfehlung verfügbar',
          'Homelio hat eine neue Wohnung gefunden, die zu Ihrem Profil passt. Schauen Sie sich die Details in Ihren Matches an.',
          '/profil/matches',
          'Empfehlung ansehen'
        ),
        text: `Homelio hat eine neue Empfehlung für Sie. Ansehen: ${siteUrl}/profil/matches`,
      }
    case 'other_interested':
      return {
        subject: 'Eine Gegenseite hat Interesse gezeigt',
        html: wrap(
          siteUrl,
          'Eine Gegenseite hat Interesse gezeigt',
          'Bei einem Ihrer Vorschläge hat die andere Seite bereits Interesse signalisiert. Bestätigen Sie Ihr Interesse, damit ein Match entstehen kann.',
          '/profil/matches',
          'Jetzt reagieren'
        ),
        text: `Eine Gegenseite hat Interesse gezeigt. Reagieren: ${siteUrl}/profil/matches`,
      }
    case 'mutual_match':
      return {
        subject: 'Sie haben ein Match auf Homelio',
        html: wrap(
          siteUrl,
          'Sie haben ein Match',
          'Beide Seiten haben Interesse bestätigt. Ergänzen Sie jetzt Ihr Bewerbungsdossier, damit Homelio die Anfrage weiterleiten kann.',
          '/profil/matches',
          'Match ansehen'
        ),
        text: `Sie haben ein neues Match auf Homelio. Ansehen: ${siteUrl}/profil/matches`,
      }
    case 'dossier_reminder':
      return {
        subject: 'Bewerbungsdossier ergänzen',
        html: wrap(
          siteUrl,
          'Bewerbungsdossier ergänzen',
          'Sie haben ein Match, Ihr Bewerbungsdossier ist aber noch nicht vollständig. Ergänzen Sie Ihre Angaben, damit Homelio Ihre Anfrage strukturiert weiterleiten kann.',
          '/profil/bewerbung',
          'Dossier ergänzen'
        ),
        text: `Bitte ergänzen Sie Ihr Bewerbungsdossier: ${siteUrl}/profil/bewerbung`,
      }
    case 'premium_success':
      return {
        subject: 'Homelio Premium wurde aktiviert',
        html: wrap(
          siteUrl,
          'Premium wurde aktiviert',
          'Ihre Zahlung war erfolgreich und Homelio Premium ist jetzt aktiv. Sie haben Zugriff auf alle erweiterten Suchfilter und eine höhere Priorität im Matching.',
          '/profil/sucheinstellungen',
          'Einstellungen ansehen'
        ),
        text: `Homelio Premium ist aktiv. Einstellungen: ${siteUrl}/profil/sucheinstellungen`,
      }
  }
}
