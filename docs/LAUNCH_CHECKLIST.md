# Homelio — Launch Readiness Checklist

Last updated: Sprint 4 (Final QA pass). This is a working checklist for the
first real customer/pilot rollout — not a compliance certificate.

## 1. Manual tests to run before first users

### Auth
- [ ] Sign up with a real email → confirmation email arrives → clicking the link logs you in and redirects to `/onboarding`
- [ ] Log in with correct / incorrect credentials → correct error messages shown
- [ ] Log out → redirected to `/anmelden`, profile routes become inaccessible
- [ ] Visit `/profil/*` or `/onboarding` while logged out → redirected to `/anmelden`
- [ ] Visit `/anmelden` while logged in → redirected to `/profil/meine-wohnung`
- [ ] **New this sprint:** "Passwort vergessen?" → request email → click link → set new password → land on `/profil/meine-wohnung`. Test with both a registered and an unregistered email (response text must be identical either way — already implemented this way).

### Profile workflow
- [ ] Fill in "Meine Wohnung" partially, refresh the page without saving → local draft is restored, "Entwurf lokal gespeichert" indicator shows
- [ ] Save the form → draft is cleared, no stale draft reappears on next visit
- [ ] Fill in "Sucheinstellungen", verify free-tier room-size chip allows only 1 selection, Premium allows up to 3
- [ ] Visit `/profil/matches` with zero matches → empty state renders, no crash
- [ ] Visit `/profil/bewerbung` → "Als bereit markieren" stays disabled until the CHF 100 fee checkbox is ticked

### Premium / Stripe (use Stripe **test mode** keys first)
- [ ] Start checkout → redirected to Stripe → complete test payment → redirected back with `?premium=success`, profile shows "Premium aktiv" after the webhook fires
- [ ] Open "Abo verwalten" → redirected to Stripe Customer Portal → cancel subscription there → confirm `customer.subscription.deleted` flips `is_premium` to `false` in the DB
- [ ] Trigger a test failed payment in Stripe (test card `4000 0000 0000 0341`) → confirm `premium_status` becomes `failed`
- [ ] Confirm a cancelled/failed user no longer sees Premium-only filters unlocked

### Notifications
- [ ] Manually call `/api/notifications/process` with the correct `CRON_SECRET` → returns 200 with a sane `{ processed, sent, skipped, failed }` body
- [ ] Call it without the secret → 401
- [ ] Trigger a real match (two test accounts) → confirm exactly one `new_recommendation`/`mutual_match` email per user, not duplicated on repeated processor runs
- [ ] Toggle a notification preference off → confirm the corresponding event is marked `skipped`, no email sent

## 2. Dashboard checks

### Vercel
- [ ] Latest deployment is green (no failed build)
- [ ] Env vars present: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PREMIUM_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`
- [ ] Cron job for `/api/notifications/process` is registered and ran at least once (Hobby plan = once daily; see known limitation below)

### Supabase
- [ ] All pending migrations have been run in order: confirm `005_premium_payments.sql`, `006_add_stripe_subscription_id.sql`, `007_notifications.sql` have actually been applied in the SQL Editor (none of these were run by the assistant — verify manually)
- [ ] Auth → URL Configuration: Site URL = `https://homelio.ch`, Redirect URLs include `https://homelio.ch/**`
- [ ] Storage → `apartment-photos` bucket is **private** (not public)
- [ ] Spot-check RLS is still enabled on: `profiles`, `apartments`, `apartment_photos`, `search_preferences`, `matches`, `match_events`, `user_application_profiles`, `notification_events`, `notification_preferences`

### Stripe
- [ ] Webhook endpoint has these events enabled: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`
- [ ] Customer Portal is activated (Settings → Billing → Customer Portal) with cancellation enabled
- [ ] Confirm you're on **live** keys before accepting real payments (test mode keys must be swapped)

### Resend
- [ ] Sending domain for `RESEND_FROM_EMAIL` is verified (SPF/DKIM)
- [ ] Send a real test email through the processor route and confirm it doesn't land in spam

## 3. Known limitations

- **Cron frequency**: Vercel Hobby plan only allows once-daily cron jobs. `/api/notifications/process` currently runs at `0 8 * * *` (08:00 UTC). Real-time notification delivery requires Vercel Pro or an external cron service hitting the route more frequently — the route itself already supports this via `CRON_SECRET`.
- **Second search profile**: The Premium "Zweites Suchprofil" capability advertised conceptually is not built — the UI now honestly shows "folgen in einer späteren Version" instead of a non-functional input field (fixed this sprint).
- **Notification frequency setting**: `search_preferences.notify_frequency` (immediate/daily/weekly) is saved but no longer consumed — the real notification processor (built in Sprint 2) sends as soon as an event is queued, regardless of this setting. The field should either be removed from the UI or the processor should be extended to respect it in a future sprint.
- **Stripe customer deduplication**: Re-subscribing after a cancellation creates a *new* Stripe Customer record rather than reusing the original one (the checkout route doesn't pass an existing `customer` ID). Not a correctness bug — the webhook always re-syncs `stripe_customer_id` — but it can leave duplicate customer records in the Stripe dashboard over time.
- **`middleware.ts` naming**: Next.js 16 build output shows a deprecation notice recommending the file be renamed to `proxy.ts`. Functionally unaffected; left untouched this sprint to avoid risk to the auth-redirect logic during a QA pass.
- **Mobile testing**: This pass was a code-level review (grep for fixed pixel widths, overflow rules, tap-target sizes) — not a live test on physical devices. Recommend a manual pass on at least one small Android and one iOS device before public launch.

## 4. Risks

- **Legal text is still MVP-grade.** Both AGB and Datenschutz explicitly say so in their "Stand" line. They were updated this sprint to reflect the now-live Premium subscription and Stripe payment processing, but have not been reviewed by a lawyer.
- **No automated test suite.** All QA in this project to date has been manual/code-review based. A regression in, e.g., the matching score logic would not be caught automatically.
- **Single point of failure for emails**: if `RESEND_API_KEY`/`RESEND_FROM_EMAIL` are missing or Resend has an outage, notification events stay `pending` indefinitely (by design — they are not lost, just deferred) but users get no emails until it's fixed.
- **Success fee (CHF 100) has no invoicing/collection mechanism yet.** It is disclosed and acknowledged via checkbox, but there is no automated way to actually charge it. This is a manual/future process today.

## 5. What still requires human / legal review

- Full legal review of AGB and Datenschutz by a Swiss lawyer before any paid/contractual claims are made to real customers (both pages already state this themselves).
- Confirmation that the CHF 100 success-fee model is enforceable as currently worded (one-time fee, triggered by a signed Mietvertrag via a Homelio contact) — including how it will actually be invoiced and collected.
- Confirmation that Stripe subscription billing terms (CHF 9.95/month, auto-renewal, self-service cancellation via Customer Portal) meet Swiss consumer-protection requirements for recurring subscriptions.
- Data Processing Agreement / sub-processor disclosure check for Stripe, Resend, and Supabase against the Datenschutzerklärung's claims.
- Decision on whether `notify_frequency` should be removed from the UI or implemented properly (see known limitations).
