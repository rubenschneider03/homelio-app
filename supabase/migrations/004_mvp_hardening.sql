-- =============================================================================
-- Homelio MVP – Hardening Sprint
-- Migration: 004_mvp_hardening.sql
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- =============================================================================
--
-- Changes:
--   1. search_preferences: add desired_rooms numeric(3,1)[]
--      Free tier: up to 1 selection (enforced in UI only; DB stores the array)
--      Premium: up to 3 selections
--
--   2. user_application_profiles: new table for tenant dossier data
--      One row per user, owner-only RLS, used by /profil/matches
--
--   3. compute_directional_score: updated to include desired_rooms knockout
--      Free tier: apartment rooms must appear in desired_rooms (if set)
--
-- =============================================================================


-- ── 1. desired_rooms column ───────────────────────────────────────────────────

ALTER TABLE search_preferences
  ADD COLUMN IF NOT EXISTS desired_rooms numeric(3,1)[] NULL;


-- ── 2. user_application_profiles ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_application_profiles (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  full_name      text        NULL,
  phone          text        NULL,
  email          text        NULL,
  motivation     text        NULL,
  household_size text        NULL,   -- '1' | '2' | '3' | '4' | '5+'
  income_note    text        NULL,   -- free text
  status         text        NOT NULL DEFAULT 'draft',  -- 'draft' | 'ready'
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER user_application_profiles_updated_at
  BEFORE UPDATE ON user_application_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE user_application_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_application_profiles: owner select"
  ON user_application_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_application_profiles: owner insert"
  ON user_application_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_application_profiles: owner update"
  ON user_application_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 3. Updated compute_directional_score ─────────────────────────────────────
-- Adds desired_rooms knockout: if the user specified desired room sizes and the
-- apartment's room count is not in that list, the score is 0.
-- This applies to both free and premium users.

CREATE OR REPLACE FUNCTION compute_directional_score(
  p_sp         search_preferences,
  p_is_premium boolean,
  p_apt        apartments
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_score  integer := 0;
  v_cities text[];
BEGIN

  -- ── Hard knockouts: free-tier (always applied) ───────────────────────────────

  IF p_sp.city_region IS NOT NULL AND p_apt.city IS NOT NULL THEN
    v_cities := string_to_array(p_sp.city_region, ',');
    IF NOT EXISTS (
      SELECT 1 FROM unnest(v_cities) AS c
      WHERE trim(c) ILIKE trim(p_apt.city)
    ) THEN
      RETURN 0;
    END IF;
  END IF;

  IF p_sp.max_rent_gross IS NOT NULL AND p_apt.rent_gross IS NOT NULL THEN
    IF p_apt.rent_gross > p_sp.max_rent_gross THEN
      RETURN 0;
    END IF;
  END IF;

  -- Room size knockout: if desired_rooms is set and non-empty, the apartment
  -- rooms must appear in the array. Applies to both free and premium users.
  -- Free UI allows 1 selection; premium UI allows up to 3 — same DB column.
  IF p_sp.desired_rooms IS NOT NULL
     AND array_length(p_sp.desired_rooms, 1) > 0
     AND p_apt.rooms IS NOT NULL THEN
    IF NOT (p_apt.rooms = ANY(p_sp.desired_rooms)) THEN
      RETURN 0;
    END IF;
  END IF;

  -- ── Hard knockouts: premium-only ─────────────────────────────────────────────

  IF p_is_premium THEN
    IF p_sp.requires_balcony        AND NOT p_apt.has_balcony               THEN RETURN 0; END IF;
    IF p_sp.requires_elevator       AND p_apt.has_elevator    = 'no'        THEN RETURN 0; END IF;
    IF p_sp.requires_parking        AND p_apt.parking_type    = 'none'      THEN RETURN 0; END IF;
    IF p_sp.has_pets                AND p_apt.pets_allowed    = 'no'        THEN RETURN 0; END IF;
    IF p_sp.requires_private_washer AND p_apt.laundry        != 'private'   THEN RETURN 0; END IF;
  END IF;

  -- ── Base score ───────────────────────────────────────────────────────────────

  v_score := 50;

  -- ── Explicit bonuses (premium fields) ────────────────────────────────────────

  IF p_sp.rooms_min IS NOT NULL AND p_apt.rooms IS NOT NULL THEN
    IF p_apt.rooms >= p_sp.rooms_min THEN v_score := v_score + 8; END IF;
  END IF;

  IF p_sp.rooms_max IS NOT NULL AND p_apt.rooms IS NOT NULL THEN
    IF p_apt.rooms <= p_sp.rooms_max THEN v_score := v_score + 7; END IF;
  END IF;

  IF p_sp.area_min_sqm IS NOT NULL AND p_apt.area_sqm IS NOT NULL THEN
    IF p_apt.area_sqm >= p_sp.area_min_sqm THEN v_score := v_score + 10; END IF;
  END IF;

  IF p_sp.desired_move_in IS NOT NULL AND p_apt.earliest_move_out IS NOT NULL THEN
    IF p_apt.earliest_move_out <= p_sp.desired_move_in THEN v_score := v_score + 10; END IF;
  END IF;

  IF p_sp.noise_sensitivity IS NOT NULL AND p_apt.noise_level IS NOT NULL THEN
    IF p_sp.noise_sensitivity = 'high' AND p_apt.noise_level = 'quiet' THEN
      v_score := v_score + 5;
    END IF;
  END IF;

  IF p_sp.min_floor IS NOT NULL AND p_apt.floor IS NOT NULL THEN
    IF p_apt.floor >= p_sp.min_floor THEN v_score := v_score + 5; END IF;
  END IF;

  IF p_sp.sun_orientation IS NOT NULL AND p_apt.orientation IS NOT NULL THEN
    IF p_sp.sun_orientation = 'south' AND p_apt.orientation IN ('south', 'mixed') THEN
      v_score := v_score + 5;
    END IF;
  END IF;

  RETURN v_score;
END;
$$;

REVOKE ALL ON FUNCTION compute_directional_score(search_preferences, boolean, apartments) FROM PUBLIC;
