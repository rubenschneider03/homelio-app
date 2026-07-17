# Meta Pixel – Integration

Stand: Juli 2026

## Überblick

Der Meta Pixel ist consent-gebunden integriert: Ohne ausdrückliche Zustimmung zu
Marketing-Cookies wird **kein** Meta-Script geladen, **kein** Meta-Cookie gesetzt
und **kein** Event gesendet. Ohne konfigurierte Pixel-ID passiert ebenfalls
nichts — die Website funktioniert normal.

## Inbetriebnahme — Reihenfolge

1. **Migration ausführen:** `supabase/migrations/008_profile_completion.sql`
   im Supabase Dashboard → SQL Editor → Run (Details in Abschnitt 2).
2. **Pixel erstellen:** Meta Events Manager (Business Suite → Datenquellen →
   Pixel) → neuen Pixel anlegen → Pixel-ID kopieren.
3. **Pixel-ID setzen:** lokal in `.env.local`, für Produktion in Vercel
   (Details in Abschnitt 1).
4. **Neues Deployment auslösen:** Push auf `main` (oder Redeploy in Vercel) —
   die Env-Variable wird erst beim Build eingebettet.
5. **Consent akzeptieren:** Website öffnen → Cookie-Banner → „Alle akzeptieren".
6. **Events prüfen:** Meta Events Manager → Pixel → „Ereignisse testen"
   (Test Events) — dort erscheinen PageView, CompleteRegistration und
   ProfileCompleted live (Details in Abschnitt 5).

## 1. Pixel-ID eintragen

Die ID kommt aus dem Meta Events Manager (Business Suite → Datenquellen → Pixel).

- **Lokal:** in `.env.local` eintragen:
  ```
  NEXT_PUBLIC_META_PIXEL_ID=1234567890
  ```
- **Produktion (Vercel):** Project → Settings → Environment Variables →
  `NEXT_PUBLIC_META_PIXEL_ID` setzen und neu deployen.

## 2. Einmalige Supabase-Migration

`supabase/migrations/008_profile_completion.sql` im Supabase Dashboard
(SQL Editor → Run) ausführen. Sie ergänzt `profiles.profile_completed_at` und
die Funktion `mark_profile_completed_if_ready()` — die zentrale (und einzige)
Definition von „Profil vollständig". Solange die Migration nicht ausgeführt
ist, funktioniert alles andere normal; nur das `ProfileCompleted`-Event bleibt
stumm.

## 3. Wie der Consent das Tracking steuert

- Beim ersten Besuch erscheint ein Cookie-Banner („Alle akzeptieren" / „Nur
  notwendige"). Die Entscheidung liegt in `localStorage` unter
  `homelio_cookie_consent_v1`.
- Erst nach Zustimmung lädt `MetaPixel.tsx` das fbq-Script und initialisiert
  den Pixel. Vorher existiert `window.fbq` gar nicht.
- Jede Tracking-Hilfsfunktion (`src/lib/metaPixel.ts`) prüft vor jedem Event
  erneut: Browser vorhanden, Pixel-ID gesetzt, Script geladen, Consent erteilt.
  Fehlt etwas, bricht sie still ab.
- **Widerruf:** Auf der Datenschutz-Seite (Abschnitt 9) öffnet der Button
  „Cookie-Einstellungen öffnen" den Dialog erneut. Wird Marketing deaktiviert,
  werden keine weiteren Events gesendet, der Pixel wird pausiert
  (`fbq('consent', 'revoke')`) und die Cookies `_fbp`/`_fbc` werden für die
  eigene Domain entfernt. Bereits an Meta übermittelte Daten werden dadurch
  nicht rückwirkend gelöscht.

## 4. Die drei Events und ihre Auslösepunkte

| Event | Typ | Auslösepunkt | Einmaligkeit |
|---|---|---|---|
| `PageView` | Standard | Pixel-Initialisierung + jeder clientseitige Routenwechsel (`MetaPixel.tsx`) | Der Init-PageView wird beim Routen-Hook übersprungen — kein Doppel-Event |
| `CompleteRegistration` | Standard | `OnboardingForm.tsx`, nachdem `onboarding_completed_at` erfolgreich gesetzt wurde | Das Update greift nur, solange der Wert `NULL` ist; nur dann feuert das Event (dauerhaft in Supabase abgesichert) |
| `ProfileCompleted` | Custom, Parameter `profile_type: "tenant_matching"` | `MeineWohnungForm.tsx` und `SucheinstellungenForm.tsx` nach erfolgreichem Speichern, via RPC `mark_profile_completed_if_ready()` | Die DB-Funktion gibt nur beim allerersten Übergang zu „vollständig" `true` zurück (atomar, geräteübergreifend) |

„Vollständig" heisst (identisch mit den Bedingungen von `run_matching()`):
Onboarding abgeschlossen **und** Wohnung aktiv mit Ort/Zimmern/Bruttomiete
**und** Sucheinstellungen mit Stadt/Region oder Maximalmiete.

Es werden keine personenbezogenen Daten als Event-Parameter übertragen — keine
Namen, E-Mail-Adressen, Telefonnummern, Adressen, Freitexte oder User-IDs.

## 5. Testen

**Meta Pixel Helper (Chrome-Erweiterung):**
1. Erweiterung installieren, Seite mit gesetzter Pixel-ID öffnen.
2. Vor Consent: Das Icon muss inaktiv bleiben (kein Pixel gefunden) — das ist
   das erwartete Verhalten.
3. „Alle akzeptieren" klicken → Helper zeigt den Pixel mit einem `PageView`.
4. Zwischen Seiten navigieren → pro Wechsel genau ein weiterer `PageView`.
5. Registrierung + Onboarding durchspielen → einmalig `CompleteRegistration`.
6. Wohnung vollständig (Ort, Zimmer, Miete) und Sucheinstellungen (Region oder
   Maxmiete) speichern → beim letzten der beiden Schritte einmalig
   `ProfileCompleted`. Erneutes Speichern darf es nicht noch einmal auslösen.

**Meta Events Manager:** Datenquellen → Pixel → „Ereignisse testen" zeigt
eingehende Events live an (Test-Browser-Session mit derselben Seite öffnen).

**Widerruf testen:** Datenschutz-Seite → „Cookie-Einstellungen öffnen" →
Marketing abwählen → speichern. Danach dürfen im Pixel Helper keine neuen
Events mehr erscheinen und `_fbp` sollte aus den Cookies verschwunden sein
(DevTools → Application → Cookies).
