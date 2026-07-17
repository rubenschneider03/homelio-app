-- =============================================================================
-- Homelio – Profile completion timestamp for Meta Pixel "ProfileCompleted"
-- Migration: 008_profile_completion.sql
-- Created: 2026-07-17
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- Do NOT run via supabase CLI migration commands unless separately instructed.
-- =============================================================================
--
-- "Complete" mirrors exactly the eligibility conditions of run_matching()
-- (003_run_matching.sql): onboarding done, an active apartment with
-- city/rooms/rent_gross, and search preferences with at least one actionable
-- criterion. This function is the ONLY definition of completeness — the
-- frontend never re-implements it.
--
-- The timestamp is set regardless of any cookie/marketing consent. Consent
-- only controls whether a Meta event is sent, never what Homelio knows
-- internally.
-- =============================================================================

ALTER TABLE profiles ADD COLUMN profile_completed_at timestamptz NULL;

-- Sets profile_completed_at exactly once (atomically) for the calling user.
-- Returns true ONLY on the first transition from incomplete to complete —
-- callers use this to fire one-time events. All later calls return false.
-- SECURITY INVOKER (default): RLS owner policies cover every table touched.
CREATE OR REPLACE FUNCTION mark_profile_completed_if_ready()
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_updated integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  UPDATE profiles p
     SET profile_completed_at = now()
   WHERE p.id = v_uid
     AND p.profile_completed_at IS NULL
     AND p.onboarding_completed_at IS NOT NULL
     AND EXISTS (
       SELECT 1
         FROM apartments a
        WHERE a.user_id = v_uid
          AND a.status = 'active'
          AND a.city       IS NOT NULL
          AND a.rooms      IS NOT NULL
          AND a.rent_gross IS NOT NULL
     )
     AND EXISTS (
       SELECT 1
         FROM search_preferences sp
        WHERE sp.user_id = v_uid
          AND (sp.city_region IS NOT NULL OR sp.max_rent_gross IS NOT NULL)
     );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- PostgreSQL functions are executable by PUBLIC by default. Restrict to
-- logged-in users; anon would only ever get `false` (auth.uid() IS NULL),
-- this makes the intent explicit.
REVOKE ALL ON FUNCTION public.mark_profile_completed_if_ready() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_profile_completed_if_ready() TO authenticated;
