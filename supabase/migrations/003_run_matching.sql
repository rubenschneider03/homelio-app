-- =============================================================================
-- Homelio MVP – Automatic 2-Party Matching
-- Migration: 003_run_matching.sql
-- =============================================================================
-- Creates two functions:
--
--   compute_directional_score(sp, is_premium, apt) → integer 0–100
--     Scores how well apartment `apt` satisfies the preferences in `sp`.
--     Pure computation — no database reads, no side effects.
--
--   run_matching() → void
--     Evaluates all eligible apartment pairs and upserts match rows.
--     Safe to run multiple times: ON CONFLICT updates scores only.
--     Never touches status_a, status_b, or is_mutual on existing rows.
--
-- Security:
--   run_matching() is SECURITY DEFINER (runs as postgres) so it can
--   read apartments and search_preferences across all users, bypassing
--   owner-only RLS. EXECUTE is restricted to service_role only.
--   compute_directional_score() is revoked from PUBLIC.
--
-- Privacy:
--   Neither function returns any row data to the caller.
--   Private apartment fields (street, house_nr, apt_nr, move_out_reason)
--   are never read or exposed.
--
-- Product rules:
--   2-party matching only. No chains. No AI.
--   A match is created only when BOTH directional scores >= 50.
-- =============================================================================


-- ── 1. Scoring helper ─────────────────────────────────────────────────────────

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

  -- City region: apartment.city must appear in the comma-separated list.
  -- Comparison is case-insensitive and whitespace-trimmed on both sides.
  IF p_sp.city_region IS NOT NULL AND p_apt.city IS NOT NULL THEN
    v_cities := string_to_array(p_sp.city_region, ',');
    IF NOT EXISTS (
      SELECT 1 FROM unnest(v_cities) AS c
      WHERE trim(c) ILIKE trim(p_apt.city)
    ) THEN
      RETURN 0;
    END IF;
  END IF;

  -- Max rent: apartment rent_gross must not exceed the user's stated budget.
  IF p_sp.max_rent_gross IS NOT NULL AND p_apt.rent_gross IS NOT NULL THEN
    IF p_apt.rent_gross > p_sp.max_rent_gross THEN
      RETURN 0;
    END IF;
  END IF;

  -- ── Hard knockouts: premium-only (skipped entirely for free users) ────────────

  IF p_is_premium THEN
    -- Boolean requirements: if the user requires it and the apartment lacks it → 0.
    -- NULL apartment values are treated as "unknown / not specified" and do not trigger
    -- the knockout — benefit of the doubt for incomplete listings.
    IF p_sp.requires_balcony        AND NOT p_apt.has_balcony               THEN RETURN 0; END IF;
    IF p_sp.requires_elevator       AND p_apt.has_elevator    = 'no'        THEN RETURN 0; END IF;
    IF p_sp.requires_parking        AND p_apt.parking_type    = 'none'      THEN RETURN 0; END IF;
    IF p_sp.has_pets                AND p_apt.pets_allowed    = 'no'        THEN RETURN 0; END IF;
    IF p_sp.requires_private_washer AND p_apt.laundry        != 'private'   THEN RETURN 0; END IF;
  END IF;

  -- ── Base score: all knockouts passed ─────────────────────────────────────────

  v_score := 50;

  -- ── Explicit bonuses only ─────────────────────────────────────────────────────
  -- Rule: NULL preference → no bonus, no penalty.
  -- A bonus is awarded only when the user has explicitly set the preference
  -- AND the apartment satisfies it.

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

-- Internal helper — not callable by any user-facing role.
REVOKE ALL ON FUNCTION compute_directional_score(search_preferences, boolean, apartments) FROM PUBLIC;


-- ── 2. Main matching function ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION run_matching()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_upserted integer;
BEGIN

  WITH candidate_scores AS (
    SELECT
      -- Canonical ordering enforced by JOIN condition a.id < b.id.
      -- apartment_a is always the smaller UUID; apartment_b is always the larger.
      a.user_id  AS user_a_id,
      b.user_id  AS user_b_id,
      a.id       AS apartment_a_id,
      b.id       AS apartment_b_id,
      -- score_a_sees_b: how well apartment_b fits user_a's preferences
      compute_directional_score(sp_a, pa.is_premium, b) AS score_ab,
      -- score_b_sees_a: how well apartment_a fits user_b's preferences
      compute_directional_score(sp_b, pb.is_premium, a) AS score_ba
    FROM apartments a
    JOIN apartments b
      ON a.id < b.id                        -- canonical order; excludes self-pairs
    JOIN search_preferences sp_a ON sp_a.user_id = a.user_id
    JOIN search_preferences sp_b ON sp_b.user_id = b.user_id
    JOIN profiles pa             ON pa.id         = a.user_id
    JOIN profiles pb             ON pb.id         = b.user_id
    WHERE
      -- Apartment A eligibility
          a.status     = 'active'
      AND a.city       IS NOT NULL
      AND a.rooms      IS NOT NULL
      AND a.rent_gross IS NOT NULL
      -- Apartment B eligibility
      AND b.status     = 'active'
      AND b.city       IS NOT NULL
      AND b.rooms      IS NOT NULL
      AND b.rent_gross IS NOT NULL
      -- Both users must have at least one actionable search criterion
      AND (sp_a.city_region IS NOT NULL OR sp_a.max_rent_gross IS NOT NULL)
      AND (sp_b.city_region IS NOT NULL OR sp_b.max_rent_gross IS NOT NULL)
  )
  INSERT INTO matches (
    user_a_id,
    user_b_id,
    apartment_a_id,
    apartment_b_id,
    status_a,
    status_b,
    is_mutual,
    score_a_sees_b,
    score_b_sees_a
  )
  SELECT
    user_a_id,
    user_b_id,
    apartment_a_id,
    apartment_b_id,
    'pending'::match_decision_enum,
    'pending'::match_decision_enum,
    false,
    score_ab,
    score_ba
  FROM candidate_scores
  WHERE score_ab >= 50 AND score_ba >= 50
  ON CONFLICT (apartment_a_id, apartment_b_id) DO UPDATE SET
    score_a_sees_b = EXCLUDED.score_a_sees_b,
    score_b_sees_a = EXCLUDED.score_b_sees_a,
    updated_at     = now();
  -- status_a, status_b, and is_mutual are intentionally excluded from DO UPDATE.
  -- User decisions (accept/decline) are managed exclusively by express_interest().

  GET DIAGNOSTICS v_upserted = ROW_COUNT;
  RAISE NOTICE 'run_matching(): % match row(s) created or updated', v_upserted;
END;
$$;

-- Callable by service_role only (for SQL Editor and future API route use).
-- Revoke from PUBLIC (which includes anon and authenticated) first.
REVOKE ALL   ON FUNCTION run_matching() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION run_matching() TO service_role;
