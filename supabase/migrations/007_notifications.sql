-- =============================================================================
-- Homelio – Real Email Notifications
-- Migration: 007_notifications.sql
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- Do NOT run via supabase CLI migration commands unless separately instructed.
-- =============================================================================
--
-- Changes:
--   1. notification_events: append-only event log, written by service_role only.
--      dedupe_key is UNIQUE so the scanner/processor can safely re-run without
--      ever creating or sending a duplicate notification.
--   2. notification_preferences: per-user opt-in/opt-out toggles, one row per
--      user, owner-managed (select/insert/update only — never delete).
--
-- RLS is NOT relaxed. Users can read their own notification history and manage
-- their own preferences, but cannot write notification_events directly — only
-- service_role (the notification processor) creates/updates those rows.
--
-- No destructive operations.
-- =============================================================================


-- ── 1. notification_events ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text        NOT NULL,
  match_id    uuid        NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  dedupe_key  text        NOT NULL UNIQUE,
  payload     jsonb       NOT NULL DEFAULT '{}',
  status      text        NOT NULL DEFAULT 'pending',
  attempts    integer     NOT NULL DEFAULT 0,
  last_error  text        NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz NULL,
  skipped_at  timestamptz NULL,
  CONSTRAINT notification_events_status_check
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped'))
);

CREATE INDEX IF NOT EXISTS notification_events_user_id_idx ON public.notification_events (user_id);
CREATE INDEX IF NOT EXISTS notification_events_status_idx  ON public.notification_events (status);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_events: owner select"
  ON public.notification_events FOR SELECT
  USING (auth.uid() = user_id);

-- No insert/update/delete policy for authenticated/anon — only the processor
-- (service_role) may write these rows.
CREATE POLICY "notification_events: service_role manage"
  ON public.notification_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.notification_events TO service_role;


-- ── 2. notification_preferences ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  new_recommendations boolean    NOT NULL DEFAULT true,
  other_interested    boolean    NOT NULL DEFAULT true,
  mutual_matches       boolean   NOT NULL DEFAULT true,
  dossier_reminders    boolean   NOT NULL DEFAULT true,
  premium_success      boolean   NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences: owner select"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences: owner insert"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences: owner update"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences: service_role select"
  ON public.notification_preferences FOR SELECT
  TO service_role
  USING (true);

GRANT SELECT ON public.notification_preferences TO service_role;
